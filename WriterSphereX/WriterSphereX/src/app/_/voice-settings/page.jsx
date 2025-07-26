"use client";
import React from "react";

function MainComponent() {
  const [settings, setSettings] = React.useState({
    gender: "female",
    accent: "american",
    style: "normal",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [previewText, setPreviewText] = React.useState(
    "Hello! This is how your voice settings will sound."
  );
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const { data: user, loading: userLoading } = useUser();

  const genderOptions = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
  ];

  const accentOptions = [
    { value: "american", label: "American" },
    { value: "british", label: "British" },
    { value: "australian", label: "Australian" },
    { value: "canadian", label: "Canadian" },
  ];

  const styleOptions = [
    { value: "normal", label: "Normal" },
    { value: "casual", label: "Casual" },
    { value: "professional", label: "Professional" },
    { value: "energetic", label: "Energetic" },
  ];

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/voice/get", { method: "POST" });
      if (!response.ok) {
        throw new Error(
          `Failed to load settings: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      } else {
        throw new Error(data.error || "Failed to load settings");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load voice settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      loadSettings();
    } else if (!userLoading && !user) {
      setLoading(false);
    }
  }, [userLoading, user]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/voice/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to save settings: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Voice settings saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save voice settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const previewVoice = () => {
    if (!window.speechSynthesis) {
      setError("Speech synthesis is not supported in your browser.");
      return;
    }

    if (isPreviewing) {
      window.speechSynthesis.cancel();
      setIsPreviewing(false);
      return;
    }

    setIsPreviewing(true);
    setError(null);

    const utterance = new SpeechSynthesisUtterance(previewText);

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (voices.length > 0) {
      selectedVoice = voices.find((voice) => {
        const voiceName = voice.name.toLowerCase();
        const voiceLang = voice.lang.toLowerCase();

        if (settings.gender === "female" && voiceName.includes("female"))
          return true;
        if (settings.gender === "male" && voiceName.includes("male"))
          return true;

        if (
          settings.accent === "british" &&
          (voiceLang.includes("gb") || voiceLang.includes("uk"))
        )
          return true;
        if (settings.accent === "australian" && voiceLang.includes("au"))
          return true;
        if (settings.accent === "canadian" && voiceLang.includes("ca"))
          return true;
        if (settings.accent === "american" && voiceLang.includes("us"))
          return true;

        return false;
      });

      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => {
          return settings.gender === "female"
            ? !voice.name.toLowerCase().includes("male")
            : voice.name.toLowerCase().includes("male");
        });
      }

      if (!selectedVoice) {
        selectedVoice = voices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    switch (settings.style) {
      case "casual":
        utterance.rate = 1.1;
        utterance.pitch = 1.1;
        break;
      case "professional":
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
        break;
      case "energetic":
        utterance.rate = 1.3;
        utterance.pitch = 1.2;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    }

    utterance.onend = () => {
      setIsPreviewing(false);
    };

    utterance.onerror = () => {
      setIsPreviewing(false);
      setError("Failed to preview voice. Please try again.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSuccess(null);
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
        <h1 className="text-4xl font-bold mb-4">Voice Settings</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to customize your voice preferences
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
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Voice Settings
          </h1>
          <p className="text-gray-400">
            Customize your text-to-speech preferences
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Voice Configuration
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {genderOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleSettingChange("gender", option.value)
                          }
                          className={`p-3 rounded-lg border transition-colors duration-200 ${
                            settings.gender === option.value
                              ? "bg-[#2a2a2a] border-gray-500 text-white"
                              : "bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <i
                            className={`fas ${
                              option.value === "female" ? "fa-venus" : "fa-mars"
                            } mr-2`}
                          ></i>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Accent
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {accentOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleSettingChange("accent", option.value)
                          }
                          className={`p-3 rounded-lg border transition-colors duration-200 ${
                            settings.accent === option.value
                              ? "bg-[#2a2a2a] border-gray-500 text-white"
                              : "bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <i className="fas fa-globe mr-2"></i>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Style
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {styleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleSettingChange("style", option.value)
                          }
                          className={`p-3 rounded-lg border transition-colors duration-200 ${
                            settings.style === option.value
                              ? "bg-[#2a2a2a] border-gray-500 text-white"
                              : "bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <i className="fas fa-microphone mr-2"></i>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Settings
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
                  {success}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Voice Preview
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preview Text
                    </label>
                    <textarea
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500 transition-colors"
                      rows="3"
                      placeholder="Enter text to preview your voice settings..."
                    />
                  </div>

                  <button
                    onClick={previewVoice}
                    disabled={!previewText.trim()}
                    className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {isPreviewing ? (
                      <>
                        <i className="fas fa-stop mr-2"></i>
                        Stop Preview
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play mr-2"></i>
                        Preview Voice
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Current Settings
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gender:</span>
                    <span className="text-white capitalize">
                      {settings.gender}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Accent:</span>
                    <span className="text-white capitalize">
                      {settings.accent}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Style:</span>
                    <span className="text-white capitalize">
                      {settings.style}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  <i className="fas fa-info-circle mr-2"></i>
                  About Voice Settings
                </h2>

                <div className="space-y-3 text-gray-400 text-sm">
                  <p>
                    <strong className="text-white">Gender:</strong> Choose
                    between male and female voice options.
                  </p>
                  <p>
                    <strong className="text-white">Accent:</strong> Select your
                    preferred regional accent for speech synthesis.
                  </p>
                  <p>
                    <strong className="text-white">Style:</strong> Adjust the
                    speaking style from casual to professional.
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    Note: Voice availability depends on your browser and system.
                    Some combinations may not be available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;