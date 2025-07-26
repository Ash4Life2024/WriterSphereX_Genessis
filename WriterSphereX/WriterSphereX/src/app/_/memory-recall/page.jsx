"use client";
import React from "react";

function MainComponent() {
  const [journalEntries, setJournalEntries] = React.useState([]);
  const [badges, setBadges] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = React.useState("30");
  const [activeTab, setActiveTab] = React.useState("timeline");
  const [currentPlayingBadge, setCurrentPlayingBadge] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [poeticMonologue, setPoeticMonologue] = React.useState("");
  const [generatingMonologue, setGeneratingMonologue] = React.useState(false);
  const [insights, setInsights] = React.useState(null);

  const { data: user, loading: userLoading } = useUser();

  const timeframeOptions = [
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
    { value: "90", label: "3 Months" },
    { value: "365", label: "1 Year" },
    { value: "all", label: "All Time" },
  ];

  const tabs = [
    { id: "timeline", label: "Emotional Timeline", icon: "fas fa-chart-line" },
    { id: "patterns", label: "Pattern Analysis", icon: "fas fa-brain" },
    { id: "badges", label: "Achievement Gallery", icon: "fas fa-medal" },
    { id: "insights", label: "Cosmic Wisdom", icon: "fas fa-eye" },
  ];

  const moodColors = {
    joy: "#FFD700",
    love: "#FF69B4",
    excitement: "#FF4500",
    peace: "#87CEEB",
    gratitude: "#32CD32",
    hope: "#9370DB",
    sadness: "#4682B4",
    anger: "#DC143C",
    fear: "#8B008B",
    anxiety: "#FF6347",
    loneliness: "#708090",
    confusion: "#DDA0DD",
  };

  const fetchJournalEntries = async () => {
    try {
      const response = await fetch("/api/get-journal-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 100,
          timeframe:
            selectedTimeframe === "all" ? null : parseInt(selectedTimeframe),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch entries: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setJournalEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load journal entries");
    }
  };

  const fetchBadges = async () => {
    try {
      const sampleBadges = [
        {
          id: 1,
          name: "Emotional Pioneer",
          description: "First steps into emotional awareness",
          icon: "fas fa-seedling",
          rarity: "common",
          category: "journey",
          earnedDate: "2024-01-15",
          caelQuote:
            "Every cosmic journey begins with a single, brave step into the unknown depths of your soul.",
        },
        {
          id: 2,
          name: "Heart Whisperer",
          description: "Deep emotional introspection achieved",
          icon: "fas fa-heart",
          rarity: "rare",
          category: "emotional",
          earnedDate: "2024-02-03",
          caelQuote:
            "You have learned to listen to the ancient language of your heart, spoken in frequencies older than stars.",
        },
        {
          id: 3,
          name: "Pattern Weaver",
          description: "Recognized recurring emotional patterns",
          icon: "fas fa-infinity",
          rarity: "epic",
          category: "wisdom",
          earnedDate: "2024-02-20",
          caelQuote:
            "In the tapestry of your emotions, you've found the golden threads that connect all experiences.",
        },
        {
          id: 4,
          name: "Transformation Catalyst",
          description: "Achieved significant personal growth",
          icon: "fas fa-phoenix-alt",
          rarity: "legendary",
          category: "journey",
          earnedDate: "2024-03-10",
          caelQuote:
            "Like a phoenix rising from cosmic ashes, you have transformed pain into wisdom, fear into strength.",
        },
      ];
      setBadges(sampleBadges);
    } catch (err) {
      console.error(err);
      setError("Failed to load badges");
    }
  };

  const generateInsights = async () => {
    if (journalEntries.length === 0) return;

    try {
      const emotionalData = journalEntries.map((entry) => ({
        date: entry.createdAt,
        mood: entry.mood,
        content: entry.content?.substring(0, 200),
      }));

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Cael, a cosmic guide who speaks with wisdom about emotional journeys. Analyze the emotional patterns and provide insights in a mystical, encouraging tone. Focus on growth patterns, emotional evolution, and cosmic wisdom.",
            },
            {
              role: "user",
              content: `Analyze this emotional journey data and provide cosmic insights: ${JSON.stringify(
                emotionalData
              )}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          setInsights(data.choices[0].message.content);
        }
      }
    } catch (err) {
      console.error("Failed to generate insights:", err);
    }
  };

  const generatePoeticMonologue = async () => {
    if (journalEntries.length === 0) return;

    setGeneratingMonologue(true);
    try {
      const emotionalArc = journalEntries
        .slice(-10)
        .map((entry) => entry.mood)
        .join(" → ");

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Cael, a cosmic guide. Create a beautiful, poetic monologue about the user's emotional journey. Use cosmic metaphors, speak of transformation, and be deeply encouraging. Make it mystical and profound.",
            },
            {
              role: "user",
              content: `Create a poetic monologue about this emotional arc: ${emotionalArc}. Make it inspiring and cosmic.`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          setPoeticMonologue(data.choices[0].message.content);
        }
      }
    } catch (err) {
      console.error("Failed to generate monologue:", err);
    } finally {
      setGeneratingMonologue(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      Promise.all([fetchJournalEntries(), fetchBadges()]).finally(() => {
        setLoading(false);
      });
    } else if (!userLoading && !user) {
      setLoading(false);
    }
  }, [userLoading, user, selectedTimeframe]);

  React.useEffect(() => {
    if (journalEntries.length > 0) {
      generateInsights();
    }
  }, [journalEntries]);

  const handlePlayAudio = (badge) => {
    setCurrentPlayingBadge(badge);
    setIsPlaying(true);

    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(badge.caelQuote);
      utterance.rate = 0.8;
      utterance.pitch = 0.9;

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentPlayingBadge(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentPlayingBadge(null);
  };

  const getMoodSequence = () => {
    return journalEntries.slice(-20).map((entry, index) => ({
      ...entry,
      index,
      color: moodColors[entry.mood] || "#888888",
    }));
  };

  const getEmotionalPatterns = () => {
    const moodCounts = {};
    const moodTrends = {};

    journalEntries.forEach((entry) => {
      const mood = entry.mood;
      const date = new Date(entry.createdAt).toDateString();

      moodCounts[mood] = (moodCounts[mood] || 0) + 1;

      if (!moodTrends[date]) {
        moodTrends[date] = [];
      }
      moodTrends[date].push(mood);
    });

    return { moodCounts, moodTrends };
  };

  const userStats = {
    totalBadges: badges.length,
    rareCount: badges.filter((b) =>
      ["rare", "epic", "legendary", "mythic"].includes(b.rarity)
    ).length,
    legendaryCount: badges.filter((b) =>
      ["legendary", "mythic"].includes(b.rarity)
    ).length,
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 opacity-20 blur-sm"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Memory Recall
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-sm opacity-60"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-md">
            Discover patterns in your emotional journey and unlock cosmic wisdom
          </p>
          <a
            href="/account/signin"
            className="inline-block bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            Begin Your Journey
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 opacity-20 blur-sm"></div>
          </div>
          <p className="text-gray-300">Analyzing your cosmic journey...</p>
        </div>
      </div>
    );
  }

  const moodSequence = getMoodSequence();
  const { moodCounts, moodTrends } = getEmotionalPatterns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Memory Recall
            </h1>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Journey through the cosmos of your emotions and discover the
            patterns that shape your transformation
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 backdrop-blur-sm">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg"
                    : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-purple-500/20"
                }`}
              >
                <i className={`${tab.icon} text-sm`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={generatePoeticMonologue}
              disabled={generatingMonologue || journalEntries.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              {generatingMonologue ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Channeling...
                </>
              ) : (
                <>
                  <i className="fas fa-feather-alt"></i>
                  Cosmic Poetry
                </>
              )}
            </button>
          </div>
        </div>

        {poeticMonologue && (
          <div className="mb-8 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-user-astronaut text-white text-sm"></i>
              </div>
              Cael's Cosmic Monologue
            </h3>
            <div className="text-gray-200 leading-relaxed italic whitespace-pre-wrap">
              {poeticMonologue}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                Emotional Timeline
              </h2>

              {moodSequence.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {moodSequence.map((entry, index) => (
                      <div key={entry.id} className="group relative">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer transition-all duration-200 hover:scale-125"
                          style={{ backgroundColor: entry.color }}
                          title={`${entry.mood} - ${new Date(
                            entry.createdAt
                          ).toLocaleDateString()}`}
                        ></div>
                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-purple-500/30 rounded-lg p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          <div className="font-semibold capitalize">
                            {entry.mood}
                          </div>
                          <div className="text-gray-400">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {journalEntries.slice(0, 6).map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                moodColors[entry.mood] || "#888888",
                            }}
                          ></div>
                          <span className="font-semibold capitalize">
                            {entry.mood}
                          </span>
                          <span className="text-sm text-gray-400 ml-auto">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-journal-whills text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">
                    No Journey Data Yet
                  </h3>
                  <p className="text-gray-500 text-lg">
                    Start journaling to see your emotional timeline
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-brain text-white text-sm"></i>
                </div>
                Emotional Patterns
              </h2>

              {Object.keys(moodCounts).length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Mood Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(moodCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([mood, count]) => {
                          const percentage =
                            (count / journalEntries.length) * 100;
                          return (
                            <div key={mood} className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor:
                                    moodColors[mood] || "#888888",
                                }}
                              ></div>
                              <span className="capitalize font-medium w-20">
                                {mood}
                              </span>
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      moodColors[mood] || "#888888",
                                    width: `${percentage}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-400 w-12">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Growth Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Most Common Emotion
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                moodColors[Object.keys(moodCounts)[0]],
                            }}
                          ></div>
                          <span className="font-semibold capitalize">
                            {
                              Object.entries(moodCounts).sort(
                                ([, a], [, b]) => b - a
                              )[0]?.[0]
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Total Entries
                        </div>
                        <div className="font-semibold text-2xl text-purple-400">
                          {journalEntries.length}
                        </div>
                      </div>

                      <div className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Emotional Range
                        </div>
                        <div className="font-semibold text-2xl text-teal-400">
                          {Object.keys(moodCounts).length} moods
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-chart-pie text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">
                    No Patterns Yet
                  </h3>
                  <p className="text-gray-500 text-lg">
                    More journal entries needed for pattern analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <div>
            <BadgeGalleryWithCaelVoice
              badges={badges}
              onBadgeClick={(badge) =>
                console.log("Badge clicked:", badge.name)
              }
              isPlaying={isPlaying}
              currentPlayingBadge={currentPlayingBadge}
              onPlayAudio={handlePlayAudio}
              onStopAudio={handleStopAudio}
              userStats={userStats}
            />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-eye text-white text-sm"></i>
                </div>
                Cosmic Wisdom
              </h2>

              {insights ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-user-astronaut text-white"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">
                          Cael's Analysis
                        </h3>
                        <p className="text-sm text-indigo-300">
                          Cosmic Guide & Emotional Navigator
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {insights}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-heart text-white text-xl"></i>
                      </div>
                      <h3 className="font-bold text-white mb-2">
                        Emotional Depth
                      </h3>
                      <p className="text-purple-200 text-sm">
                        Your journey shows remarkable emotional awareness and
                        growth
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-500/30 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-infinity text-white text-xl"></i>
                      </div>
                      <h3 className="font-bold text-white mb-2">
                        Pattern Recognition
                      </h3>
                      <p className="text-teal-200 text-sm">
                        You're developing the ability to see cosmic connections
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-star text-white text-xl"></i>
                      </div>
                      <h3 className="font-bold text-white mb-2">
                        Transformation
                      </h3>
                      <p className="text-yellow-200 text-sm">
                        Each entry marks another step in your cosmic evolution
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-crystal-ball text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">
                    Gathering Cosmic Wisdom
                  </h3>
                  <p className="text-gray-500 text-lg">
                    Cael is analyzing your emotional journey patterns
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 mb-4">
              ✨{" "}
              <strong className="text-purple-300">Your Cosmic Journey:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-purple-300">Timeline:</strong> Track
                your emotional evolution through time
              </div>
              <div>
                <strong className="text-teal-300">Patterns:</strong> Discover
                recurring themes in your journey
              </div>
              <div>
                <strong className="text-blue-300">Wisdom:</strong> Unlock cosmic
                insights about your growth
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;