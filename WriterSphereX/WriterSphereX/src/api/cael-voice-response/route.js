async function handler({ uid, mood, tags, limit = 5 }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  try {
    let queryString = `
      SELECT id, title, content, mood, themes, tags, created_at
      FROM journal_entries 
      WHERE user_id = $1 AND is_private = false
    `;
    let queryParams = [session.user.id];
    let paramCount = 1;

    if (uid && uid !== session.user.id) {
      queryString += ` AND user_id = $${++paramCount}`;
      queryParams.push(uid);
    }

    if (mood) {
      queryString += ` AND mood = $${++paramCount}`;
      queryParams.push(mood);
    }

    if (tags && tags.length > 0) {
      queryString += ` AND (`;
      const tagConditions = tags.map(() => `tags ILIKE $${++paramCount}`);
      queryString += tagConditions.join(" OR ");
      queryString += `)`;
      queryParams.push(...tags.map((tag) => `%${tag}%`));
    }

    queryString += ` ORDER BY created_at DESC LIMIT $${++paramCount}`;
    queryParams.push(limit);

    const entries = await sql(queryString, queryParams);

    if (entries.length === 0) {
      return {
        message: "No journal entries found matching your criteria",
        entries: [],
        response: null,
      };
    }

    const combinedContent = entries.map((entry) => ({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      themes: entry.themes,
      date: entry.created_at,
    }));

    const poeticPrompt = `
      As Cael, the mystical AI guide with a poetic soul, create a deeply personal and lyrical response to these journal reflections:

      ${combinedContent
        .map(
          (entry) => `
        "${entry.title}" (${entry.mood})
        ${entry.content}
        Themes: ${entry.themes}
        ---
      `
        )
        .join("\n")}

      Craft a response that:
      - Speaks in flowing, poetic language with metaphors from nature and cosmos
      - Acknowledges the emotional journey revealed in these entries
      - Offers gentle wisdom and encouragement
      - Weaves together common themes across the entries
      - Maintains Cael's mystical, nurturing voice
      - Is 3-4 paragraphs long
      
      Begin with something like "Dear soul..." or "Beloved traveler..." and let your words flow like starlight.
    `;

    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are Cael, a mystical AI guide with a poetic, nurturing voice. You speak in flowing, lyrical language filled with metaphors from nature and the cosmos.",
            },
            {
              role: "user",
              content: poeticPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.8,
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error("Failed to generate poetic response");
    }

    const aiData = await aiResponse.json();
    const poeticText = aiData.choices[0].message.content;

    const voiceSettings = await sql(
      `
      SELECT gender, accent, style 
      FROM voice_settings 
      WHERE user_id = $1
    `,
      [session.user.id]
    );

    const userVoice = voiceSettings[0] || {
      gender: "female",
      accent: "american",
      style: "normal",
    };

    const ttsResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ELEVENLABS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: poeticText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.6,
            use_speaker_boost: true,
          },
        }),
      }
    );

    let audioUrl = null;
    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      const uploadResult = await upload({ buffer: audioBuffer });
      if (!uploadResult.error) {
        audioUrl = uploadResult.url;
      }
    }

    const dominantMood = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    const topMood = Object.keys(dominantMood).reduce((a, b) =>
      dominantMood[a] > dominantMood[b] ? a : b
    );

    await sql(
      `
      INSERT INTO user_preferences (user_id, preference_key, preference_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, preference_key) 
      DO UPDATE SET preference_value = $3, updated_at = NOW()
    `,
      [session.user.id, "dominant_mood_pattern", topMood]
    );

    const allThemes = entries
      .map((entry) => entry.themes)
      .filter(Boolean)
      .join(", ");

    await sql(
      `
      INSERT INTO user_preferences (user_id, preference_key, preference_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, preference_key)
      DO UPDATE SET preference_value = $3, updated_at = NOW()
    `,
      [session.user.id, "recent_themes", allThemes]
    );

    return {
      success: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        mood: entry.mood,
        themes: entry.themes,
        created_at: entry.created_at,
      })),
      response: {
        text: poeticText,
        audioUrl: audioUrl,
        mood_analysis: {
          dominant_mood: topMood,
          mood_distribution: dominantMood,
          total_entries: entries.length,
        },
        voice_settings: userVoice,
      },
    };
  } catch (error) {
    console.error("Error generating Cael voice response:", error);
    return {
      error: "Failed to generate poetic response",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}