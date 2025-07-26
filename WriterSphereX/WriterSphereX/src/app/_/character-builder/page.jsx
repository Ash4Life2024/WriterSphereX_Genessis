"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [character, setCharacter] = React.useState({
    name: "",
    age: "",
    occupation: "",
    location: "",
  });

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("basic");
  const [generatingSection, setGeneratingSection] = React.useState(null);
  const [streamingContent, setStreamingContent] = React.useState("");

  const { data: user, loading: userLoading } = useUser();

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingContent,
    onFinish: (content) => {
      if (generatingSection === "personality") {
        setProfile((prev) => ({ ...prev, personality: content }));
      } else if (generatingSection === "backstory") {
        setProfile((prev) => ({ ...prev, backstory: content }));
      } else if (generatingSection === "voice") {
        setProfile((prev) => ({ ...prev, voice: content }));
      } else if (generatingSection === "relationships") {
        setProfile((prev) => ({ ...prev, relationships: content }));
      } else if (generatingSection === "archetype") {
        setProfile((prev) => ({ ...prev, archetype: content }));
      }
      setStreamingContent("");
      setGeneratingSection(null);
    },
  });

  const generateProfile = async () => {
    if (!character.name.trim()) {
      setError("Please enter a character name");
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const characterInfo = `Name: ${character.name}, Age: ${
        character.age || "Unknown"
      }, Occupation: ${character.occupation || "Unknown"}, Location: ${
        character.location || "Unknown"
      }`;

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
                  "You are an expert character development specialist. Create comprehensive, detailed character profiles that feel authentic and three-dimensional. Focus on psychological depth, internal conflicts, and realistic human complexity.",
              },
              {
                role: "user",
                content: `Create a comprehensive character DNA profile for: ${characterInfo}

Please provide a detailed analysis covering:

1. CORE PERSONALITY TRAITS
- Big Five personality dimensions (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- Core values and beliefs
- Internal conflicts and contradictions
- Emotional patterns and triggers

2. PSYCHOLOGICAL ARCHETYPE
- Primary archetype (Hero, Mentor, Rebel, etc.)
- Shadow aspects and hidden traits
- Character arc potential
- Strengths and fatal flaws

3. DETAILED BACKSTORY
- Formative childhood experiences
- Key life events that shaped them
- Family dynamics and relationships
- Educational and career journey
- Traumatic or transformative moments

4. VOICE & COMMUNICATION STYLE
- Speech patterns and vocabulary
- Tone and emotional expression
- Body language and mannerisms
- How they communicate in different situations

5. RELATIONSHIP DYNAMICS
- Attachment style
- How they form and maintain relationships
- Conflict resolution style
- Trust patterns and boundaries

Make this feel like a real person with depth, contradictions, and authentic human complexity.`,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate profile: ${response.status} ${response.statusText}`
        );
      }

      setGeneratingSection("full");
      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to generate character profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateSpecificSection = async (section) => {
    if (!character.name.trim()) {
      setError("Please enter a character name first");
      return;
    }

    setGeneratingSection(section);
    setError(null);

    try {
      const characterInfo = `Name: ${character.name}, Age: ${
        character.age || "Unknown"
      }, Occupation: ${character.occupation || "Unknown"}, Location: ${
        character.location || "Unknown"
      }`;

      let prompt = "";
      switch (section) {
        case "personality":
          prompt = `Analyze the personality traits for ${characterInfo}. Focus on:
- Big Five personality dimensions with specific scores
- Core values, beliefs, and motivations
- Internal conflicts and contradictions
- Emotional patterns, triggers, and coping mechanisms
- Behavioral tendencies in different situations`;
          break;
        case "backstory":
          prompt = `Create a detailed backstory for ${characterInfo}. Include:
- Childhood experiences and family dynamics
- Formative events that shaped their worldview
- Educational and career journey
- Significant relationships and losses
- Pivotal moments that defined their character`;
          break;
        case "voice":
          prompt = `Define the voice and communication style for ${characterInfo}. Cover:
- Speech patterns, vocabulary, and linguistic quirks
- Tone variations in different emotional states
- Body language and physical mannerisms
- How they express themselves in various social contexts
- Unique phrases or expressions they might use`;
          break;
        case "relationships":
          prompt = `Analyze relationship dynamics for ${characterInfo}. Explore:
- Attachment style and relationship patterns
- How they form, maintain, and end relationships
- Trust issues and emotional boundaries
- Conflict resolution and communication in relationships
- Family dynamics and their impact on current relationships`;
          break;
        case "archetype":
          prompt = `Determine the psychological archetype for ${characterInfo}. Analyze:
- Primary archetype and its manifestations
- Shadow aspects and hidden traits
- Character arc potential and growth opportunities
- Core strengths and fatal flaws
- How this archetype influences their decisions and relationships`;
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
                content:
                  "You are an expert character development specialist. Provide detailed, psychologically accurate analysis that creates authentic, three-dimensional characters.",
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
          `Failed to generate ${section}: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError(`Failed to generate ${section}. Please try again.`);
      setGeneratingSection(null);
    }
  };

  const checkConsistency = async () => {
    if (!profile) {
      setError("Please generate a character profile first");
      return;
    }

    setGeneratingSection("consistency");
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
                  "You are a character consistency expert. Analyze character profiles for internal consistency, contradictions, and areas that need development.",
              },
              {
                role: "user",
                content: `Analyze this character profile for consistency and provide feedback:

Character: ${character.name}
${profile.personality ? `Personality: ${profile.personality}` : ""}
${profile.backstory ? `Backstory: ${profile.backstory}` : ""}
${profile.voice ? `Voice: ${profile.voice}` : ""}
${profile.relationships ? `Relationships: ${profile.relationships}` : ""}
${profile.archetype ? `Archetype: ${profile.archetype}` : ""}

Please provide:
1. Consistency analysis - what works well together
2. Potential contradictions or conflicts
3. Areas that need more development
4. Suggestions for improvement
5. Character arc recommendations`,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to check consistency: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to check consistency. Please try again.");
      setGeneratingSection(null);
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
        <h1 className="text-4xl font-bold mb-4">Character DNA Builder</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to create character profiles
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
            Character DNA Builder
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create comprehensive psychological profiles with AI-powered
            character development, archetype analysis, and consistency checking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Character Basics</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) =>
                      setCharacter({ ...character, name: e.target.value })
                    }
                    placeholder="Enter character name"
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age
                  </label>
                  <input
                    type="text"
                    value={character.age}
                    onChange={(e) =>
                      setCharacter({ ...character, age: e.target.value })
                    }
                    placeholder="e.g., 28, Early 30s"
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={character.occupation}
                    onChange={(e) =>
                      setCharacter({ ...character, occupation: e.target.value })
                    }
                    placeholder="e.g., Software Engineer"
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={character.location}
                    onChange={(e) =>
                      setCharacter({ ...character, location: e.target.value })
                    }
                    placeholder="e.g., New York City"
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={generateProfile}
                  disabled={loading || !character.name.trim()}
                  className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  {loading
                    ? "Generating Full Profile..."
                    : "Generate Complete Profile"}
                </button>

                {profile && (
                  <button
                    onClick={checkConsistency}
                    disabled={generatingSection === "consistency"}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {generatingSection === "consistency"
                      ? "Checking..."
                      : "Check Consistency"}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!profile && !streamingContent && !loading && (
              <div className="text-center py-12">
                <i className="fas fa-user-circle text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 text-lg">
                  No character profile generated yet
                </p>
                <p className="text-gray-500 text-sm">
                  Enter character details and click "Generate Complete Profile"
                  to begin
                </p>
              </div>
            )}

            {(profile || streamingContent || loading) && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    "personality",
                    "archetype",
                    "backstory",
                    "voice",
                    "relationships",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 capitalize ${
                        activeTab === tab
                          ? "bg-[#2a2a2a] text-white"
                          : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  {generatingSection === "consistency" && (
                    <button
                      onClick={() => setActiveTab("consistency")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        activeTab === "consistency"
                          ? "bg-[#2a2a2a] text-white"
                          : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                      }`}
                    >
                      Consistency Check
                    </button>
                  )}
                </div>

                {generatingSection === "full" && streamingContent && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <h2 className="text-xl font-semibold">
                        Generating Complete Profile...
                      </h2>
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {streamingContent}
                    </div>
                  </div>
                )}

                {activeTab === "personality" && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-brain text-purple-400"></i>
                        Personality Analysis
                      </h2>
                      <button
                        onClick={() => generateSpecificSection("personality")}
                        disabled={generatingSection === "personality"}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {generatingSection === "personality"
                          ? "Generating..."
                          : "Regenerate"}
                      </button>
                    </div>
                    {generatingSection === "personality" && streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.personality ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.personality}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Regenerate" to generate personality analysis
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "archetype" && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-mask text-yellow-400"></i>
                        Psychological Archetype
                      </h2>
                      <button
                        onClick={() => generateSpecificSection("archetype")}
                        disabled={generatingSection === "archetype"}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {generatingSection === "archetype"
                          ? "Generating..."
                          : "Regenerate"}
                      </button>
                    </div>
                    {generatingSection === "archetype" && streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.archetype ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.archetype}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Regenerate" to generate archetype analysis
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "backstory" && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-history text-blue-400"></i>
                        Backstory & History
                      </h2>
                      <button
                        onClick={() => generateSpecificSection("backstory")}
                        disabled={generatingSection === "backstory"}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {generatingSection === "backstory"
                          ? "Generating..."
                          : "Regenerate"}
                      </button>
                    </div>
                    {generatingSection === "backstory" && streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.backstory ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.backstory}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Regenerate" to generate backstory
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "voice" && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-microphone text-green-400"></i>
                        Voice & Communication
                      </h2>
                      <button
                        onClick={() => generateSpecificSection("voice")}
                        disabled={generatingSection === "voice"}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {generatingSection === "voice"
                          ? "Generating..."
                          : "Regenerate"}
                      </button>
                    </div>
                    {generatingSection === "voice" && streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.voice ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.voice}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Regenerate" to generate voice analysis
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "relationships" && (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-users text-red-400"></i>
                        Relationship Dynamics
                      </h2>
                      <button
                        onClick={() => generateSpecificSection("relationships")}
                        disabled={generatingSection === "relationships"}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {generatingSection === "relationships"
                          ? "Generating..."
                          : "Regenerate"}
                      </button>
                    </div>
                    {generatingSection === "relationships" &&
                    streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.relationships ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.relationships}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Regenerate" to generate relationship analysis
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "consistency" && (
                  <div className="bg-[#1a1a1a] border border-blue-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <i className="fas fa-check-circle text-blue-400"></i>
                        Consistency Analysis
                      </h2>
                    </div>
                    {generatingSection === "consistency" && streamingContent ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    ) : profile?.consistency ? (
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {profile.consistency}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Click "Check Consistency" to analyze character coherence
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">
            💡 <strong>Tips for better character development:</strong>
          </p>
          <p className="mb-2">
            • Provide specific details about age, occupation, and background for
            more accurate profiles
          </p>
          <p className="mb-2">
            • Use the consistency checker to ensure your character feels
            authentic and coherent
          </p>
          <p>
            • Generate individual sections to focus on specific aspects of
            character development
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;