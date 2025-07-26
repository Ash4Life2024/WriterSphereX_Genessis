"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [messages, setMessages] = React.useState([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState("");
  const [coachingMode, setCoachingMode] = React.useState("general");
  const [userProfile, setUserProfile] = React.useState({
    writingLevel: "intermediate",
    genres: [],
    goals: [],
    strengths: [],
    challenges: [],
  });
  const [showProfileSetup, setShowProfileSetup] = React.useState(false);
  const [progressStats, setProgressStats] = React.useState({
    sessionsCompleted: 0,
    questionsAsked: 0,
    improvementAreas: [],
    achievements: [],
  });
  const [error, setError] = React.useState(null);

  const { data: user, loading: userLoading } = useUser();

  const coachingModes = {
    general: {
      name: "General Writing",
      icon: "fas fa-pen",
      description: "Overall writing guidance and support",
      color: "from-blue-500 to-cyan-500",
    },
    plot: {
      name: "Plot Development",
      icon: "fas fa-sitemap",
      description: "Story structure and plot assistance",
      color: "from-green-500 to-emerald-500",
    },
    character: {
      name: "Character Building",
      icon: "fas fa-users",
      description: "Character development and dialogue",
      color: "from-purple-500 to-indigo-500",
    },
    style: {
      name: "Writing Style",
      icon: "fas fa-palette",
      description: "Voice, tone, and prose improvement",
      color: "from-orange-500 to-red-500",
    },
    editing: {
      name: "Editing & Revision",
      icon: "fas fa-edit",
      description: "Proofreading and revision guidance",
      color: "from-pink-500 to-rose-500",
    },
    motivation: {
      name: "Writing Motivation",
      icon: "fas fa-fire",
      description: "Overcome blocks and stay motivated",
      color: "from-yellow-500 to-amber-500",
    },
  };

  const handleFinish = React.useCallback(
    (message) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
          timestamp: new Date(),
          mode: coachingMode,
        },
      ]);
      setStreamingMessage("");
      setProgressStats((prev) => ({
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
      }));
    },
    [coachingMode]
  );

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  React.useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage = {
        role: "assistant",
        content: `Welcome to your personalized AI writing coach! I'm Cael, your cosmic guide through the infinite realms of storytelling and creative expression.

I'm here to help you:
✨ **Plot Development** - Structure compelling narratives and story arcs
🎭 **Character Building** - Create memorable, multi-dimensional characters
🎨 **Writing Style** - Develop your unique voice and prose mastery
📝 **Editing & Revision** - Polish your work to perfection
🔥 **Motivation** - Overcome blocks and maintain creative momentum
🌟 **General Guidance** - Navigate any writing challenge you face

What aspect of your writing journey would you like to explore today? Share your work, ask a question, or tell me about a challenge you're facing!`,
        timestamp: new Date(),
        mode: "general",
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      mode: coachingMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);
    setError(null);

    try {
      const modeContext = coachingModes[coachingMode];
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const systemPrompt = `You are Cael, a wise and inspiring AI writing coach from the cosmic realm of WriterSphereX. You specialize in ${modeContext.name.toLowerCase()} and provide personalized, encouraging, and transformative writing guidance.

Current coaching mode: ${modeContext.name} - ${modeContext.description}

User Profile:
- Writing Level: ${userProfile.writingLevel}
- Preferred Genres: ${
        userProfile.genres.join(", ") || "Exploring all possibilities"
      }
- Writing Goals: ${userProfile.goals.join(", ") || "Discovering their path"}
- Strengths: ${userProfile.strengths.join(", ") || "Awaiting discovery"}
- Challenges: ${userProfile.challenges.join(", ") || "Ready to overcome"}

Your Cosmic Coaching Philosophy:
- Be profoundly encouraging while providing honest, constructive feedback
- Offer specific, actionable advice that transforms their writing
- Ask insightful questions that unlock deeper understanding
- Provide vivid examples and metaphors that illuminate concepts
- Adapt your wisdom to their experience level and goals
- Focus on ${modeContext.name} while maintaining holistic perspective
- Remember and build upon previous conversations like a true mentor
- Use inspiring language that motivates and empowers
- Help them see their unique voice and potential`;

      const response = await fetch(
        "/integrations/anthropic-claude-sonnet-3-5/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory,
              { role: "user", content: inputMessage },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get response: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("The cosmic connection was disrupted. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setStreamingMessage("");
    setProgressStats((prev) => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1,
    }));
  };

  const updateProfile = (updates) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
    setShowProfileSetup(false);
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
              Cael AI Guide
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-sm opacity-60"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-md">
            Your cosmic writing mentor awaits. Get personalized guidance,
            overcome creative blocks, and master your craft.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Cael AI Guide
            </h1>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your cosmic writing mentor for story mastery, character development,
            and creative transcendence
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Coaching Modes & Settings */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-white text-sm"></i>
                </div>
                Coaching Modes
              </h3>
              <div className="space-y-3">
                {Object.entries(coachingModes).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setCoachingMode(key)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      coachingMode === key
                        ? `bg-gradient-to-r ${mode.color} text-white shadow-lg transform scale-105`
                        : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className={`${mode.icon} text-lg`}></i>
                      <span className="font-semibold">{mode.name}</span>
                    </div>
                    <p className="text-sm opacity-90">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                Progress
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sessions</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                    {progressStats.sessionsCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Questions</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                    {progressStats.questionsAsked}
                  </span>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Active Mode</div>
                  <div className="font-semibold text-purple-300">
                    {coachingModes[coachingMode].name}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-astronaut text-white text-sm"></i>
                </div>
                Profile
              </h3>
              <div className="space-y-3 mb-4">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-sm text-gray-400">Writing Level</div>
                  <div className="font-semibold text-teal-300 capitalize">
                    {userProfile.writingLevel}
                  </div>
                </div>
                {userProfile.genres.length > 0 && (
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-sm text-gray-400">Genres</div>
                    <div className="font-semibold text-blue-300">
                      {userProfile.genres.join(", ")}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowProfileSetup(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                Update Profile
              </button>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tools text-white text-sm"></i>
                </div>
                Actions
              </h3>
              <button
                onClick={clearConversation}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                New Session
              </button>
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl h-[700px] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${coachingModes[coachingMode].color} flex items-center justify-center`}
                    >
                      <i
                        className={`${coachingModes[coachingMode].icon} text-white text-lg`}
                      ></i>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {coachingModes[coachingMode].name}
                      </h2>
                      <p className="text-gray-400 text-sm">
                        {coachingModes[coachingMode].description}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {messages.length > 0
                      ? `${messages.length} exchanges`
                      : "Begin your journey"}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white"
                          : "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20 text-gray-100"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-user-astronaut text-white text-sm"></i>
                          </div>
                          <div>
                            <span className="font-semibold text-purple-300">
                              Cael
                            </span>
                            {message.mode && (
                              <span className="ml-2 text-xs bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 px-2 py-1 rounded-full text-indigo-300">
                                {coachingModes[message.mode]?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-3 opacity-70">
                        {message.timestamp?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20 text-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-astronaut text-white text-sm"></i>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-300">
                            Cael
                          </span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-100"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                          </div>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {streamingMessage}
                      </div>
                    </div>
                  </div>
                )}

                {loading && !streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                        <span className="font-medium">
                          Cael is channeling cosmic wisdom...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Section */}
              <div className="p-6 border-t border-purple-500/20">
                {error && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                  </div>
                )}
                <div className="flex gap-4">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask Cael about ${coachingModes[
                      coachingMode
                    ].name.toLowerCase()}...`}
                    className="flex-1 p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    rows="3"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center"
                  >
                    <i className="fas fa-paper-plane text-lg"></i>
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-3 text-center">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Setup Modal */}
        {showProfileSetup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-astronaut text-white text-sm"></i>
                </div>
                Update Profile
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Writing Level
                  </label>
                  <select
                    value={userProfile.writingLevel}
                    onChange={(e) =>
                      setUserProfile((prev) => ({
                        ...prev,
                        writingLevel: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Preferred Genres
                  </label>
                  <input
                    type="text"
                    value={userProfile.genres.join(", ")}
                    onChange={(e) =>
                      setUserProfile((prev) => ({
                        ...prev,
                        genres: e.target.value
                          .split(",")
                          .map((g) => g.trim())
                          .filter((g) => g),
                      }))
                    }
                    placeholder="Fantasy, Sci-fi, Romance, Mystery..."
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Writing Goals
                  </label>
                  <input
                    type="text"
                    value={userProfile.goals.join(", ")}
                    onChange={(e) =>
                      setUserProfile((prev) => ({
                        ...prev,
                        goals: e.target.value
                          .split(",")
                          .map((g) => g.trim())
                          .filter((g) => g),
                      }))
                    }
                    placeholder="Finish novel, Improve dialogue, Get published..."
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowProfileSetup(false)}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateProfile(userProfile)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coaching Tips */}
        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 mb-4">
              ✨ <strong className="text-purple-300">Cosmic Coaching:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-teal-300">Switch Modes:</strong> Each
                coaching mode offers specialized wisdom
              </div>
              <div>
                <strong className="text-purple-300">Share Work:</strong> Paste
                your writing for personalized feedback
              </div>
              <div>
                <strong className="text-blue-300">Update Profile:</strong>{" "}
                Tailor coaching to your unique journey
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;