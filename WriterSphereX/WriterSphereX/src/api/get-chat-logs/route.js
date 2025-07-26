async function handler({ uid, limit = 50 }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  try {
    let query = `
      SELECT 
        acm.id,
        acs.user_id as uid,
        CASE WHEN acm.role = 'user' THEN acm.content ELSE NULL END as messageIn,
        CASE WHEN acm.role = 'assistant' THEN acm.content ELSE NULL END as messageOut,
        acm.created_at as timestamp,
        acm.session_id,
        acm.role
      FROM ai_chat_messages acm
      JOIN ai_chat_sessions acs ON acm.session_id = acs.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (uid) {
      query += ` AND acs.user_id = $${paramCount}`;
      params.push(parseInt(uid));
      paramCount++;
    } else {
      query += ` AND acs.user_id = $${paramCount}`;
      params.push(session.user.id);
      paramCount++;
    }

    query += ` ORDER BY acm.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }

    const messages = await sql(query, params);

    const chatLogs = [];
    const sessionGroups = {};

    for (const message of messages) {
      if (!sessionGroups[message.session_id]) {
        sessionGroups[message.session_id] = {
          uid: message.uid,
          messageIn: null,
          messageOut: null,
          timestamp: message.timestamp,
          messages: [],
        };
      }

      sessionGroups[message.session_id].messages.push(message);
    }

    for (const sessionId in sessionGroups) {
      const group = sessionGroups[sessionId];
      const sortedMessages = group.messages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      for (let i = 0; i < sortedMessages.length; i++) {
        const message = sortedMessages[i];

        if (message.role === "user") {
          const nextMessage = sortedMessages[i + 1];
          chatLogs.push({
            uid: message.uid,
            messageIn: message.content,
            messageOut:
              nextMessage && nextMessage.role === "assistant"
                ? nextMessage.content
                : null,
            timestamp: message.timestamp,
          });
        }
      }
    }

    return chatLogs.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error("Error retrieving chat logs:", error);
    return { error: "Failed to retrieve chat logs" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}