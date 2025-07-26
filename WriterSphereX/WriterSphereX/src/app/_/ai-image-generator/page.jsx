"use client";
import React from "react";

function MainComponent() {
  const [prompt, setPrompt] = React.useState("");
  const [generatedImage, setGeneratedImage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [chatGptLoading, setChatGptLoading] = React.useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = React.useState("");
  const [selectedStyle, setSelectedStyle] = React.useState("artistic");
  const [history, setHistory] = React.useState([]);

  const styles = [
    {
      value: "artistic",
      label: "🎨 Artistic",
      description: "Creative and imaginative",
    },
    {
      value: "photorealistic",
      label: "📸 Photorealistic",
      description: "Lifelike and detailed",
    },
    {
      value: "digital_art",
      label: "🖥️ Digital Art",
      description: "Modern digital style",
    },
    {
      value: "watercolor",
      label: "🎭 Watercolor",
      description: "Soft watercolor painting",
    },
    {
      value: "oil_painting",
      label: "🖌️ Oil Painting",
      description: "Classic oil painting style",
    },
    {
      value: "cyberpunk",
      label: "🌃 Cyberpunk",
      description: "Futuristic neon aesthetics",
    },
    {
      value: "fantasy",
      label: "🧙 Fantasy",
      description: "Magical and mystical",
    },
    {
      value: "minimalist",
      label: "⚪ Minimalist",
      description: "Clean and simple",
    },
  ];

  const enhancePromptWithAI = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    setChatGptLoading(true);
    setError(null);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert at creating detailed, artistic image prompts for AI image generation. Take the user's basic idea and expand it into a rich, detailed prompt that will produce stunning visual results. Include artistic style, lighting, composition, colors, and mood details. Focus on ${selectedStyle} style characteristics.`,
            },
            {
              role: "user",
              content: `Enhance this image prompt for better AI image generation in ${selectedStyle} style: "${prompt}"`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to enhance prompt: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const enhanced = data.choices[0].message.content;
        setEnhancedPrompt(enhanced);
        setPrompt(enhanced);
      } else {
        throw new Error("No enhanced prompt generated");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to enhance prompt. Please try again.");
    } finally {
      setChatGptLoading(false);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/integrations/dall-e-3/?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate image: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const newImage = {
          id: Date.now(),
          url: data.data[0],
          prompt: prompt,
          style: selectedStyle,
          timestamp: new Date().toISOString(),
        };
        setGeneratedImage(newImage);
        setHistory((prev) => [newImage, ...prev.slice(0, 9)]); // Keep last 10 images
      } else {
        throw new Error("No image generated");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              AI Image Forge
            </h1>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your wildest imagination into stunning visuals with
            AI-powered image generation and intelligent prompt enhancement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Generation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-paint-brush text-white text-sm"></i>
                </div>
                Create Your Vision
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Describe your image
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="A majestic dragon soaring through a storm-filled sky..."
                    className="w-full p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    rows="4"
                    disabled={loading || chatGptLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {styles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          selectedStyle === style.value
                            ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg"
                            : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-purple-500/20"
                        }`}
                      >
                        <div className="text-center">
                          <div className="mb-1">{style.label}</div>
                          <div className="text-xs text-gray-400">
                            {style.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={enhancePromptWithAI}
                    disabled={chatGptLoading || loading || !prompt.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
                  >
                    {chatGptLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        Enhance with AI
                      </>
                    )}
                  </button>

                  <button
                    onClick={generateImage}
                    disabled={loading || !prompt.trim() || chatGptLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sparkles"></i>
                        Generate Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 backdrop-blur-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}

            {/* Enhanced Prompt Display */}
            {enhancedPrompt && enhancedPrompt !== prompt && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/30 rounded-xl text-blue-300 backdrop-blur-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <i className="fas fa-brain"></i>
                  AI Enhanced Prompt:
                </h3>
                <p className="text-sm">{enhancedPrompt}</p>
              </div>
            )}

            {/* Generated Image */}
            {generatedImage && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="relative group">
                  <img
                    src={generatedImage.url}
                    alt="Generated image"
                    className="w-full h-auto rounded-xl shadow-2xl"
                    style={{ maxHeight: "600px", objectFit: "contain" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={generatedImage.url}
                    download="generated-image.png"
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-download"></i>
                    Download Image
                  </a>
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setPrompt("");
                      setEnhancedPrompt("");
                    }}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-md flex items-center justify-center">
                  <i className="fas fa-history text-white text-xs"></i>
                </div>
                Recent Creations
              </h3>

              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        setGeneratedImage(item);
                        setPrompt(item.prompt);
                        setSelectedStyle(item.style);
                      }}
                    >
                      <div className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-3 hover:border-purple-500/30 transition-all duration-200">
                        <img
                          src={item.url}
                          alt="Generated"
                          className="w-full h-20 object-cover rounded-lg mb-2"
                        />
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {item.prompt}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-purple-400">
                            {styles.find((s) => s.value === item.style)
                              ?.label || item.style}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-images text-2xl text-white"></i>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Your generated images will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 mb-4">
              ✨ <strong className="text-purple-300">Pro Tips:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-teal-300">Style Matters:</strong> Choose
                the right style for your vision
              </div>
              <div>
                <strong className="text-purple-300">AI Enhancement:</strong> Let
                AI refine your prompts for better results
              </div>
              <div>
                <strong className="text-blue-300">Be Specific:</strong> Include
                details about lighting, mood, and composition
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;