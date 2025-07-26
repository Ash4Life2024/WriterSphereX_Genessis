async function handler({ title, content, mood, tags, voice_trigger_id }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  if (!mood) {
    return { error: "Mood is required" };
  }

  try {
    const journalEntry = {
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      mood: mood.trim(),
      themes: JSON.stringify([]), // Will be populated by AI analysis later
      tags: JSON.stringify(
        Array.isArray(tags) ? tags.filter((tag) => tag && tag.trim()) : []
      ),
      entry_type: voice_trigger_id ? "voice" : "manual",
      voice_trigger_id: voice_trigger_id || null,
      is_private: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await sql`
      INSERT INTO journal_entries (
        user_id, title, content, mood, themes, tags, 
        entry_type, voice_trigger_id, is_private, created_at, updated_at
      )
      VALUES (
        ${journalEntry.user_id}, ${journalEntry.title}, ${journalEntry.content},
        ${journalEntry.mood}, ${journalEntry.themes}, ${journalEntry.tags},
        ${journalEntry.entry_type}, ${journalEntry.voice_trigger_id}, ${journalEntry.is_private},
        NOW(), NOW()
      )
      RETURNING id, title, mood, tags, entry_type, created_at
    `;

    if (result.length === 0) {
      return { error: "Failed to create journal entry" };
    }

    const entry = result[0];

    return {
      success: true,
      document_id: entry.id,
      message: "Journal entry created successfully",
      entry: {
        id: entry.id,
        title: entry.title,
        mood: entry.mood,
        tags: JSON.parse(entry.tags),
        voice_triggered: entry.entry_type === "voice",
        created_at: entry.created_at,
      },
    };
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return { error: "Failed to create journal entry" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}