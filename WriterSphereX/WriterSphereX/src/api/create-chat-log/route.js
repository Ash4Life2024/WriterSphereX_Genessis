async function handler({ uid, messageIn, messageOut }) {
  if (!uid || !messageIn || !messageOut) {
    return {
      success: false,
      error:
        "Missing required parameters: uid, messageIn, and messageOut are required",
    };
  }

  try {
    const session = getSession();
    if (!session || !session.user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const chatLogEntry = {
      uid: uid,
      messageIn: messageIn,
      messageOut: messageOut,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: session.user.id,
    };

    const result = await sql`
      INSERT INTO ai_chat_messages (session_id, role, content, created_at)
      VALUES (
        (SELECT id FROM ai_chat_sessions WHERE user_id = ${session.user.id} AND is_active = true LIMIT 1),
        'user',
        ${messageIn},
        NOW()
      )
      RETURNING id
    `;

    const userMessageId = result[0]?.id;

    const assistantResult = await sql`
      INSERT INTO ai_chat_messages (session_id, role, content, created_at)
      VALUES (
        (SELECT id FROM ai_chat_sessions WHERE user_id = ${session.user.id} AND is_active = true LIMIT 1),
        'assistant', 
        ${messageOut},
        NOW()
      )
      RETURNING id
    `;

    const assistantMessageId = assistantResult[0]?.id;

    if (!userMessageId || !assistantMessageId) {
      let sessionResult = await sql`
        INSERT INTO ai_chat_sessions (user_id, session_name, is_active, created_at)
        VALUES (${session.user.id}, 'Chat Session', true, NOW())
        RETURNING id
      `;

      const sessionId = sessionResult[0].id;

      const userRetry = await sql`
        INSERT INTO ai_chat_messages (session_id, role, content, created_at)
        VALUES (${sessionId}, 'user', ${messageIn}, NOW())
        RETURNING id
      `;

      const assistantRetry = await sql`
        INSERT INTO ai_chat_messages (session_id, role, content, created_at)
        VALUES (${sessionId}, 'assistant', ${messageOut}, NOW())
        RETURNING id
      `;

      return {
        success: true,
        documentId: `${userRetry[0].id}_${assistantRetry[0].id}`,
        sessionId: sessionId,
        userMessageId: userRetry[0].id,
        assistantMessageId: assistantRetry[0].id,
        timestamp: chatLogEntry.timestamp,
      };
    }

    return {
      success: true,
      documentId: `${userMessageId}_${assistantMessageId}`,
      userMessageId: userMessageId,
      assistantMessageId: assistantMessageId,
      timestamp: chatLogEntry.timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create chat log entry: " + error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}