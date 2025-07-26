"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [content, setContent] = React.useState("");
  const [scanResults, setScanResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [realTimeChecking, setRealTimeChecking] = React.useState(false);
  const [scanHistory, setScanHistory] = React.useState([]);
  const [selectedMatch, setSelectedMatch] = React.useState(null);
  const [streamingResults, setStreamingResults] = React.useState("");

  const { data: user, loading: userLoading } = useUser();

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingResults,
    onFinish: (results) => {
      try {
        const parsedResults = JSON.parse(results);
        setScanResults(parsedResults);
        setScanHistory((prev) => [parsedResults, ...prev.slice(0, 9)]);
      } catch (err) {
        console.error("Error parsing results:", err);
        setError("Failed to parse scan results");
      }
      setStreamingResults("");
      setLoading(false);
    },
  });

  const performPlagiarismScan = async () => {
    if (!content.trim()) {
      setError("Please enter content to scan");
      return;
    }

    setLoading(true);
    setError(null);
    setScanResults(null);

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
                  "You are an advanced plagiarism detection system. Analyze the provided text for potential originality issues, similarity patterns, and provide detailed feedback. Return results in JSON format with specific structure for originality scoring, potential matches, and improvement suggestions.",
              },
              {
                role: "user",
                content: `Perform a comprehensive plagiarism and originality analysis on this text:

"${content}"

Please provide a detailed JSON response with the following structure:
{
  "originalityScore": number (0-100),
  "overallRisk": "low" | "medium" | "high",
  "wordCount": number,
  "uniquePhrases": number,
  "commonPhrases": number,
  "potentialMatches": [
    {
      "text": "matched text segment",
      "similarity": number (0-100),
      "riskLevel": "low" | "medium" | "high",
      "suggestedSource": "potential source type",
      "startIndex": number,
      "endIndex": number
    }
  ],
  "writingStyle": {
    "complexity": "simple" | "moderate" | "complex",
    "tone": "formal" | "informal" | "academic",
    "uniqueness": number (0-100)
  },
  "improvements": [
    {
      "issue": "description of issue",
      "suggestion": "improvement suggestion",
      "priority": "low" | "medium" | "high"
    }
  ],
  "sourceAttribution": [
    {
      "type": "citation needed",
      "text": "text requiring citation",
      "reason": "why citation is needed"
    }
  ],
  "summary": "overall assessment summary"
}

Analyze for:
- Originality and uniqueness
- Common phrases and clichés
- Potential similarity to academic, web, or published content
- Writing style consistency
- Areas needing source attribution
- Specific improvement recommendations`,
              },
            ],
            json_schema: {
              name: "plagiarism_analysis",
              schema: {
                type: "object",
                properties: {
                  originalityScore: { type: "number" },
                  overallRisk: { type: "string" },
                  wordCount: { type: "number" },
                  uniquePhrases: { type: "number" },
                  commonPhrases: { type: "number" },
                  potentialMatches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        similarity: { type: "number" },
                        riskLevel: { type: "string" },
                        suggestedSource: { type: "string" },
                        startIndex: { type: "number" },
                        endIndex: { type: "number" },
                      },
                      required: [
                        "text",
                        "similarity",
                        "riskLevel",
                        "suggestedSource",
                        "startIndex",
                        "endIndex",
                      ],
                      additionalProperties: false,
                    },
                  },
                  writingStyle: {
                    type: "object",
                    properties: {
                      complexity: { type: "string" },
                      tone: { type: "string" },
                      uniqueness: { type: "number" },
                    },
                    required: ["complexity", "tone", "uniqueness"],
                    additionalProperties: false,
                  },
                  improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        priority: { type: "string" },
                      },
                      required: ["issue", "suggestion", "priority"],
                      additionalProperties: false,
                    },
                  },
                  sourceAttribution: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        text: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["type", "text", "reason"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: [
                  "originalityScore",
                  "overallRisk",
                  "wordCount",
                  "uniquePhrases",
                  "commonPhrases",
                  "potentialMatches",
                  "writingStyle",
                  "improvements",
                  "sourceAttribution",
                  "summary",
                ],
                additionalProperties: false,
              },
            },
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to scan content: ${response.status} ${response.statusText}`
        );
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setError("Failed to perform plagiarism scan. Please try again.");
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getRiskBgColor = (risk) => {
    switch (risk) {
      case "low":
        return "bg-green-900/20 border-green-700";
      case "medium":
        return "bg-yellow-900/20 border-yellow-700";
      case "high":
        return "bg-red-900/20 border-red-700";
      default:
        return "bg-gray-900/20 border-gray-700";
    }
  };

  const highlightMatches = (text, matches) => {
    if (!matches || matches.length === 0) return text;

    let highlightedText = text;
    const sortedMatches = [...matches].sort(
      (a, b) => b.startIndex - a.startIndex
    );

    sortedMatches.forEach((match, index) => {
      const before = highlightedText.substring(0, match.startIndex);
      const matchText = highlightedText.substring(
        match.startIndex,
        match.endIndex
      );
      const after = highlightedText.substring(match.endIndex);

      const colorClass =
        match.riskLevel === "high"
          ? "bg-red-500/30"
          : match.riskLevel === "medium"
          ? "bg-yellow-500/30"
          : "bg-blue-500/30";

      highlightedText =
        before +
        `<span class="${colorClass} cursor-pointer rounded px-1" onclick="setSelectedMatch(${JSON.stringify(
          match
        ).replace(/"/g, "&quot;")})">${matchText}</span>` +
        after;
    });

    return highlightedText;
  };

  React.useEffect(() => {
    if (realTimeChecking && content.trim() && content.length > 50) {
      const debounceTimer = setTimeout(() => {
        performPlagiarismScan();
      }, 2000);

      return () => clearTimeout(debounceTimer);
    }
  }, [content, realTimeChecking]);

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
        <h1 className="text-4xl font-bold mb-4">Originality Shield</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to access plagiarism detection
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
            Originality Shield
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Advanced plagiarism detection and originality checking system with
            real-time scanning, similarity scoring, and detailed improvement
            suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Content Analysis</h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={realTimeChecking}
                      onChange={(e) => setRealTimeChecking(e.target.checked)}
                      className="rounded"
                    />
                    Real-time checking
                  </label>
                  <button
                    onClick={performPlagiarismScan}
                    disabled={loading || !content.trim()}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    {loading ? "Scanning..." : "Scan Content"}
                  </button>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type your content here for originality analysis..."
                className="w-full h-64 p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500 transition-colors"
                disabled={loading}
              />

              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <span>
                  {content.length} characters,{" "}
                  {
                    content.split(/\s+/).filter((word) => word.length > 0)
                      .length
                  }{" "}
                  words
                </span>
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing content...</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  {error}
                </div>
              )}
            </div>

            {streamingResults && (
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <h2 className="text-xl font-semibold">
                    Processing Analysis...
                  </h2>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                  {streamingResults}
                </div>
              </div>
            )}

            {scanResults && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-shield-alt text-blue-400"></i>
                    Originality Report
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {scanResults.originalityScore}%
                      </div>
                      <div className="text-sm text-gray-400">
                        Originality Score
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold mb-1 ${getRiskColor(
                          scanResults.overallRisk
                        )}`}
                      >
                        {scanResults.overallRisk.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-400">Risk Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {scanResults.uniquePhrases}
                      </div>
                      <div className="text-sm text-gray-400">
                        Unique Phrases
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-gray-300">{scanResults.summary}</p>
                  </div>
                </div>

                {scanResults.potentialMatches &&
                  scanResults.potentialMatches.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-search text-yellow-400"></i>
                        Potential Matches ({scanResults.potentialMatches.length}
                        )
                      </h2>

                      <div className="space-y-4">
                        {scanResults.potentialMatches.map((match, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors duration-200 ${getRiskBgColor(
                              match.riskLevel
                            )} hover:bg-opacity-80`}
                            onClick={() => setSelectedMatch(match)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`font-semibold ${getRiskColor(
                                  match.riskLevel
                                )}`}
                              >
                                {match.similarity}% Similarity
                              </span>
                              <span className="text-sm text-gray-400">
                                {match.suggestedSource}
                              </span>
                            </div>
                            <div className="text-gray-300 text-sm">
                              "{match.text}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <i className="fas fa-pen-fancy text-purple-400"></i>
                      Writing Style Analysis
                    </h2>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Complexity:</span>
                        <span className="capitalize">
                          {scanResults.writingStyle.complexity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tone:</span>
                        <span className="capitalize">
                          {scanResults.writingStyle.tone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Style Uniqueness:</span>
                        <span>{scanResults.writingStyle.uniqueness}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <i className="fas fa-chart-bar text-green-400"></i>
                      Content Statistics
                    </h2>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Word Count:</span>
                        <span>{scanResults.wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Unique Phrases:</span>
                        <span className="text-green-400">
                          {scanResults.uniquePhrases}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Common Phrases:</span>
                        <span className="text-yellow-400">
                          {scanResults.commonPhrases}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {scanResults.improvements &&
                  scanResults.improvements.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-lightbulb text-yellow-400"></i>
                        Improvement Suggestions
                      </h2>

                      <div className="space-y-4">
                        {scanResults.improvements.map((improvement, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${getRiskBgColor(
                              improvement.priority
                            )}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`text-sm font-semibold ${getRiskColor(
                                  improvement.priority
                                )}`}
                              >
                                {improvement.priority.toUpperCase()} PRIORITY
                              </span>
                            </div>
                            <div className="font-medium mb-2">
                              {improvement.issue}
                            </div>
                            <div className="text-gray-300 text-sm">
                              {improvement.suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {scanResults.sourceAttribution &&
                  scanResults.sourceAttribution.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-quote-right text-blue-400"></i>
                        Source Attribution Needed
                      </h2>

                      <div className="space-y-4">
                        {scanResults.sourceAttribution.map(
                          (attribution, index) => (
                            <div
                              key={index}
                              className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg"
                            >
                              <div className="font-medium mb-2">
                                {attribution.type}
                              </div>
                              <div className="text-gray-300 text-sm mb-2">
                                "{attribution.text}"
                              </div>
                              <div className="text-blue-300 text-sm">
                                {attribution.reason}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Scan History</h2>

              {scanHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No scans performed yet
                </p>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors duration-200"
                      onClick={() => setScanResults(scan)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Score: {scan.originalityScore}%
                        </span>
                        <span
                          className={`text-xs ${getRiskColor(
                            scan.overallRisk
                          )}`}
                        >
                          {scan.overallRisk.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {scan.wordCount} words •{" "}
                        {scan.potentialMatches?.length || 0} matches
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-semibold mb-3">Quick Tips</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Enable real-time checking for instant feedback</p>
                  <p>• Aim for 80%+ originality score</p>
                  <p>• Review all high-risk matches carefully</p>
                  <p>• Add proper citations for referenced content</p>
                  <p>• Use improvement suggestions to enhance uniqueness</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Match Details</h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${getRiskBgColor(
                    selectedMatch.riskLevel
                  )}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-semibold ${getRiskColor(
                        selectedMatch.riskLevel
                      )}`}
                    >
                      {selectedMatch.similarity}% Similarity
                    </span>
                    <span className="text-sm text-gray-400">
                      {selectedMatch.suggestedSource}
                    </span>
                  </div>
                  <div className="text-gray-300">"{selectedMatch.text}"</div>
                </div>

                <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Rephrase the content in your own words</li>
                    <li>• Add proper citation if referencing a source</li>
                    <li>• Consider alternative expressions or synonyms</li>
                    <li>• Ensure the content adds unique value</li>
                  </ul>
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