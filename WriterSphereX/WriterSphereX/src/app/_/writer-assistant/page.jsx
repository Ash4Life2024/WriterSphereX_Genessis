"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [content, setContent] = React.useState("");
  const [selectedPersona, setSelectedPersona] = React.useState("cael");
  const [genre, setGenre] = React.useState("fantasy");
  const [tone, setTone] = React.useState("neutral");
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [analysis, setAnalysis] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("write");
  const [streamingMessage, setStreamingMessage] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const { data: user, loading: userLoading } = useUser();

  const personas = {
    cael: {
      name: "Cael",
      description:
        "Creative storyteller focused on narrative flow and character development",
      icon: "fas fa-feather-alt",
      color: "text-purple-400",
      specialty: "Character development and emotional depth",
    },
    sage: {
      name: "Sage",
      description: "Analytical editor for structure, grammar, and clarity",
      icon: "fas fa-book",
      color: "text-blue-400",
      specialty: "Structure and technical writing",
    },
    spark: {
      name: "Spark",
      description: "Energetic brainstormer for plot twists and creative ideas",
      icon: "fas fa-bolt",
      color: "text-yellow-400",
      specialty: "Plot development and creative solutions",
    },
    echo: {
      name: "Echo",
      description: "Dialogue specialist for authentic conversations",
      icon: "fas fa-comments",
      color: "text-green-400",
      specialty: "Dialogue and voice consistency",
    },
    flux: {
      name: "Flux",
      description: "Style chameleon for tone shifts and genre adaptation",
      icon: "fas fa-palette",
      color: "text-pink-400",
      specialty: "Tone and style adaptation",
    },
  };

  const genres = [
    "fantasy",
    "sci-fi",
    "mystery",
    "romance",
    "thriller",
    "horror",
    "literary",
    "historical",
    "adventure",
    "comedy",
    "drama",
    "western",
  ];

  const tones = [
    "neutral",
    "formal",
    "casual",
    "humorous",
    "dramatic",
    "mysterious",
    "romantic",
    "dark",
    "uplifting",
    "suspenseful",
    "whimsical",
    "serious",
  ];

  const handleFinish = React.useCallback(
    (message) => {
      setSuggestions((prev) => [
        ...prev,
        {
          id: Date.now(),
          persona: selectedPersona,
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingMessage("");
    },
    [selectedPersona]
  );

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const getPersonaPrompt = (persona, requestType) => {
    const basePrompts = {
      cael: "You are Cael, a creative storyteller. Focus on narrative flow, character development, and emotional depth. Provide suggestions that enhance the story's heart and soul.",
      sage: "You are Sage, an analytical editor. Focus on structure, grammar, clarity, and technical aspects. Provide constructive feedback to improve the writing's quality.",
      spark:
        "You are Spark, an energetic brainstormer. Focus on plot twists, creative ideas, and innovative solutions. Help generate exciting story possibilities.",
      echo: "You are Echo, a dialogue specialist. Focus on authentic conversations, character voice, and speech patterns. Help create believable dialogue.",
      flux: "You are Flux, a style chameleon. Focus on tone shifts, genre adaptation, and stylistic consistency. Help adapt writing to different styles and moods.",
    };

    const requestPrompts = {
      suggestions:
        "Analyze the following text and provide 3-5 specific writing suggestions to improve it:",
      analysis:
        "Provide a detailed analysis of this text including strengths, areas for improvement, and overall assessment:",
      dialogue:
        "Generate realistic dialogue for this scene or improve existing dialogue:",
      scene:
        "Suggest scene improvements or generate new scene ideas based on this context:",
      tone: `Rewrite or suggest improvements to match a ${tone} tone in the ${genre} genre:`,
    };

    return `${basePrompts[persona]} ${
      requestPrompts[requestType] || requestPrompts.suggestions
    }`;
  };

  const getSuggestions = async (requestType = "suggestions") => {
    if (!content.trim()) {
      setError("Please enter some text to get suggestions");
      return;
    }

    setLoading(true);
    setError(null);
    setStreamingMessage("");

    try {
      const systemPrompt = getPersonaPrompt(selectedPersona, requestType);
      const contextPrompt = `Genre: ${genre}, Tone: ${tone}`;

      const response = await fetch(
        "/integrations/anthropic-claude-sonnet-3-5/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `${systemPrompt}\n\nContext: ${contextPrompt}\n\nProvide helpful, specific, and actionable feedback. Be encouraging while being constructive.`,
              },
              {
                role: "user",
                content: content,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get suggestions: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to get suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!content.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/integrations/anthropic-claude-sonnet-3-5/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are a writing analyst. Provide a comprehensive analysis of the text including:
              - Word count and reading level
              - Tone and style assessment
              - Strengths and weaknesses
              - Character development (if applicable)
              - Plot structure (if applicable)
              - Suggestions for improvement
              
              Format your response in a clear, structured way.`,
              },
              {
                role: "user",
                content: `Analyze this ${genre} text with a ${tone} tone:\n\n${content}`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to analyze text: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setAnalysis(data.choices[0].message.content);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setStreamingMessage("");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Writer Assistant</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to access the AI writing assistant
        </p>
        <a
          href="/account/signin"
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Writer Assistant
          </h1>
          <p className="text-gray-400">
            AI-powered writing companion with personalized feedback and
            suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Writing
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your story, scene, or dialogue here..."
                  className="w-full h-96 p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500 transition-colors font-mono"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => getSuggestions("suggestions")}
                  disabled={loading || !content.trim()}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-lightbulb"></i>
                  Get Suggestions
                </button>
                <button
                  onClick={() => getSuggestions("dialogue")}
                  disabled={loading || !content.trim()}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-comments"></i>
                  Improve Dialogue
                </button>
                <button
                  onClick={() => getSuggestions("scene")}
                  disabled={loading || !content.trim()}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-theater-masks"></i>
                  Scene Ideas
                </button>
                <button
                  onClick={analyzeText}
                  disabled={loading || !content.trim()}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-chart-line"></i>
                  Analyze
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  {error}
                </div>
              )}
            </div>

            {analysis && (
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <i className="fas fa-chart-line"></i>
                    Text Analysis
                  </h3>
                  <button
                    onClick={() => setAnalysis(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm">
                    {analysis}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                AI Persona
              </h3>
              <div className="space-y-3">
                {Object.entries(personas).map(([key, persona]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPersona(key)}
                    className={`w-full p-3 rounded-lg border transition-colors duration-200 text-left ${
                      selectedPersona === key
                        ? "border-gray-500 bg-[#2a2a2a]"
                        : "border-gray-700 bg-[#0a0a0a] hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className={`${persona.icon} ${persona.color}`}></i>
                      <span className="font-medium text-white">
                        {persona.name}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {persona.description}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {persona.specialty}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  AI Suggestions
                </h3>
                {suggestions.length > 0 && (
                  <button
                    onClick={clearSuggestions}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Getting suggestions...</span>
                </div>
              )}

              {streamingMessage && (
                <div className="mb-4 p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <i
                      className={`${personas[selectedPersona].icon} ${personas[selectedPersona].color}`}
                    ></i>
                    <span className="font-medium text-white">
                      {personas[selectedPersona].name}
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap">
                    {streamingMessage}
                  </div>
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {suggestions.length === 0 && !loading && !streamingMessage ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No suggestions yet. Write some text and click "Get
                    Suggestions" to receive AI feedback.
                  </p>
                ) : (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <i
                          className={`${personas[suggestion.persona].icon} ${
                            personas[suggestion.persona].color
                          }`}
                        ></i>
                        <span className="font-medium text-white">
                          {personas[suggestion.persona].name}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          {new Date(suggestion.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm whitespace-pre-wrap">
                        {suggestion.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;