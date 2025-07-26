"use client";
import React from "react";

function MainComponent() {
  const [activeTab, setActiveTab] = React.useState("cover");
  const [coverData, setCoverData] = React.useState({
    title: "",
    author: "",
    genre: "fantasy",
    mood: "dark",
    elements: "",
    style: "realistic",
    typography: "serif",
  });
  const [authorData, setAuthorData] = React.useState({
    description: "",
    style: "professional",
    background: "neutral",
    lighting: "soft",
    pose: "headshot",
  });
  const [generatedCovers, setGeneratedCovers] = React.useState([]);
  const [generatedPhotos, setGeneratedPhotos] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedDesign, setSelectedDesign] = React.useState(null);
  const [showCustomization, setShowCustomization] = React.useState(false);

  const { data: user, loading: userLoading } = useUser();

  const genres = [
    { value: "fantasy", label: "Fantasy", icon: "fas fa-dragon" },
    { value: "romance", label: "Romance", icon: "fas fa-heart" },
    { value: "mystery", label: "Mystery", icon: "fas fa-search" },
    { value: "scifi", label: "Sci-Fi", icon: "fas fa-rocket" },
    { value: "thriller", label: "Thriller", icon: "fas fa-bolt" },
    { value: "horror", label: "Horror", icon: "fas fa-ghost" },
    { value: "literary", label: "Literary", icon: "fas fa-feather" },
    { value: "nonfiction", label: "Non-Fiction", icon: "fas fa-book-open" },
  ];

  const moods = [
    { value: "dark", label: "Dark & Mysterious" },
    { value: "bright", label: "Bright & Uplifting" },
    { value: "dramatic", label: "Dramatic & Intense" },
    { value: "elegant", label: "Elegant & Sophisticated" },
    { value: "playful", label: "Playful & Fun" },
    { value: "minimalist", label: "Clean & Minimalist" },
  ];

  const styles = [
    { value: "realistic", label: "Photorealistic" },
    { value: "illustrated", label: "Illustrated" },
    { value: "abstract", label: "Abstract Art" },
    { value: "vintage", label: "Vintage Style" },
    { value: "modern", label: "Modern Design" },
    { value: "watercolor", label: "Watercolor" },
  ];

  const typographyOptions = [
    { value: "serif", label: "Serif (Classic)" },
    { value: "sans-serif", label: "Sans-Serif (Modern)" },
    { value: "script", label: "Script (Elegant)" },
    { value: "display", label: "Display (Bold)" },
    { value: "handwritten", label: "Handwritten" },
  ];

  const generateCoverPrompt = (data) => {
    const genreDescriptions = {
      fantasy:
        "magical, mystical elements, dragons, castles, enchanted forests",
      romance: "romantic, passionate, soft colors, couples, flowers, hearts",
      mystery: "dark, suspenseful, shadows, keys, magnifying glass, noir style",
      scifi: "futuristic, space, technology, robots, alien worlds, neon colors",
      thriller: "intense, action-packed, dramatic lighting, urban settings",
      horror: "scary, gothic, dark atmosphere, supernatural elements",
      literary: "artistic, sophisticated, symbolic imagery, muted colors",
      nonfiction: "clean, professional, informative, relevant imagery",
    };

    return `Create a professional book cover design for "${data.title}" by ${
      data.author
    }. 
    Genre: ${data.genre} with ${genreDescriptions[data.genre]}. 
    Mood: ${data.mood}. 
    Art style: ${data.style}. 
    Typography: ${data.typography} font style.
    Additional elements: ${data.elements || "genre-appropriate imagery"}.
    The cover should be visually striking, commercially viable, and suitable for both print and digital formats. 
    Include proper title placement and author name positioning. High quality, professional book cover design.`;
  };

  const generateAuthorPhotoPrompt = (data) => {
    return `Generate a professional author headshot photo. 
    Description: ${data.description || "Professional author"}.
    Style: ${data.style} photography.
    Background: ${data.background} background.
    Lighting: ${data.lighting} lighting.
    Pose: ${data.pose} composition.
    High quality, professional headshot suitable for book covers, websites, and promotional materials. 
    Clean, polished, and publishing-industry appropriate.`;
  };

  const generateCovers = async () => {
    if (!coverData.title.trim() || !coverData.author.trim()) {
      setError("Please enter both title and author name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const variations = [
        { ...coverData, style: "realistic" },
        { ...coverData, style: "illustrated" },
        { ...coverData, mood: coverData.mood === "dark" ? "bright" : "dark" },
      ];

      const covers = [];

      for (let i = 0; i < variations.length; i++) {
        const prompt = generateCoverPrompt(variations[i]);

        const response = await fetch(
          `/integrations/dall-e-3/?prompt=${encodeURIComponent(prompt)}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to generate cover ${i + 1}: ${response.status} ${
              response.statusText
            }`
          );
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          covers.push({
            id: i + 1,
            url: data.data[0],
            variation: variations[i],
            prompt: prompt,
          });
        }
      }

      setGeneratedCovers(covers);
    } catch (err) {
      console.error(err);
      setError("Failed to generate covers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateAuthorPhotos = async () => {
    if (!authorData.description.trim()) {
      setError("Please enter a description for the author photo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const variations = [
        { ...authorData, style: "professional" },
        { ...authorData, lighting: "dramatic" },
        { ...authorData, background: "library" },
      ];

      const photos = [];

      for (let i = 0; i < variations.length; i++) {
        const prompt = generateAuthorPhotoPrompt(variations[i]);

        const response = await fetch(
          `/integrations/dall-e-3/?prompt=${encodeURIComponent(prompt)}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to generate photo ${i + 1}: ${response.status} ${
              response.statusText
            }`
          );
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          photos.push({
            id: i + 1,
            url: data.data[0],
            variation: variations[i],
            prompt: prompt,
          });
        }
      }

      setGeneratedPhotos(photos);
    } catch (err) {
      console.error(err);
      setError("Failed to generate author photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h1 className="text-4xl font-bold mb-4">
          Cover Designer & Author Photos
        </h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Create professional book covers and author photos with AI
        </p>
        <a
          href="/account/signin"
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Sign In to Start Creating
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Cover Designer & Author Photos
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create professional book covers and author headshots with AI-powered
            design tools
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab("cover")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "cover"
                  ? "bg-[#2a2a2a] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-book mr-2"></i>
              Book Covers
            </button>
            <button
              onClick={() => setActiveTab("author")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "author"
                  ? "bg-[#2a2a2a] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-user-circle mr-2"></i>
              Author Photos
            </button>
          </div>
        </div>

        {/* Cover Design Tab */}
        {activeTab === "cover" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cover Form */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <i className="fas fa-palette text-blue-400"></i>
                  Cover Design
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      value={coverData.title}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter your book title"
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      value={coverData.author}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          author: e.target.value,
                        }))
                      }
                      placeholder="Enter author name"
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre
                    </label>
                    <select
                      value={coverData.genre}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          genre: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      {genres.map((genre) => (
                        <option key={genre.value} value={genre.value}>
                          {genre.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mood & Atmosphere
                    </label>
                    <select
                      value={coverData.mood}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          mood: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      {moods.map((mood) => (
                        <option key={mood.value} value={mood.value}>
                          {mood.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Art Style
                    </label>
                    <select
                      value={coverData.style}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          style: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      {styles.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Typography Style
                    </label>
                    <select
                      value={coverData.typography}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          typography: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      {typographyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Additional Elements
                    </label>
                    <textarea
                      value={coverData.elements}
                      onChange={(e) =>
                        setCoverData((prev) => ({
                          ...prev,
                          elements: e.target.value,
                        }))
                      }
                      placeholder="Describe specific elements, colors, or imagery you want..."
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500"
                      rows="3"
                    />
                  </div>

                  <button
                    onClick={generateCovers}
                    disabled={
                      loading ||
                      !coverData.title.trim() ||
                      !coverData.author.trim()
                    }
                    className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Covers...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        Generate Cover Designs
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Results */}
            <div className="lg:col-span-2">
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {generatedCovers.length > 0 && (
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <i className="fas fa-images text-green-400"></i>
                    Generated Cover Designs
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedCovers.map((cover) => (
                      <div
                        key={cover.id}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4"
                      >
                        <img
                          src={cover.url}
                          alt={`Cover design ${cover.id}`}
                          className="w-full h-auto rounded-lg mb-4"
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />

                        <div className="space-y-2 mb-4">
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Style:</span>{" "}
                            {cover.variation.style}
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Mood:</span>{" "}
                            {cover.variation.mood}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              downloadImage(
                                cover.url,
                                `book-cover-${cover.id}.png`
                              )
                            }
                            className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            <i className="fas fa-download mr-2"></i>
                            Download
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDesign(cover);
                              setShowCustomization(true);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            <i className="fas fa-edit mr-2"></i>
                            Customize
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedCovers.length === 0 && !loading && (
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-12 text-center">
                  <i className="fas fa-book text-4xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg mb-2">
                    No covers generated yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Fill in the form and click "Generate Cover Designs" to
                    create your book covers
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author Photo Tab */}
        {activeTab === "author" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Author Photo Form */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <i className="fas fa-camera text-purple-400"></i>
                  Author Photo
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Author Description *
                    </label>
                    <textarea
                      value={authorData.description}
                      onChange={(e) =>
                        setAuthorData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the author (age, appearance, style, personality)..."
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500"
                      rows="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Photography Style
                    </label>
                    <select
                      value={authorData.style}
                      onChange={(e) =>
                        setAuthorData((prev) => ({
                          ...prev,
                          style: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="artistic">Artistic</option>
                      <option value="corporate">Corporate</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Background
                    </label>
                    <select
                      value={authorData.background}
                      onChange={(e) =>
                        setAuthorData((prev) => ({
                          ...prev,
                          background: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="neutral">Neutral/Plain</option>
                      <option value="library">Library/Books</option>
                      <option value="office">Office/Study</option>
                      <option value="outdoor">Outdoor/Natural</option>
                      <option value="urban">Urban/City</option>
                      <option value="artistic">Artistic/Creative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lighting
                    </label>
                    <select
                      value={authorData.lighting}
                      onChange={(e) =>
                        setAuthorData((prev) => ({
                          ...prev,
                          lighting: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="soft">Soft & Natural</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="bright">Bright & Even</option>
                      <option value="moody">Moody & Atmospheric</option>
                      <option value="golden">Golden Hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pose & Composition
                    </label>
                    <select
                      value={authorData.pose}
                      onChange={(e) =>
                        setAuthorData((prev) => ({
                          ...prev,
                          pose: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="headshot">Headshot</option>
                      <option value="half-body">Half Body</option>
                      <option value="sitting">Sitting Pose</option>
                      <option value="standing">Standing Pose</option>
                      <option value="candid">Candid/Natural</option>
                    </select>
                  </div>

                  <button
                    onClick={generateAuthorPhotos}
                    disabled={loading || !authorData.description.trim()}
                    className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Photos...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-camera mr-2"></i>
                        Generate Author Photos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Author Photo Results */}
            <div className="lg:col-span-2">
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {generatedPhotos.length > 0 && (
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <i className="fas fa-images text-green-400"></i>
                    Generated Author Photos
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4"
                      >
                        <img
                          src={photo.url}
                          alt={`Author photo ${photo.id}`}
                          className="w-full h-auto rounded-lg mb-4"
                          style={{ maxHeight: "400px", objectFit: "contain" }}
                        />

                        <div className="space-y-2 mb-4">
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Style:</span>{" "}
                            {photo.variation.style}
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Lighting:</span>{" "}
                            {photo.variation.lighting}
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Background:</span>{" "}
                            {photo.variation.background}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            downloadImage(
                              photo.url,
                              `author-photo-${photo.id}.png`
                            )
                          }
                          className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          <i className="fas fa-download mr-2"></i>
                          Download Photo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedPhotos.length === 0 && !loading && (
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-12 text-center">
                  <i className="fas fa-user-circle text-4xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg mb-2">
                    No author photos generated yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Fill in the description and click "Generate Author Photos"
                    to create professional headshots
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 text-center text-gray-500 text-sm max-w-4xl mx-auto">
          <p className="mb-2">
            💡 <strong>Design Tips:</strong>
          </p>
          <p className="mb-2">
            • Book covers should be readable as thumbnails - keep text large and
            clear
          </p>
          <p className="mb-2">
            • Choose colors and imagery that match your genre conventions while
            standing out
          </p>
          <p className="mb-2">
            • Author photos should be professional and match your book's tone
            and target audience
          </p>
          <p>
            • All generated images are high-resolution and suitable for both
            print and digital publishing
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;