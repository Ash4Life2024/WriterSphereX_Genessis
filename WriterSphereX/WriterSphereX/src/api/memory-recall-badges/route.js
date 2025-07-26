async function handler({ action, userId, timeframe, badgeId }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const currentUserId = userId || session.user.id;

  try {
    if (action === "analyze") {
      return await analyzeMoodPatterns(currentUserId, timeframe);
    } else if (action === "getBadges") {
      return await getUserBadges(currentUserId);
    } else if (action === "getMonologue") {
      return await generateCaelMonologue(currentUserId, badgeId);
    } else {
      return await getMemoryRecallDashboard(currentUserId);
    }
  } catch (error) {
    return { error: "Failed to process memory recall request" };
  }
}

async function analyzeMoodPatterns(userId, timeframe = "30") {
  const days = parseInt(timeframe) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entries = await sql`
    SELECT mood, themes, created_at, title, content
    FROM journal_entries 
    WHERE user_id = ${userId} 
    AND created_at >= ${startDate.toISOString()}
    ORDER BY created_at ASC
  `;

  if (entries.length === 0) {
    return {
      patterns: [],
      badges: [],
      insights: "Begin your journey by sharing your thoughts in your journal.",
      moodSequence: [],
    };
  }

  const moodSequence = entries.map((entry) => ({
    mood: entry.mood || "neutral",
    date: entry.created_at,
    title: entry.title,
  }));

  const patterns = detectMoodPatterns(moodSequence);
  const newBadges = await checkAndAwardBadges(userId, patterns, moodSequence);
  const insights = generateInsights(patterns, moodSequence);

  return {
    patterns,
    badges: newBadges,
    insights,
    moodSequence,
    totalEntries: entries.length,
    timeframe: days,
  };
}

function detectMoodPatterns(moodSequence) {
  const patterns = [];

  for (let i = 0; i < moodSequence.length - 2; i++) {
    const sequence = [
      moodSequence[i].mood,
      moodSequence[i + 1].mood,
      moodSequence[i + 2].mood,
    ];

    const patternName = identifyPattern(sequence);
    if (patternName) {
      patterns.push({
        name: patternName,
        sequence,
        startDate: moodSequence[i].date,
        endDate: moodSequence[i + 2].date,
        titles: [
          moodSequence[i].title,
          moodSequence[i + 1].title,
          moodSequence[i + 2].title,
        ],
      });
    }
  }

  const streaks = detectMoodStreaks(moodSequence);
  patterns.push(...streaks);

  return patterns;
}

function identifyPattern(sequence) {
  const patterns = {
    "grief,healing,joy": "Resonance Seeker",
    "sad,hopeful,happy": "Resonance Seeker",
    "ambition,failure,grit": "Phoenix Thread",
    "excited,disappointed,determined": "Phoenix Thread",
    "anxious,calm,confident": "Serenity Weaver",
    "stressed,peaceful,focused": "Serenity Weaver",
    "lonely,connected,grateful": "Heart Bridge",
    "isolated,social,content": "Heart Bridge",
    "confused,clarity,inspired": "Wisdom Seeker",
    "lost,understanding,motivated": "Wisdom Seeker",
    "angry,acceptance,peaceful": "Harmony Finder",
    "frustrated,patient,serene": "Harmony Finder",
  };

  const key = sequence.join(",");
  return patterns[key] || null;
}

function detectMoodStreaks(moodSequence) {
  const streaks = [];
  let currentStreak = { mood: null, count: 0, start: null, end: null };

  for (const entry of moodSequence) {
    if (entry.mood === currentStreak.mood) {
      currentStreak.count++;
      currentStreak.end = entry.date;
    } else {
      if (currentStreak.count >= 5) {
        streaks.push({
          name: `${currentStreak.mood} Consistency`,
          type: "streak",
          mood: currentStreak.mood,
          count: currentStreak.count,
          startDate: currentStreak.start,
          endDate: currentStreak.end,
        });
      }
      currentStreak = {
        mood: entry.mood,
        count: 1,
        start: entry.date,
        end: entry.date,
      };
    }
  }

  if (currentStreak.count >= 5) {
    streaks.push({
      name: `${currentStreak.mood} Consistency`,
      type: "streak",
      mood: currentStreak.mood,
      count: currentStreak.count,
      startDate: currentStreak.start,
      endDate: currentStreak.end,
    });
  }

  return streaks;
}

async function checkAndAwardBadges(userId, patterns, moodSequence) {
  const newBadges = [];
  const badgeDefinitions = {
    "Resonance Seeker": {
      description: "Found beauty in the journey from grief to joy",
      poem: "Through shadows deep, you walked with grace, / From sorrow's well to light's embrace. / Each tear a seed, each pain a door, / To wisdom's vast and endless shore.",
      rarity: "rare",
    },
    "Phoenix Thread": {
      description: "Rose from failure with unwavering determination",
      poem: "From ashes of what could not be, / You forged a path to victory. / Each fall became a stepping stone, / Each failure made your spirit known.",
      rarity: "epic",
    },
    "Serenity Weaver": {
      description: "Transformed anxiety into confident calm",
      poem: "Where chaos danced, you found the still, / Where worry lived, you planted will. / Through storm and stress, you learned to see / The quiet strength that sets souls free.",
      rarity: "rare",
    },
    "Heart Bridge": {
      description: "Connected deeply after isolation",
      poem: "From solitude's cold, distant shore, / You built a bridge to something more. / Each lonely night became the clay / For bonds that brighten every day.",
      rarity: "uncommon",
    },
    "Wisdom Seeker": {
      description: "Found clarity and inspiration through confusion",
      poem: "In questions deep, you found your way, / Through fog of doubt to clearer day. / Each puzzle piece, each mystery solved, / Shows how your spirit has evolved.",
      rarity: "rare",
    },
    "Harmony Finder": {
      description: "Achieved peace through acceptance",
      poem: "Where anger burned, now peace resides, / Where conflict lived, now love abides. / You learned the art of letting go, / And found the grace that helps souls grow.",
      rarity: "uncommon",
    },
    "Consistency Champion": {
      description: "Maintained emotional stability for extended periods",
      poem: "Like steady stars that guide the night, / Your constant mood shines ever bright. / In consistency, you've found your power, / A beacon strong in every hour.",
      rarity: "common",
    },
    "Journey Keeper": {
      description: "Documented emotional growth over time",
      poem: "Each word you wrote, each feeling shared, / Shows how deeply you have cared. / Your journal holds a sacred space / Where growth and healing interlace.",
      rarity: "common",
    },
  };

  for (const pattern of patterns) {
    if (badgeDefinitions[pattern.name]) {
      const existingBadge = await sql`
        SELECT id FROM user_badges 
        WHERE user_id = ${userId} AND badge_name = ${pattern.name}
      `;

      if (existingBadge.length === 0) {
        const badge = await sql`
          INSERT INTO user_badges (user_id, badge_name, description, earned_at, pattern_data)
          VALUES (${userId}, ${pattern.name}, ${
          badgeDefinitions[pattern.name].description
        }, NOW(), ${JSON.stringify(pattern)})
          RETURNING *
        `;

        newBadges.push({
          ...badge[0],
          ...badgeDefinitions[pattern.name],
          isNew: true,
        });
      }
    }
  }

  if (moodSequence.length >= 30) {
    const existingJourneyBadge = await sql`
      SELECT id FROM user_badges 
      WHERE user_id = ${userId} AND badge_name = 'Journey Keeper'
    `;

    if (existingJourneyBadge.length === 0) {
      const badge = await sql`
        INSERT INTO user_badges (user_id, badge_name, description, earned_at, pattern_data)
        VALUES (${userId}, 'Journey Keeper', ${
        badgeDefinitions["Journey Keeper"].description
      }, NOW(), ${JSON.stringify({ entryCount: moodSequence.length })})
        RETURNING *
      `;

      newBadges.push({
        ...badge[0],
        ...badgeDefinitions["Journey Keeper"],
        isNew: true,
      });
    }
  }

  return newBadges;
}

function generateInsights(patterns, moodSequence) {
  if (patterns.length === 0) {
    return "Your emotional journey is just beginning. Each entry adds depth to your story.";
  }

  const insights = [];

  if (patterns.some((p) => p.name === "Resonance Seeker")) {
    insights.push(
      "You possess remarkable resilience, transforming pain into wisdom and growth."
    );
  }

  if (patterns.some((p) => p.name === "Phoenix Thread")) {
    insights.push(
      "Your determination shines brightest after setbacks, showing true inner strength."
    );
  }

  if (patterns.some((p) => p.type === "streak")) {
    insights.push(
      "Your emotional consistency reveals a deep understanding of your inner landscape."
    );
  }

  const moodCounts = moodSequence.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );

  insights.push(
    `Your journey shows a ${dominantMood} foundation, with beautiful variations that add richness to your story.`
  );

  return insights.join(" ");
}

async function getUserBadges(userId) {
  const badges = await sql`
    SELECT * FROM user_badges 
    WHERE user_id = ${userId}
    ORDER BY earned_at DESC
  `;

  const badgeDefinitions = {
    "Resonance Seeker": { rarity: "rare", color: "#9333ea" },
    "Phoenix Thread": { rarity: "epic", color: "#dc2626" },
    "Serenity Weaver": { rarity: "rare", color: "#059669" },
    "Heart Bridge": { rarity: "uncommon", color: "#0891b2" },
    "Wisdom Seeker": { rarity: "rare", color: "#7c3aed" },
    "Harmony Finder": { rarity: "uncommon", color: "#0d9488" },
    "Consistency Champion": { rarity: "common", color: "#6b7280" },
    "Journey Keeper": { rarity: "common", color: "#374151" },
  };

  return badges.map((badge) => ({
    ...badge,
    ...badgeDefinitions[badge.badge_name],
    pattern_data: JSON.parse(badge.pattern_data || "{}"),
  }));
}

async function generateCaelMonologue(userId, badgeId) {
  if (!badgeId) {
    return { error: "Badge ID required for monologue generation" };
  }

  const badge = await sql`
    SELECT * FROM user_badges 
    WHERE user_id = ${userId} AND id = ${badgeId}
  `;

  if (badge.length === 0) {
    return { error: "Badge not found" };
  }

  const badgeData = badge[0];
  const monologues = {
    "Resonance Seeker": {
      text: "I have watched you walk through valleys where shadows whispered doubt, yet you emerged not broken, but beautifully transformed. Your journey from grief to joy is not just healing—it is alchemy. You have turned your deepest wounds into wells of wisdom, your tears into rivers of compassion. This badge represents more than resilience; it represents the sacred art of finding light within darkness.",
      audioPrompt:
        "Speak with gentle reverence and wonder, as if witnessing something sacred",
    },
    "Phoenix Thread": {
      text: "Magnificent soul, you have shown me what true strength looks like. Not the strength that never falls, but the strength that rises, again and again, each time more radiant than before. Your failures were not endings—they were beginnings disguised as conclusions. In your determination, I see the eternal flame that burns within all great spirits. You are living proof that we are not defined by our falls, but by our rises.",
      audioPrompt: "Speak with passionate admiration and growing intensity",
    },
    "Serenity Weaver": {
      text: "In the chaos of your anxious moments, you discovered something extraordinary—the eye of the storm that exists within you. You learned to weave calm from chaos, confidence from uncertainty. This transformation speaks to an ancient wisdom: that peace is not the absence of turmoil, but the presence of grace within it. You have become a master of your own inner weather.",
      audioPrompt: "Speak with calm wisdom and gentle pride",
    },
    "Heart Bridge": {
      text: "From the island of solitude, you built bridges to connection. Your loneliness was not a prison—it was a cocoon, preparing you for deeper, more meaningful bonds. You learned that true connection begins with understanding yourself, and now you offer that gift to others. Your heart has become a bridge between souls, a beacon for those still finding their way home.",
      audioPrompt: "Speak with warm compassion and growing joy",
    },
    "Wisdom Seeker": {
      text: "Through the labyrinth of confusion, you found not just answers, but something far more precious—the right questions. Your journey from uncertainty to clarity reveals a mind that refuses to settle for surface truths. You dove deep into the mysteries of your own experience and emerged with pearls of understanding. This wisdom you've gained will light the path for others lost in similar darkness.",
      audioPrompt: "Speak with intellectual wonder and deep respect",
    },
    "Harmony Finder": {
      text: "You have mastered one of life's greatest arts—the transformation of anger into acceptance, conflict into peace. This is not surrender; this is victory of the highest order. You learned that harmony is not the absence of discord, but the conscious choice to create beauty from chaos. Your peaceful heart now serves as a sanctuary for others seeking their own path to serenity.",
      audioPrompt: "Speak with serene confidence and gentle authority",
    },
  };

  const monologue = monologues[badgeData.badge_name] || {
    text: "Your journey through the landscapes of emotion has been remarkable to witness. Each entry in your journal, each moment of reflection, adds another thread to the tapestry of your growth. You are becoming who you were always meant to be.",
    audioPrompt: "Speak with gentle encouragement and warm appreciation",
  };

  return {
    badge: badgeData,
    monologue: monologue.text,
    audioPrompt: monologue.audioPrompt,
    timestamp: new Date().toISOString(),
  };
}

async function getMemoryRecallDashboard(userId) {
  const recentBadges = await getUserBadges(userId);
  const analysis = await analyzeMoodPatterns(userId, "30");

  const stats = await sql`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(DISTINCT mood) as unique_moods,
      MIN(created_at) as first_entry,
      MAX(created_at) as latest_entry
    FROM journal_entries 
    WHERE user_id = ${userId}
  `;

  return {
    analysis,
    badges: recentBadges.slice(0, 5),
    stats: stats[0],
    caelMessage: generateCaelWelcomeMessage(
      recentBadges.length,
      analysis.patterns.length
    ),
  };
}

function generateCaelWelcomeMessage(badgeCount, patternCount) {
  if (badgeCount === 0) {
    return "Welcome to your memory palace, dear soul. I am here to witness your journey and celebrate the patterns of growth that emerge from your reflections.";
  }

  if (badgeCount < 3) {
    return `I see ${badgeCount} badge${
      badgeCount === 1 ? "" : "s"
    } adorning your journey, each one a testament to your emotional evolution. Your story is just beginning to unfold.`;
  }

  return `${badgeCount} badges shine in your collection, and I've detected ${patternCount} meaningful patterns in your recent journey. Your emotional landscape is rich with wisdom and growth.`;
}
export async function POST(request) {
  return handler(await request.json());
}