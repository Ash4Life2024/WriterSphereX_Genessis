async function handler({
  mood,
  tags,
  dateFrom,
  dateTo,
  voiceTriggered,
  limit = 20,
  offset = 0,
}) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  try {
    let queryParts = [
      "SELECT id, title, content, mood, themes, tags, entry_type, audio_url, created_at, updated_at FROM journal_entries WHERE user_id = $1",
    ];
    let values = [session.user.id];
    let paramCount = 1;

    if (mood) {
      paramCount++;
      queryParts.push(`AND mood = $${paramCount}`);
      values.push(mood);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      queryParts.push(`AND tags::text LIKE $${paramCount}`);
      values.push(`%${tags.join("%")}%`);
    }

    if (dateFrom) {
      paramCount++;
      queryParts.push(`AND created_at >= $${paramCount}`);
      values.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      queryParts.push(`AND created_at <= $${paramCount}`);
      values.push(dateTo);
    }

    if (voiceTriggered !== undefined) {
      paramCount++;
      queryParts.push(`AND entry_type = $${paramCount}`);
      values.push(voiceTriggered ? "voice" : "manual");
    }

    queryParts.push("ORDER BY created_at DESC");

    paramCount++;
    queryParts.push(`LIMIT $${paramCount}`);
    values.push(limit);

    paramCount++;
    queryParts.push(`OFFSET $${paramCount}`);
    values.push(offset);

    const query = queryParts.join(" ");
    const entries = await sql(query, values);

    const processedEntries = entries.map((entry) => {
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        themes: entry.themes ? JSON.parse(entry.themes) : [],
        tags: entry.tags ? JSON.parse(entry.tags) : [],
        entryType: entry.entry_type,
        audioUrl: entry.audio_url,
        voiceTriggered: entry.entry_type === "voice",
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
    });

    return {
      success: true,
      entries: processedEntries,
      pagination: {
        limit,
        offset,
        hasMore: entries.length === limit,
        total: processedEntries.length,
      },
    };
  } catch (error) {
    console.error("Error retrieving journal entries:", error);
    return { error: "Failed to retrieve journal entries" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}