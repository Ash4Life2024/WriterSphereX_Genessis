async function handler({ audioUrl, transcription, userId }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const currentUserId = userId || session.user.id;

  if (!audioUrl && !transcription) {
    return { error: "Audio URL or transcription required" };
  }

  try {
    let finalTranscription = transcription;
    let detectedMood = "neutral";
    let extractedThemes = [];
    let poeticQuote = "";

    if (!finalTranscription && audioUrl) {
      const transcriptionResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: audioUrl,
            model: "whisper-1",
          }),
        }
      );

      if (transcriptionResponse.ok) {
        const transcriptionData = await transcriptionResponse.json();
        finalTranscription = transcriptionData.text;
      }
    }

    if (finalTranscription) {
      const analysisResponse = await fetch(
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
                content: `Analyze this journal entry and return a JSON response with:
            1. mood: one of [joyful, melancholic, anxious, peaceful, excited, frustrated, contemplative, grateful, lonely, hopeful, angry, content, nostalgic, curious, overwhelmed]
            2. themes: array of 2-3 main themes/topics
            3. intensity: number 1-10 for emotional intensity
            
            Return only valid JSON.`,
              },
              {
                role: "user",
                content: finalTranscription,
              },
            ],
          }),
        }
      );

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        try {
          const analysis = JSON.parse(analysisData.choices[0].message.content);
          detectedMood = analysis.mood || "neutral";
          extractedThemes = analysis.themes || [];
        } catch (e) {
          console.log("Analysis parsing failed, using defaults");
        }
      }

      const quoteResponse = await fetch(
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
                content: `You are Cael, the wise AI guide of WriterSphereX. Create a personalized, poetic quote that resonates with the user's current mood: ${detectedMood}. 
            
            Make it:
            - 1-2 sentences maximum
            - Inspiring and supportive
            - Poetic but not overly flowery
            - Relevant to writers and creators
            - Signed as "- Cael"
            
            Themes to consider: ${extractedThemes.join(", ")}`,
              },
              {
                role: "user",
                content: `My journal entry mood is ${detectedMood}. Give me an inspiring quote.`,
              },
            ],
          }),
        }
      );

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        poeticQuote = quoteData.choices[0].message.content;
      }
    }

    const voiceTriggerEvent = await sql`
      INSERT INTO voice_trigger_events (
        user_id, 
        trigger_type, 
        audio_url, 
        transcription, 
        confidence_score, 
        processed_successfully, 
        result_data
      ) VALUES (
        ${currentUserId}, 
        'journal_entry', 
        ${audioUrl}, 
        ${finalTranscription}, 
        0.95, 
        true, 
        ${JSON.stringify({
          mood: detectedMood,
          themes: extractedThemes,
          quote: poeticQuote,
        })}
      ) RETURNING id
    `;

    const journalEntry = await sql`
      INSERT INTO journal_entries (
        user_id,
        title,
        content,
        mood,
        themes,
        entry_type,
        audio_url,
        original_transcription,
        voice_trigger_id
      ) VALUES (
        ${currentUserId},
        ${`Voice Journal - ${new Date().toLocaleDateString()}`},
        ${finalTranscription || "Voice entry processed"},
        ${detectedMood},
        ${JSON.stringify(extractedThemes)},
        'voice',
        ${audioUrl},
        ${finalTranscription},
        ${voiceTriggerEvent[0].id}
      ) RETURNING *
    `;

    const voiceResponse = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "nova",
          input: `Your journal entry has been saved. I sense you're feeling ${detectedMood} today. ${poeticQuote}`,
        }),
      }
    );

    let responseAudioUrl = null;
    if (voiceResponse.ok) {
      const audioBuffer = await voiceResponse.arrayBuffer();
      const uploadResult = await upload({ buffer: audioBuffer });
      if (!uploadResult.error) {
        responseAudioUrl = uploadResult.url;
      }
    }

    return {
      success: true,
      journalEntry: journalEntry[0],
      analysis: {
        mood: detectedMood,
        themes: extractedThemes,
        transcription: finalTranscription,
      },
      caelResponse: {
        quote: poeticQuote,
        audioUrl: responseAudioUrl,
      },
      voiceTriggerId: voiceTriggerEvent[0].id,
    };
  } catch (error) {
    console.error("Voice trigger journal error:", error);

    await sql`
      INSERT INTO voice_trigger_events (
        user_id, 
        trigger_type, 
        audio_url, 
        transcription, 
        confidence_score, 
        processed_successfully, 
        result_data
      ) VALUES (
        ${currentUserId}, 
        'journal_entry', 
        ${audioUrl}, 
        ${transcription}, 
        0.0, 
        false, 
        ${JSON.stringify({ error: error.message })}
      )
    `;

    return {
      error: "Failed to process voice journal entry",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}