"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [transcription, setTranscription] = React.useState("");
  const [processingVoice, setProcessingVoice] = React.useState(false);
  const [caelResponse, setCaelResponse] = React.useState(null);
  const [playingAudio, setPlayingAudio] = React.useState(false);
  const [showCaelResponse, setShowCaelResponse] = React.useState(false);
  const [caelVoiceResponse, setCaelVoiceResponse] = React.useState(null);
  const [loadingCaelResponse, setLoadingCaelResponse] = React.useState(false);

  const [newEntry, setNewEntry] = React.useState({
    title: "",
    content: "",
    mood: "",
    tags: [],
    imageUrl: "",
  });

  const [filters, setFilters] = React.useState({
    mood: "",
    tags: [],
    dateFrom: "",
    dateTo: "",
    search: "",
    limit: 50,
  });

  const [tagInput, setTagInput] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploadLoading }] = useUpload();

  const moods = [
    {
      value: "happy",
      label: "😊 Happy",
      color: "from-yellow-400 to-orange-400",
    },
    { value: "sad", label: "😢 Sad", color: "from-blue-500 to-indigo-600" },
    {
      value: "anxious",
      label: "😰 Anxious",
      color: "from-red-500 to-pink-500",
    },
    {
      value: "excited",
      label: "🎉 Excited",
      color: "from-purple-500 to-pink-500",
    },
    {
      value: "reflective",
      label: "🤔 Reflective",
      color: "from-indigo-500 to-purple-600",
    },
    {
      value: "grateful",
      label: "🙏 Grateful",
      color: "from-green-400 to-teal-500",
    },
    {
      value: "frustrated",
      label: "😤 Frustrated",
      color: "from-red-600 to-orange-600",
    },
    {
      value: "peaceful",
      label: "🕊️ Peaceful",
      color: "from-teal-400 to-cyan-400",
    },
    {
      value: "neutral",
      label: "😌 Neutral",
      color: "from-slate-400 to-gray-500",
    },
    {
      value: "resilience",
      label: "💪 Resilient",
      color: "from-emerald-500 to-green-500",
    },
    { value: "grief", label: "💔 Grief", color: "from-slate-600 to-gray-700" },
    {
      value: "hopeful",
      label: "🌅 Hopeful",
      color: "from-cyan-400 to-blue-400",
    },
  ];

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/enhanced-journal-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get",
          filters: filters,
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

      setEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load journal entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      fetchEntries();
    }
  }, [userLoading, user, filters]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processVoiceEntry = async () => {
    if (!audioBlob) return;

    setProcessingVoice(true);
    setError(null);

    try {
      const { url, error } = await upload({ file: audioBlob });
      if (error) {
        throw new Error(error);
      }

      const response = await fetch("/api/voice-trigger-journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: url,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Voice processing failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCaelResponse(data.caelResponse);
      setTranscription(data.analysis.transcription);

      setNewEntry({
        title: data.journalEntry.title,
        content: data.analysis.transcription,
        mood: data.analysis.mood,
        tags: data.analysis.themes || [],
        imageUrl: "",
      });

      setShowCreateForm(true);
      fetchEntries();
    } catch (err) {
      console.error(err);
      setError("Failed to process voice entry. Please try again.");
    } finally {
      setProcessingVoice(false);
      setAudioBlob(null);
    }
  };

  const createEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.title.trim() || !newEntry.content.trim() || !newEntry.mood) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/enhanced-journal-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          title: newEntry.title,
          content: newEntry.content,
          mood: newEntry.mood,
          tags: newEntry.tags,
          imageUrl: newEntry.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create entry: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCaelResponse({ quote: data.caelResponse });
      setShowCaelResponse(true);

      setNewEntry({ title: "", content: "", mood: "", tags: [], imageUrl: "" });
      setShowCreateForm(false);
      fetchEntries();
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create journal entry. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const generateCaelVoiceResponse = async () => {
    if (entries.length === 0) {
      setError("No journal entries to generate response from");
      return;
    }

    setLoadingCaelResponse(true);
    setError(null);

    try {
      const response = await fetch("/api/cael-voice-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.id,
          mood: filters.mood || null,
          tags: filters.tags || [],
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to generate Cael response: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCaelVoiceResponse(data.response);
      setShowCaelResponse(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate Cael's voice response. Please try again.");
    } finally {
      setLoadingCaelResponse(false);
    }
  };

  const playAudio = (audioUrl) => {
    if (audioUrl) {
      setPlayingAudio(true);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingAudio(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { url, error } = await upload({ file });
      if (error) {
        throw new Error(error);
      }

      setNewEntry((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error(err);
      setCreateError("Failed to upload image. Please try again.");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newEntry.tags.includes(tagInput.trim())) {
      setNewEntry((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setNewEntry((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMoodGradient = (mood) => {
    const moodObj = moods.find((m) => m.value === mood);
    return moodObj ? moodObj.color : "from-gray-500 to-gray-600";
  };

  const getMoodLabel = (mood) => {
    const moodObj = moods.find((m) => m.value === mood);
    return moodObj ? moodObj.label : mood;
  };

  const shouldShowCaelResponse = (mood, tags, uid) => {
    const allowedMoods = ["resilience", "grief", "peaceful", "reflective"];
    const allowedTags = ["nature", "healing", "growth", "wisdom"];
    const allowedUsers = ["Ashley-001", user?.id];

    if (allowedMoods.includes(mood)) return true;
    if (tags && tags.some((tag) => allowedTags.includes(tag.toLowerCase())))
      return true;
    if (allowedUsers.includes(uid)) return true;

    return false;
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
              Journal Sphere
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-sm opacity-60"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-md">
            Your personal writing companion awaits. Sign in to begin your
            creative journey.
          </p>
          <a
            href="/account/signin"
            className="inline-block bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            Enter Your Sphere
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
              Journal Sphere
            </h1>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Capture your thoughts, explore your emotions, and let Cael guide
            your creative journey through the cosmos of consciousness
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-magic text-white text-sm"></i>
                </div>
                Create
              </h2>

              <div className="space-y-4 mb-8">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
                >
                  <i className="fas fa-feather-alt"></i>
                  Write Entry
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={processingVoice || uploadLoading}
                  className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-3 ${
                    isRecording
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse"
                      : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <i
                    className={`fas ${
                      isRecording ? "fa-stop" : "fa-microphone"
                    }`}
                  ></i>
                  {isRecording ? "Stop Recording" : "Voice Entry"}
                </button>

                {audioBlob && (
                  <button
                    onClick={processVoiceEntry}
                    disabled={processingVoice}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25 flex items-center gap-3"
                  >
                    {processingVoice ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-brain"></i>
                        Process with Cael
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={generateCaelVoiceResponse}
                  disabled={loadingCaelResponse || entries.length === 0}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
                >
                  {loadingCaelResponse ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-astronaut"></i>
                      Get Cael's Voice Response
                    </>
                  )}
                </button>
              </div>

              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-md flex items-center justify-center">
                  <i className="fas fa-filter text-white text-xs"></i>
                </div>
                Filters
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Mood
                  </label>
                  <select
                    value={filters.mood}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, mood: e.target.value }))
                    }
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  >
                    <option value="">All Moods</option>
                    {moods.map((mood) => (
                      <option key={mood.value} value={mood.value}>
                        {mood.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    placeholder="Search entries..."
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() =>
                    setFilters({
                      mood: "",
                      tags: [],
                      dateFrom: "",
                      dateTo: "",
                      search: "",
                      limit: 50,
                    })
                  }
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3">
            {error && (
              <div className="mb-8 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 backdrop-blur-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 opacity-20 blur-sm"></div>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-book-open text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-300 mb-2">
                  Your Journal Awaits
                </h3>
                <p className="text-gray-500 text-lg">
                  Start writing or record your first voice entry to begin your
                  creative journey
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-3">
                          {entry.title || "Untitled Entry"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-2">
                            <i className="fas fa-calendar"></i>
                            {formatDate(entry.created_at)}
                          </span>
                          {entry.mood && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getMoodGradient(
                                entry.mood
                              )} text-white`}
                            >
                              {getMoodLabel(entry.mood)}
                            </span>
                          )}
                          {entry.entry_type === "voice" && (
                            <span className="flex items-center gap-2 text-purple-400">
                              <i className="fas fa-microphone text-xs"></i>
                              Voice Entry
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-300 leading-relaxed">
                        {entry.content}
                      </p>
                    </div>

                    {entry.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={entry.imageUrl}
                          alt="Journal entry"
                          className="w-full max-h-64 object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-300 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {shouldShowCaelResponse(
                      entry.mood,
                      entry.tags,
                      user.id
                    ) && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                        <p className="text-sm text-purple-300 mb-2">
                          <i className="fas fa-star mr-2"></i>
                          This entry qualifies for Cael's cosmic wisdom
                        </p>
                        <div className="text-xs text-gray-400">
                          Filters matched:{" "}
                          {entry.mood === "resilience" || entry.mood === "grief"
                            ? "Special mood"
                            : ""}
                          {entry.tags?.some((tag) =>
                            ["nature", "healing", "growth", "wisdom"].includes(
                              tag.toLowerCase()
                            )
                          )
                            ? " • Special tags"
                            : ""}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Entry Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-feather-alt text-white text-sm"></i>
                </div>
                Create Journal Entry
              </h3>

              <form onSubmit={createEntry}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newEntry.title}
                      onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Give your entry a title..."
                      className="w-full p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Content *
                    </label>
                    <textarea
                      value={newEntry.content}
                      onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Share your thoughts..."
                      className="w-full p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      rows="6"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      How are you feeling? *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {moods.map((mood) => (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() =>
                            setNewEntry((prev) => ({
                              ...prev,
                              mood: mood.value,
                            }))
                          }
                          className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            newEntry.mood === mood.value
                              ? `bg-gradient-to-r ${mood.color} text-white shadow-lg`
                              : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-purple-500/20"
                          }`}
                        >
                          {mood.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Tags
                    </label>
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                        placeholder="Add a tag..."
                        className="flex-1 p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        Add
                      </button>
                    </div>
                    {newEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newEntry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-300 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-red-400 hover:text-red-300 ml-1 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Image (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2">
                        <i className="fas fa-image"></i>
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadLoading}
                        />
                      </label>
                      {uploadLoading && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                    {newEntry.imageUrl && (
                      <div className="mt-4 relative">
                        <img
                          src={newEntry.imageUrl}
                          alt="Preview"
                          className="w-full max-h-40 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewEntry((prev) => ({ ...prev, imageUrl: "" }))
                          }
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {createError && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {createError}
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewEntry({
                        title: "",
                        content: "",
                        mood: "",
                        tags: [],
                        imageUrl: "",
                      });
                      setCreateError(null);
                      setCaelResponse(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createLoading ||
                      !newEntry.title.trim() ||
                      !newEntry.content.trim() ||
                      !newEntry.mood
                    }
                    className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    {createLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Creating...
                      </span>
                    ) : (
                      "Create Entry"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cael Response Modal */}
        {showCaelResponse && (caelResponse || caelVoiceResponse) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-astronaut text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">
                  Cael's Cosmic Wisdom
                </h3>
              </div>

              <div className="space-y-4">
                {caelResponse && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-gray-300 leading-relaxed italic">
                      {caelResponse.quote}
                    </p>
                    {caelResponse.audioUrl && (
                      <button
                        onClick={() => playAudio(caelResponse.audioUrl)}
                        disabled={playingAudio}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200"
                      >
                        <i
                          className={`fas ${
                            playingAudio ? "fa-pause" : "fa-play"
                          }`}
                        ></i>
                        {playingAudio ? "Playing..." : "Play Audio"}
                      </button>
                    )}
                  </div>
                )}

                {caelVoiceResponse && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                      <p className="text-gray-300 leading-relaxed">
                        {caelVoiceResponse.text}
                      </p>
                      {caelVoiceResponse.audioUrl && (
                        <button
                          onClick={() => playAudio(caelVoiceResponse.audioUrl)}
                          disabled={playingAudio}
                          className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200"
                        >
                          <i
                            className={`fas ${
                              playingAudio ? "fa-pause" : "fa-play"
                            }`}
                          ></i>
                          {playingAudio ? "Playing..." : "Play Voice Response"}
                        </button>
                      )}
                    </div>

                    {caelVoiceResponse.mood_analysis && (
                      <div className="p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-xl">
                        <h4 className="text-sm font-semibold text-teal-300 mb-2">
                          Mood Analysis
                        </h4>
                        <div className="text-sm text-gray-400">
                          <p>
                            Dominant Mood:{" "}
                            <span className="text-teal-300">
                              {caelVoiceResponse.mood_analysis.dominant_mood}
                            </span>
                          </p>
                          <p>
                            Entries Analyzed:{" "}
                            {caelVoiceResponse.mood_analysis.total_entries}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowCaelResponse(false);
                    setCaelResponse(null);
                    setCaelVoiceResponse(null);
                  }}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 mb-4">
              ✨{" "}
              <strong className="text-purple-300">
                Cosmic Journal Features:
              </strong>
            </p>
            <p className="text-sm text-gray-400 mb-2">
              • Voice entries unlock deeper insights with Cael's AI analysis
            </p>
            <p className="text-sm text-gray-400 mb-2">
              • Special moods and tags trigger personalized wisdom responses
            </p>
            <p className="text-sm text-gray-400 mb-2">
              • Upload images to enhance your emotional expressions
            </p>
            <p className="text-sm text-gray-400">
              • Generate poetic voice responses from your entire journal
              collection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;