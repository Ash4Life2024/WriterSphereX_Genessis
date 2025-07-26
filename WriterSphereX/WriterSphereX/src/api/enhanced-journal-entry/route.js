async function handler({
  action,
  uid,
  title,
  content,
  mood,
  tags,
  imageUrl,
  filters,
}) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const userId = session.user.id;

  try {
    switch (action) {
      case "create":
        return await createJournalEntry({
          userId,
          title,
          content,
          mood,
          tags,
          imageUrl,
        });

      case "get":
        return await getJournalEntries({ userId, filters });

      case "generateResponse":
        return await generateCaelResponse({ userId, content, mood });

      case "updatePreferences":
        return await updateUserPreferences({ userId, preferences: filters });

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function createJournalEntry({
  userId,
  title,
  content,
  mood,
  tags,
  imageUrl,
}) {
  const tagsArray = Array.isArray(tags)
    ? tags
    : tags
    ? tags.split(",").map((t) => t.trim())
    : [];

  const entry = await sql`
    INSERT INTO journal_entries (
      user_id, title, content, mood, tags, audio_url, entry_type, is_private
    ) VALUES (
      ${userId}, ${title}, ${content}, ${mood || "neutral"}, 
      ${JSON.stringify(tagsArray)}, ${imageUrl}, 'manual', true
    ) RETURNING *
  `;

  const caelResponse = await generateCaelResponse({ userId, content, mood });

  return {
    success: true,
    entry: entry[0],
    caelResponse: caelResponse.response,
  };
}

async function getJournalEntries({ userId, filters = {} }) {
  let query = "SELECT * FROM journal_entries WHERE user_id = $1";
  let params = [userId];
  let paramCount = 1;

  if (filters.mood && filters.mood !== "all") {
    paramCount++;
    query += ` AND mood = $${paramCount}`;
    params.push(filters.mood);
  }

  if (filters.tags && filters.tags.length > 0) {
    paramCount++;
    query += ` AND tags::jsonb ?| $${paramCount}`;
    params.push(filters.tags);
  }

  if (filters.dateFrom) {
    paramCount++;
    query += ` AND created_at >= $${paramCount}`;
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    paramCount++;
    query += ` AND created_at <= $${paramCount}`;
    params.push(filters.dateTo);
  }

  if (filters.search) {
    paramCount++;
    query += ` AND (LOWER(title) LIKE LOWER($${paramCount}) OR LOWER(content) LIKE LOWER($${paramCount}))`;
    params.push(`%${filters.search}%`);
  }

  query += " ORDER BY created_at DESC";

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  const entries = await sql(query, params);

  const entriesWithParsedTags = entries.map((entry) => ({
    ...entry,
    tags: typeof entry.tags === "string" ? JSON.parse(entry.tags) : entry.tags,
  }));

  return {
    success: true,
    entries: entriesWithParsedTags,
    total: entries.length,
  };
}

async function generateCaelResponse({ userId, content, mood }) {
  const moodPrompts = {
    happy:
      "Respond with joy and celebration, using uplifting metaphors and bright imagery",
    sad: "Respond with gentle compassion and understanding, offering comfort through poetic wisdom",
    anxious:
      "Respond with calming presence and grounding metaphors, bringing peace and stability",
    excited:
      "Match the energy with enthusiasm while adding thoughtful depth and wonder",
    reflective:
      "Respond with deep contemplation and philosophical insights, exploring meaning",
    grateful:
      "Respond with appreciation and recognition of beauty, highlighting connections",
    frustrated:
      "Respond with patient understanding and gentle guidance toward clarity",
    peaceful:
      "Respond with serene wisdom and tranquil imagery, maintaining the calm",
    neutral: "Respond with balanced insight and gentle encouragement",
  };

  const prompt = `You are Cael, a wise and poetic AI companion. The user has shared: "${content}"

Their current mood is: ${mood || "neutral"}

${moodPrompts[mood] || moodPrompts.neutral}

Respond in 2-3 sentences with:
- Poetic language and beautiful metaphors
- Deep emotional understanding
- Gentle wisdom and insight
- A voice that feels both ancient and timeless

Keep your response personal, meaningful, and under 150 words.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const caelResponse =
      data.choices?.[0]?.message?.content ||
      "Your words flow like a gentle stream, carrying wisdom I'm honored to witness.";

    await sql`
      INSERT INTO ai_chat_messages (session_id, role, content, emotion)
      VALUES (
        (SELECT id FROM ai_chat_sessions WHERE user_id = ${userId} AND is_active = true LIMIT 1),
        'assistant', ${caelResponse}, ${mood || "neutral"}
      )
    `;

    return { success: true, response: caelResponse };
  } catch (error) {
    const fallbackResponse = getFallbackCaelResponse(mood);
    return { success: true, response: fallbackResponse };
  }
}

function getFallbackCaelResponse(mood) {
  const fallbacks = {
    happy:
      "Your joy sparkles like morning dew on petals, a reminder that happiness blooms from within.",
    sad: "In sorrow's gentle embrace, we find the depth of our humanity. Your tears water the seeds of wisdom.",
    anxious:
      "Like waves finding shore, your worries will settle into calm. Breathe, and let peace find you.",
    excited:
      "Your enthusiasm burns bright as a star, illuminating possibilities yet unseen. What beautiful energy you carry.",
    reflective:
      "In quiet contemplation, the soul speaks its deepest truths. Your reflection honors the journey within.",
    grateful:
      "Gratitude transforms ordinary moments into sacred gifts. Your appreciation lights the world.",
    frustrated:
      "Even storms serve their purpose, clearing the air for clearer skies. Your feelings are valid and temporary.",
    peaceful:
      "In stillness, we touch the eternal. Your peace ripples outward like gentle circles on water.",
    neutral:
      "Your words carry the weight of authentic experience. I'm honored to witness your journey.",
  };

  return fallbacks[mood] || fallbacks.neutral;
}

async function updateUserPreferences({ userId, preferences }) {
  const existingPrefs = await sql`
    SELECT preference_value FROM user_preferences 
    WHERE user_id = ${userId} AND preference_key = 'journal_filters'
  `;

  const currentPrefs = existingPrefs[0]
    ? JSON.parse(existingPrefs[0].preference_value)
    : {};
  const updatedPrefs = { ...currentPrefs, ...preferences };

  if (existingPrefs.length > 0) {
    await sql`
      UPDATE user_preferences 
      SET preference_value = ${JSON.stringify(updatedPrefs)}, updated_at = NOW()
      WHERE user_id = ${userId} AND preference_key = 'journal_filters'
    `;
  } else {
    await sql`
      INSERT INTO user_preferences (user_id, preference_key, preference_value)
      VALUES (${userId}, 'journal_filters', ${JSON.stringify(updatedPrefs)})
    `;
  }

  return { success: true, preferences: updatedPrefs };
}
export async function POST(request) {
  return handler(await request.json());
}