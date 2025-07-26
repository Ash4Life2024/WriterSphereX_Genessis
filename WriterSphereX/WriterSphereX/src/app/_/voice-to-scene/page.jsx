"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [generatedScene, setGeneratedScene] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [recognition, setRecognition] = React.useState(null);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [voiceSettings, setVoiceSettings] = React.useState(null);
  const [sceneType, setSceneType] = React.useState("narrative");
  const [contextHistory, setContextHistory] = React.useState([]);

  const { data: user, loading: userLoading } = useUser();

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingContent,
    onFinish: (content) => {
      setGeneratedScene(content);
      setContextHistory((prev) => [...prev, { transcript, scene: content }]);
      setStreamingContent("");
      setLoading(false);
    },
  });

  React.useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = "en-US";

      speechRecognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript((prev) => prev + finalTranscript);
      };

      speechRecognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      speechRecognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(speechRecognition);
    } else {
      setError("Speech recognition not supported in this browser");
    }

    fetchVoiceSettings();
  }, []);

  const fetchVoiceSettings = async () => {
    try {
      const response = await fetch("/api/voice/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVoiceSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Error fetching voice settings:", err);
    }
  };

  const startRecording = () => {
    if (recognition) {
      setError(null);
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setGeneratedScene("");
    setStreamingContent("");
    setError(null);
  };

  const generateScene = async () => {
    if (!transcript.trim()) {
      setError("Please record some speech first");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedScene("");

    try {
      const contextPrompt =
        contextHistory.length > 0
          ? `Previous context for story coherence:\n${contextHistory
              .slice(-3)
              .map(
                (item) =>
                  `Input: "${
                    item.transcript
                  }"\nGenerated: "${item.scene.substring(0, 200)}..."`
              )
              .join("\n\n")}\n\n`
          : "";

      let systemPrompt = "";
      let userPrompt = "";

      switch (sceneType) {
        case "narrative":
          systemPrompt =
            "You are an expert creative writer specializing in narrative scene generation. Transform spoken input into rich, detailed narrative scenes with vivid descriptions, character development, and atmospheric details. Maintain story coherence and context awareness.";
          userPrompt = `${contextPrompt}Transform this spoken input into a detailed narrative scene: "${transcript}"\n\nCreate a full paragraph or scene with:\n- Rich sensory descriptions\n- Character emotions and motivations\n- Atmospheric details\n- Dialogue if appropriate\n- Story progression that flows naturally`;
          break;
        case "dialogue":
          systemPrompt =
            "You are a dialogue specialist who converts spoken input into natural, engaging dialogue scenes. Focus on character voice, subtext, and realistic conversation flow.";
          userPrompt = `${contextPrompt}Convert this spoken input into a dialogue scene: "${transcript}"\n\nCreate realistic dialogue with:\n- Natural speech patterns\n- Character-specific voices\n- Subtext and emotion\n- Stage directions\n- Conversational flow`;
          break;
        case "description":
          systemPrompt =
            "You are a descriptive writing expert who transforms spoken input into vivid, immersive descriptions. Focus on sensory details, atmosphere, and visual imagery.";
          userPrompt = `${contextPrompt}Transform this spoken input into rich descriptive writing: "${transcript}"\n\nCreate detailed descriptions with:\n- Vivid sensory details\n- Atmospheric elements\n- Visual imagery\n- Emotional undertones\n- Immersive environment`;
          break;
        case "action":
          systemPrompt =
            "You are an action scene specialist who converts spoken input into dynamic, engaging action sequences. Focus on pacing, movement, and tension.";
          userPrompt = `${contextPrompt}Convert this spoken input into an action scene: "${transcript}"\n\nCreate dynamic action with:\n- Fast-paced movement\n- Tension and suspense\n- Clear sequence of events\n- Physical descriptions\n- Emotional stakes`;
          break;
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
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate scene: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to generate scene. Please try again.");
      setLoading(false);
    }
  };

  const enhanceWithContext = async () => {
    if (!generatedScene) {
      setError("Please generate a scene first");
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
                content:
                  "You are a story enhancement specialist. Take existing scenes and enhance them with deeper context, richer details, and improved narrative flow while maintaining the original essence.",
              },
              {
                role: "user",
                content: `Enhance this scene with deeper context and richer details:\n\n"${generatedScene}"\n\nImprove it by adding:\n- More sensory details\n- Deeper character insights\n- Enhanced atmosphere\n- Stronger emotional resonance\n- Better narrative flow\n\nKeep the core story but make it more immersive and engaging.`,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to enhance scene: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to enhance scene. Please try again.");
      setLoading(false);
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
        <h1 className="text-4xl font-bold mb-4">Voice-to-Scene Tool</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to use voice recording
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
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Voice-to-Scene Tool
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transform your spoken words into rich narrative scenes with
            AI-powered voice recognition and creative writing assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voice Recording Panel */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-microphone text-red-400"></i>
                Voice Recording
              </h2>

              <div className="text-center mb-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!recognition}
                  className={`w-24 h-24 rounded-full font-semibold text-lg transition-all duration-200 ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                  } ${!recognition ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isRecording ? (
                    <i className="fas fa-stop text-2xl"></i>
                  ) : (
                    <i className="fas fa-microphone text-2xl"></i>
                  )}
                </button>
                <p className="mt-2 text-sm text-gray-400">
                  {isRecording
                    ? "Recording... Click to stop"
                    : "Click to start recording"}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scene Type
                </label>
                <select
                  value={sceneType}
                  onChange={(e) => setSceneType(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="narrative">Narrative Scene</option>
                  <option value="dialogue">Dialogue Scene</option>
                  <option value="description">Descriptive Writing</option>
                  <option value="action">Action Scene</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={generateScene}
                  disabled={loading || !transcript.trim()}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  {loading ? "Generating..." : "Generate Scene"}
                </button>
                <button
                  onClick={clearTranscript}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Transcript Display */}
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="fas fa-file-text text-blue-400"></i>
                Voice Transcript
              </h3>
              <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 min-h-[120px]">
                {transcript ? (
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {transcript}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">
                    Your speech will appear here...
                  </p>
                )}
              </div>
            </div>

            {/* Context History */}
            {contextHistory.length > 0 && (
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <i className="fas fa-history text-green-400"></i>
                  Context History ({contextHistory.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contextHistory.slice(-3).map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#0a0a0a] border border-gray-700 rounded p-2"
                    >
                      <p className="text-xs text-gray-400 mb-1">Input:</p>
                      <p className="text-sm text-gray-300 mb-2">
                        {item.transcript.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-gray-400 mb-1">Generated:</p>
                      <p className="text-sm text-gray-300">
                        {item.scene.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated Scene Panel */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <i className="fas fa-magic text-purple-400"></i>
                  Generated Scene
                </h3>
                {generatedScene && (
                  <button
                    onClick={enhanceWithContext}
                    disabled={loading}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    {loading ? "Enhancing..." : "Enhance"}
                  </button>
                )}
              </div>

              <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 min-h-[400px]">
                {loading && streamingContent ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm text-gray-400">
                        Generating scene...
                      </span>
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {streamingContent}
                    </div>
                  </div>
                ) : generatedScene ? (
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {generatedScene}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-feather-alt text-4xl text-gray-600 mb-4"></i>
                    <p className="text-gray-500">
                      Your generated scene will appear here
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Record your voice and click "Generate Scene" to begin
                    </p>
                  </div>
                )}
              </div>

              {generatedScene && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedScene);
                    }}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copy Scene
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedScene], {
                        type: "text/plain",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "generated-scene.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* Voice Settings Display */}
            {voiceSettings && (
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <i className="fas fa-cog text-yellow-400"></i>
                  Voice Settings
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Gender</p>
                    <p className="text-white capitalize">
                      {voiceSettings.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Accent</p>
                    <p className="text-white capitalize">
                      {voiceSettings.accent}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Style</p>
                    <p className="text-white capitalize">
                      {voiceSettings.style}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">
            💡 <strong>Tips for better scene generation:</strong>
          </p>
          <p className="mb-2">
            • Speak clearly and describe scenes, emotions, or actions you want
            to develop
          </p>
          <p className="mb-2">
            • Use different scene types for varied narrative styles and purposes
          </p>
          <p className="mb-2">
            • The tool maintains context from previous generations for story
            coherence
          </p>
          <p>
            • Try the "Enhance" feature to add more depth and detail to
            generated scenes
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;