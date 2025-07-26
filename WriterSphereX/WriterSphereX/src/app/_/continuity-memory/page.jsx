"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [stories, setStories] = React.useState([]);
  const [selectedStory, setSelectedStory] = React.useState(null);
  const [chapters, setChapters] = React.useState([]);
  const [selectedChapter, setSelectedChapter] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [analysisType, setAnalysisType] = React.useState(null);

  const [continuityData, setContinuityData] = React.useState({
    characters: [],
    plotThreads: [],
    timeline: [],
    inconsistencies: [],
    facts: [],
  });

  const [newStory, setNewStory] = React.useState({
    title: "",
    description: "",
    genre: "",
  });

  const [newChapter, setNewChapter] = React.useState({
    title: "",
    content: "",
    chapterNumber: 1,
  });

  const { data: user, loading: userLoading } = useUser();

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingContent,
    onFinish: (content) => {
      if (analysisType === "extract") {
        extractMemoryFromContent(content);
      } else if (analysisType === "consistency") {
        setContinuityData((prev) => ({ ...prev, inconsistencies: [content] }));
      } else if (analysisType === "timeline") {
        updateTimelineFromAnalysis(content);
      }
      setStreamingContent("");
      setAnalysisType(null);
      setAnalysisLoading(false);
    },
  });

  const extractMemoryFromContent = (analysis) => {
    try {
      const lines = analysis.split("\n").filter((line) => line.trim());
      const characters = [];
      const plotThreads = [];
      const facts = [];

      let currentSection = null;

      lines.forEach((line) => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes("character") && lowerLine.includes(":")) {
          currentSection = "characters";
        } else if (lowerLine.includes("plot") && lowerLine.includes(":")) {
          currentSection = "plotThreads";
        } else if (lowerLine.includes("fact") && lowerLine.includes(":")) {
          currentSection = "facts";
        } else if (line.startsWith("- ") || line.startsWith("• ")) {
          const item = line.substring(2).trim();
          if (currentSection === "characters" && item) {
            characters.push({
              id: Date.now() + Math.random(),
              name: item.split(":")[0] || item,
              description: item.split(":")[1] || "",
              chapter: selectedChapter?.title || "Unknown",
              lastSeen: new Date().toISOString(),
            });
          } else if (currentSection === "plotThreads" && item) {
            plotThreads.push({
              id: Date.now() + Math.random(),
              thread: item,
              status: "active",
              chapter: selectedChapter?.title || "Unknown",
              introduced: new Date().toISOString(),
            });
          } else if (currentSection === "facts" && item) {
            facts.push({
              id: Date.now() + Math.random(),
              fact: item,
              chapter: selectedChapter?.title || "Unknown",
              recorded: new Date().toISOString(),
            });
          }
        }
      });

      setContinuityData((prev) => ({
        ...prev,
        characters: [...prev.characters, ...characters],
        plotThreads: [...prev.plotThreads, ...plotThreads],
        facts: [...prev.facts, ...facts],
      }));
    } catch (err) {
      console.error("Error parsing analysis:", err);
    }
  };

  const updateTimelineFromAnalysis = (analysis) => {
    try {
      const events = [];
      const lines = analysis.split("\n").filter((line) => line.trim());

      lines.forEach((line) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          const eventText = line.substring(2).trim();
          if (eventText) {
            events.push({
              id: Date.now() + Math.random(),
              event: eventText,
              chapter: selectedChapter?.title || "Unknown",
              timestamp: new Date().toISOString(),
              order: events.length + 1,
            });
          }
        }
      });

      setContinuityData((prev) => ({
        ...prev,
        timeline: [...prev.timeline, ...events].sort(
          (a, b) => a.order - b.order
        ),
      }));
    } catch (err) {
      console.error("Error parsing timeline:", err);
    }
  };

  const createStory = () => {
    if (!newStory.title.trim()) {
      setError("Story title is required");
      return;
    }

    const story = {
      id: Date.now(),
      title: newStory.title,
      description: newStory.description,
      genre: newStory.genre,
      created: new Date().toISOString(),
      chapters: [],
    };

    setStories((prev) => [...prev, story]);
    setSelectedStory(story);
    setNewStory({ title: "", description: "", genre: "" });
    setError(null);
  };

  const addChapter = () => {
    if (!selectedStory) {
      setError("Please select a story first");
      return;
    }

    if (!newChapter.title.trim() || !newChapter.content.trim()) {
      setError("Chapter title and content are required");
      return;
    }

    const chapter = {
      id: Date.now(),
      title: newChapter.title,
      content: newChapter.content,
      chapterNumber: newChapter.chapterNumber,
      storyId: selectedStory.id,
      created: new Date().toISOString(),
    };

    setChapters((prev) => [...prev, chapter]);
    setNewChapter({
      title: "",
      content: "",
      chapterNumber: chapters.length + 2,
    });
    setError(null);
  };

  const analyzeChapter = async (type) => {
    if (!selectedChapter) {
      setError("Please select a chapter to analyze");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisType(type);
    setError(null);

    try {
      let prompt = "";

      if (type === "extract") {
        prompt = `Analyze this chapter content and extract key story elements:

Chapter: "${selectedChapter.title}"
Content: ${selectedChapter.content}

Please identify and list:

CHARACTERS:
- List all characters mentioned with brief descriptions
- Note any character development or changes
- Include relationships between characters

PLOT THREADS:
- Identify ongoing plot lines
- Note new plot developments
- Mark resolved or advancing storylines

STORY FACTS:
- Important world-building details
- Key events that happened
- Significant dialogue or revelations
- Setting details and descriptions

Format your response with clear sections and bullet points.`;
      } else if (type === "consistency") {
        const allChapters = chapters.filter(
          (c) => c.storyId === selectedStory.id
        );
        const previousContent = allChapters
          .slice(0, -1)
          .map((c) => `Chapter ${c.chapterNumber}: ${c.content}`)
          .join("\n\n");

        prompt = `Check for story consistency issues between this chapter and previous chapters:

PREVIOUS CHAPTERS:
${previousContent}

CURRENT CHAPTER:
${selectedChapter.content}

Analyze for:
- Character inconsistencies (personality, appearance, abilities)
- Plot contradictions or timeline issues
- World-building inconsistencies
- Dialogue style changes
- Factual contradictions

List any inconsistencies found with specific examples.`;
      } else if (type === "timeline") {
        prompt = `Create a timeline of events from this chapter:

Chapter: "${selectedChapter.title}"
Content: ${selectedChapter.content}

Extract all events in chronological order, including:
- Actions taken by characters
- Dialogue exchanges
- Scene changes
- Time references
- Important moments

Format as a chronological list of events.`;
      }

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
                content:
                  "You are an expert story analyst specializing in continuity tracking, character development, and narrative consistency. Provide detailed, structured analysis.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Analysis failed: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze chapter. Please try again.");
      setAnalysisLoading(false);
      setAnalysisType(null);
    }
  };

  const generateContinuityReport = async () => {
    if (!selectedStory || chapters.length === 0) {
      setError("Please select a story with chapters");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisType("report");
    setError(null);

    try {
      const storyChapters = chapters.filter(
        (c) => c.storyId === selectedStory.id
      );
      const fullStory = storyChapters
        .map((c) => `Chapter ${c.chapterNumber}: ${c.title}\n${c.content}`)
        .join("\n\n");

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
                content:
                  "You are a comprehensive story continuity analyst. Generate detailed reports on story consistency, character development, and narrative flow.",
              },
              {
                role: "user",
                content: `Generate a comprehensive continuity report for this story:

STORY: ${selectedStory.title}
FULL CONTENT:
${fullStory}

Please provide:

1. CHARACTER ANALYSIS
- Character development arcs
- Consistency in personality and behavior
- Relationship dynamics and changes

2. PLOT THREAD TRACKING
- Main storylines and their progression
- Subplots and their resolution status
- Pacing and narrative flow

3. WORLD-BUILDING CONSISTENCY
- Setting details and consistency
- Rules of the world and adherence
- Timeline and chronological accuracy

4. POTENTIAL ISSUES
- Plot holes or inconsistencies
- Character behavior contradictions
- Timeline problems

5. RECOMMENDATIONS
- Areas needing attention
- Suggestions for improvement
- Continuity fixes needed`,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Report generation failed: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to generate continuity report. Please try again.");
      setAnalysisLoading(false);
      setAnalysisType(null);
    }
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
        <h1 className="text-4xl font-bold mb-4">Continuity Memory</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to track story continuity
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
            Continuity Memory
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Advanced story continuity tracking with AI-powered analysis for
            character consistency, plot threads, and timeline management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Story Management Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-book text-blue-400"></i>
                Stories
              </h2>

              {/* Create New Story */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  value={newStory.title}
                  onChange={(e) =>
                    setNewStory({ ...newStory, title: e.target.value })
                  }
                  placeholder="Story title"
                  className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="text"
                  value={newStory.genre}
                  onChange={(e) =>
                    setNewStory({ ...newStory, genre: e.target.value })
                  }
                  placeholder="Genre"
                  className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500"
                />
                <button
                  onClick={createStory}
                  className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                >
                  Create Story
                </button>
              </div>

              {/* Story List */}
              <div className="space-y-2 mb-6">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      setSelectedStory(story);
                      setChapters((prev) =>
                        prev.filter((c) => c.storyId === story.id)
                      );
                    }}
                    className={`p-3 rounded cursor-pointer transition-colors duration-200 ${
                      selectedStory?.id === story.id
                        ? "bg-[#2a2a2a] border border-gray-600"
                        : "bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-gray-800"
                    }`}
                  >
                    <div className="font-medium text-sm">{story.title}</div>
                    <div className="text-xs text-gray-400">{story.genre}</div>
                  </div>
                ))}
              </div>

              {/* Add Chapter */}
              {selectedStory && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-300">Add Chapter</h3>
                  <input
                    type="text"
                    value={newChapter.title}
                    onChange={(e) =>
                      setNewChapter({ ...newChapter, title: e.target.value })
                    }
                    placeholder="Chapter title"
                    className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500"
                  />
                  <textarea
                    value={newChapter.content}
                    onChange={(e) =>
                      setNewChapter({ ...newChapter, content: e.target.value })
                    }
                    placeholder="Chapter content..."
                    rows="4"
                    className="w-full p-2 bg-[#0a0a0a] border border-gray-700 rounded text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-gray-500"
                  />
                  <button
                    onClick={addChapter}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                  >
                    Add Chapter
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedStory ? (
              <div className="text-center py-12">
                <i className="fas fa-book-open text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 text-lg">No story selected</p>
                <p className="text-gray-500 text-sm">
                  Create or select a story to begin tracking continuity
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Story Header */}
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedStory.title}
                  </h2>
                  <p className="text-gray-400">{selectedStory.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-gray-500">
                      Genre: {selectedStory.genre}
                    </span>
                    <span className="text-sm text-gray-500">
                      Chapters:{" "}
                      {
                        chapters.filter((c) => c.storyId === selectedStory.id)
                          .length
                      }
                    </span>
                  </div>
                </div>

                {/* Chapters List */}
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-list text-green-400"></i>
                    Chapters
                  </h3>

                  {chapters.filter((c) => c.storyId === selectedStory.id)
                    .length === 0 ? (
                    <p className="text-gray-500">No chapters added yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {chapters
                        .filter((c) => c.storyId === selectedStory.id)
                        .map((chapter) => (
                          <div
                            key={chapter.id}
                            onClick={() => setSelectedChapter(chapter)}
                            className={`p-4 rounded cursor-pointer transition-colors duration-200 ${
                              selectedChapter?.id === chapter.id
                                ? "bg-[#2a2a2a] border border-gray-600"
                                : "bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-gray-800"
                            }`}
                          >
                            <div className="font-medium mb-2">
                              Chapter {chapter.chapterNumber}: {chapter.title}
                            </div>
                            <div className="text-sm text-gray-400 line-clamp-2">
                              {chapter.content.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Analysis Tools */}
                {selectedChapter && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <i className="fas fa-microscope text-purple-400"></i>
                      Analysis Tools
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <button
                        onClick={() => analyzeChapter("extract")}
                        disabled={analysisLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-3 rounded font-medium transition-colors duration-200"
                      >
                        {analysisLoading && analysisType === "extract"
                          ? "Extracting..."
                          : "Extract Memory"}
                      </button>
                      <button
                        onClick={() => analyzeChapter("consistency")}
                        disabled={analysisLoading}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-4 py-3 rounded font-medium transition-colors duration-200"
                      >
                        {analysisLoading && analysisType === "consistency"
                          ? "Checking..."
                          : "Check Consistency"}
                      </button>
                      <button
                        onClick={() => analyzeChapter("timeline")}
                        disabled={analysisLoading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-3 rounded font-medium transition-colors duration-200"
                      >
                        {analysisLoading && analysisType === "timeline"
                          ? "Building..."
                          : "Build Timeline"}
                      </button>
                    </div>

                    <button
                      onClick={generateContinuityReport}
                      disabled={analysisLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-3 rounded font-medium transition-colors duration-200"
                    >
                      {analysisLoading && analysisType === "report"
                        ? "Generating Report..."
                        : "Generate Full Continuity Report"}
                    </button>
                  </div>
                )}

                {/* Analysis Results */}
                {(streamingContent || analysisLoading) && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {analysisLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <h3 className="text-xl font-semibold">
                        {analysisType === "extract" && "Memory Extraction"}
                        {analysisType === "consistency" && "Consistency Check"}
                        {analysisType === "timeline" && "Timeline Analysis"}
                        {analysisType === "report" && "Continuity Report"}
                      </h3>
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {streamingContent}
                    </div>
                  </div>
                )}

                {/* Continuity Data Tabs */}
                {(continuityData.characters.length > 0 ||
                  continuityData.plotThreads.length > 0 ||
                  continuityData.timeline.length > 0 ||
                  continuityData.facts.length > 0) && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        "characters",
                        "plotThreads",
                        "timeline",
                        "facts",
                        "inconsistencies",
                      ].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-4 py-2 rounded font-medium transition-colors duration-200 capitalize ${
                            activeTab === tab
                              ? "bg-[#2a2a2a] text-white"
                              : "bg-[#0a0a0a] text-gray-400 hover:text-white"
                          }`}
                        >
                          {tab === "plotThreads" ? "Plot Threads" : tab}
                          {tab === "characters" &&
                            continuityData.characters.length > 0 && (
                              <span className="ml-2 bg-blue-600 text-xs px-2 py-1 rounded-full">
                                {continuityData.characters.length}
                              </span>
                            )}
                          {tab === "plotThreads" &&
                            continuityData.plotThreads.length > 0 && (
                              <span className="ml-2 bg-green-600 text-xs px-2 py-1 rounded-full">
                                {continuityData.plotThreads.length}
                              </span>
                            )}
                          {tab === "timeline" &&
                            continuityData.timeline.length > 0 && (
                              <span className="ml-2 bg-yellow-600 text-xs px-2 py-1 rounded-full">
                                {continuityData.timeline.length}
                              </span>
                            )}
                          {tab === "facts" &&
                            continuityData.facts.length > 0 && (
                              <span className="ml-2 bg-purple-600 text-xs px-2 py-1 rounded-full">
                                {continuityData.facts.length}
                              </span>
                            )}
                        </button>
                      ))}
                    </div>

                    {activeTab === "characters" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <i className="fas fa-users text-blue-400"></i>
                          Characters ({continuityData.characters.length})
                        </h3>
                        {continuityData.characters.length === 0 ? (
                          <p className="text-gray-500">
                            No characters extracted yet
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {continuityData.characters.map((character) => (
                              <div
                                key={character.id}
                                className="bg-[#0a0a0a] border border-gray-800 rounded p-4"
                              >
                                <div className="font-medium text-blue-300">
                                  {character.name}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                  {character.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Last seen: {character.chapter}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "plotThreads" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <i className="fas fa-project-diagram text-green-400"></i>
                          Plot Threads ({continuityData.plotThreads.length})
                        </h3>
                        {continuityData.plotThreads.length === 0 ? (
                          <p className="text-gray-500">
                            No plot threads tracked yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {continuityData.plotThreads.map((thread) => (
                              <div
                                key={thread.id}
                                className="bg-[#0a0a0a] border border-gray-800 rounded p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-green-300">
                                    {thread.thread}
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      thread.status === "active"
                                        ? "bg-green-600"
                                        : "bg-gray-600"
                                    }`}
                                  >
                                    {thread.status}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Introduced in: {thread.chapter}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "timeline" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <i className="fas fa-clock text-yellow-400"></i>
                          Timeline ({continuityData.timeline.length})
                        </h3>
                        {continuityData.timeline.length === 0 ? (
                          <p className="text-gray-500">
                            No timeline events recorded yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {continuityData.timeline.map((event, index) => (
                              <div
                                key={event.id}
                                className="bg-[#0a0a0a] border border-gray-800 rounded p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-yellow-300">
                                      {event.event}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Chapter: {event.chapter}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "facts" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <i className="fas fa-lightbulb text-purple-400"></i>
                          Story Facts ({continuityData.facts.length})
                        </h3>
                        {continuityData.facts.length === 0 ? (
                          <p className="text-gray-500">
                            No story facts recorded yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {continuityData.facts.map((fact) => (
                              <div
                                key={fact.id}
                                className="bg-[#0a0a0a] border border-gray-800 rounded p-4"
                              >
                                <div className="text-purple-300">
                                  {fact.fact}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Recorded from: {fact.chapter}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "inconsistencies" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <i className="fas fa-exclamation-triangle text-red-400"></i>
                          Inconsistencies
                        </h3>
                        {continuityData.inconsistencies.length === 0 ? (
                          <p className="text-gray-500">
                            No inconsistencies detected
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {continuityData.inconsistencies.map(
                              (issue, index) => (
                                <div
                                  key={index}
                                  className="bg-red-900/20 border border-red-700 rounded p-4"
                                >
                                  <div className="text-red-300 whitespace-pre-wrap">
                                    {issue}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">
            💡 <strong>Tips for better continuity tracking:</strong>
          </p>
          <p className="mb-2">
            • Add chapters with detailed content for comprehensive analysis
          </p>
          <p className="mb-2">
            • Use "Extract Memory" after each chapter to build your continuity
            database
          </p>
          <p>
            • Run consistency checks regularly to catch potential plot holes
            early
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;