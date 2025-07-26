async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  const userId = session.user.id;
  const testResults = {
    timestamp: new Date().toISOString(),
    userId: userId,
    tests: {},
    summary: {
      passed: 0,
      failed: 0,
      total: 0,
    },
  };

  async function runTest(testName, testFunction) {
    testResults.tests[testName] = {
      status: "running",
      startTime: new Date().toISOString(),
    };

    try {
      const result = await testFunction();
      testResults.tests[testName] = {
        status: "passed",
        startTime: testResults.tests[testName].startTime,
        endTime: new Date().toISOString(),
        result: result,
      };
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests[testName] = {
        status: "failed",
        startTime: testResults.tests[testName].startTime,
        endTime: new Date().toISOString(),
        error: error.message,
      };
      testResults.summary.failed++;
    }
    testResults.summary.total++;
  }

  await runTest("chatLogs_create", async () => {
    const testChatLog = {
      user_id: userId,
      session_name: `Test Session ${Date.now()}`,
      messages: JSON.stringify([
        {
          role: "user",
          content: "Hello, test message",
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: "Hello! This is a test response.",
          timestamp: new Date().toISOString(),
        },
      ]),
      created_at: new Date().toISOString(),
    };

    const result = await sql`
      INSERT INTO ai_chat_sessions (user_id, session_name, created_at)
      VALUES (${userId}, ${testChatLog.session_name}, NOW())
      RETURNING id, session_name, created_at
    `;

    if (result.length > 0) {
      const sessionId = result[0].id;

      await sql`
        INSERT INTO ai_chat_messages (session_id, role, content, created_at)
        VALUES 
          (${sessionId}, 'user', 'Hello, test message', NOW()),
          (${sessionId}, 'assistant', 'Hello! This is a test response.', NOW())
      `;

      return {
        sessionId,
        sessionName: testChatLog.session_name,
        messagesCreated: 2,
      };
    }
    throw new Error("Failed to create chat session");
  });

  await runTest("chatLogs_read", async () => {
    const sessions = await sql`
      SELECT cs.id, cs.session_name, cs.created_at,
             COUNT(cm.id) as message_count
      FROM ai_chat_sessions cs
      LEFT JOIN ai_chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = ${userId}
      GROUP BY cs.id, cs.session_name, cs.created_at
      ORDER BY cs.created_at DESC
      LIMIT 5
    `;

    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      const messages = await sql`
        SELECT role, content, created_at
        FROM ai_chat_messages
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC
      `;

      return {
        sessionsFound: sessions.length,
        latestSession: sessions[0],
        messagesInLatest: messages.length,
        sampleMessages: messages.slice(0, 2),
      };
    }
    throw new Error("No chat sessions found");
  });

  await runTest("journalEntries_create", async () => {
    const testEntry = {
      title: `Test Journal Entry ${Date.now()}`,
      content: "This is a test journal entry for Firebase integration testing.",
      mood: "productive",
      tags: JSON.stringify(["test", "firebase", "integration"]),
    };

    const result = await sql`
      INSERT INTO posts (user_id, content, created_at)
      VALUES (${userId}, ${JSON.stringify(testEntry)}, NOW())
      RETURNING id, content, created_at
    `;

    if (result.length > 0) {
      return {
        entryId: result[0].id,
        title: testEntry.title,
        created: result[0].created_at,
      };
    }
    throw new Error("Failed to create journal entry");
  });

  await runTest("journalEntries_read", async () => {
    const entries = await sql`
      SELECT id, content, created_at, updated_at
      FROM posts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return {
      entriesFound: entries.length,
      latestEntries: entries.map((entry) => ({
        id: entry.id,
        content:
          typeof entry.content === "string"
            ? entry.content.substring(0, 100) + "..."
            : entry.content,
        created_at: entry.created_at,
      })),
    };
  });

  await runTest("userPreferences_create", async () => {
    const testPreferences = [
      { key: "theme", value: "dark" },
      { key: "notifications", value: "enabled" },
      { key: "autoSave", value: "true" },
      { key: "testTimestamp", value: Date.now().toString() },
    ];

    const results = [];
    for (const pref of testPreferences) {
      const result = await sql`
        INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
        VALUES (${userId}, ${pref.key}, ${pref.value}, NOW(), NOW())
        ON CONFLICT (user_id, preference_key) 
        DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = NOW()
        RETURNING preference_key, preference_value
      `;
      results.push(result[0]);
    }

    return { preferencesSet: results.length, preferences: results };
  });

  await runTest("userPreferences_read", async () => {
    const preferences = await sql`
      SELECT preference_key, preference_value, updated_at
      FROM user_preferences
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;

    const prefsObject = {};
    preferences.forEach((pref) => {
      prefsObject[pref.preference_key] = pref.preference_value;
    });

    return {
      preferencesFound: preferences.length,
      preferences: prefsObject,
      lastUpdated: preferences[0]?.updated_at,
    };
  });

  await runTest("feedback_create", async () => {
    const testFeedback = {
      type: "integration_test",
      content: "This is test feedback for Firebase integration testing.",
      severity: "info",
      metadata: JSON.stringify({
        testRun: true,
        timestamp: Date.now(),
        userAgent: "WriterSphereX-Test",
      }),
    };

    const result = await sql`
      INSERT INTO story_feedback (story_id, feedback_type, content, severity, created_at)
      VALUES (1, ${testFeedback.type}, ${testFeedback.content}, ${testFeedback.severity}, NOW())
      RETURNING id, feedback_type, content, severity, created_at
    `;

    if (result.length > 0) {
      return {
        feedbackId: result[0].id,
        type: result[0].feedback_type,
        created: result[0].created_at,
      };
    }
    throw new Error("Failed to create feedback");
  });

  await runTest("feedback_read", async () => {
    const feedback = await sql`
      SELECT id, feedback_type, content, severity, created_at
      FROM story_feedback
      WHERE feedback_type = 'integration_test'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return {
      feedbackFound: feedback.length,
      latestFeedback: feedback.map((f) => ({
        id: f.id,
        type: f.feedback_type,
        content: f.content.substring(0, 50) + "...",
        severity: f.severity,
        created_at: f.created_at,
      })),
    };
  });

  await runTest("database_connectivity", async () => {
    const connectionTest =
      await sql`SELECT NOW() as current_time, version() as db_version`;
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_chat_sessions', 'ai_chat_messages', 'posts', 'user_preferences', 'story_feedback')
      ORDER BY table_name
    `;

    return {
      connected: true,
      serverTime: connectionTest[0].current_time,
      dbVersion: connectionTest[0].db_version.split(" ")[0],
      requiredTables: tableCheck.map((t) => t.table_name),
      tablesFound: tableCheck.length,
    };
  });

  await runTest("cleanup_test_data", async () => {
    const cleanupResults = await sql.transaction([
      sql`DELETE FROM ai_chat_messages WHERE session_id IN (
        SELECT id FROM ai_chat_sessions 
        WHERE user_id = ${userId} AND session_name LIKE 'Test Session%'
      )`,
      sql`DELETE FROM ai_chat_sessions WHERE user_id = ${userId} AND session_name LIKE 'Test Session%'`,
      sql`DELETE FROM story_feedback WHERE feedback_type = 'integration_test'`,
      sql`DELETE FROM user_preferences WHERE user_id = ${userId} AND preference_key = 'testTimestamp'`,
    ]);

    return {
      messagesDeleted: cleanupResults[0].length || 0,
      sessionsDeleted: cleanupResults[1].length || 0,
      feedbackDeleted: cleanupResults[2].length || 0,
      preferencesDeleted: cleanupResults[3].length || 0,
    };
  });

  const overallStatus = testResults.summary.failed === 0 ? "PASSED" : "FAILED";
  const successRate = (
    (testResults.summary.passed / testResults.summary.total) *
    100
  ).toFixed(1);

  return {
    status: overallStatus,
    successRate: `${successRate}%`,
    summary: testResults.summary,
    completedAt: new Date().toISOString(),
    testResults: testResults,
    firebaseIntegration: {
      status: overallStatus,
      collections: {
        chatLogs:
          testResults.tests.chatLogs_create?.status === "passed" &&
          testResults.tests.chatLogs_read?.status === "passed",
        journalEntries:
          testResults.tests.journalEntries_create?.status === "passed" &&
          testResults.tests.journalEntries_read?.status === "passed",
        userPreferences:
          testResults.tests.userPreferences_create?.status === "passed" &&
          testResults.tests.userPreferences_read?.status === "passed",
        feedback:
          testResults.tests.feedback_create?.status === "passed" &&
          testResults.tests.feedback_read?.status === "passed",
      },
      connectivity:
        testResults.tests.database_connectivity?.status === "passed",
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}