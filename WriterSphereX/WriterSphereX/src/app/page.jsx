"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newPost, setNewPost] = React.useState({
    content: "",
    mediaUrl: "",
    isPrivate: false,
  });
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploadLoading }] = useUpload();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/get-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 20,
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch posts: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      fetchPosts();
    }
  }, [userLoading, user]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) {
      setCreateError("Please write something to share");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/create-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newPost.content,
          mediaUrl: newPost.mediaUrl,
          isPrivate: newPost.isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create post: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setNewPost({ content: "", mediaUrl: "", isPrivate: false });
      setShowCreateForm(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create post. Please try again.");
    } finally {
      setCreateLoading(false);
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

      setNewPost((prev) => ({ ...prev, mediaUrl: url }));
    } catch (err) {
      console.error(err);
      setCreateError("Failed to upload media. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              Writer's Sphere
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-sm opacity-60"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-md">
            Connect with fellow writers and share your creative journey
          </p>
          <a
            href="/account/signin"
            className="inline-block bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            Join the Community
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Writer's Sphere
            </h1>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Share your thoughts, inspire others, and connect with the creative
            community
          </p>
        </div>

        {/* Create Post Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus"></i>
            Share Your Story
          </button>
        </div>

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
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-3xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">
              No Posts Yet
            </h3>
            <p className="text-gray-500 text-lg">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white text-sm"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {post.userName || "Anonymous Writer"}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <i className="fas fa-clock"></i>
                        {formatDate(post.createdAt)}
                        {post.isPrivate && (
                          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300 rounded-full text-xs">
                            Private
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {post.mediaUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    {post.mediaUrl.includes("image") ||
                    post.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full max-h-96 object-cover"
                      />
                    ) : (
                      <video
                        controls
                        src={post.mediaUrl}
                        className="w-full max-h-96 object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-purple-500/20">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors duration-200">
                    <i className="fas fa-heart"></i>
                    <span>Like</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors duration-200">
                    <i className="fas fa-comment"></i>
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors duration-200">
                    <i className="fas fa-share"></i>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Post Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus text-white text-sm"></i>
                </div>
                Create Post
              </h3>

              <form onSubmit={createPost}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      What's on your mind?
                    </label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Share your thoughts, writing progress, or creative insights..."
                      className="w-full p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      rows="6"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Add Media (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2">
                        <i className="fas fa-upload"></i>
                        Upload File
                        <input
                          type="file"
                          accept="image/*,video/*"
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
                    {newPost.mediaUrl && (
                      <div className="mt-4 relative">
                        <img
                          src={newPost.mediaUrl}
                          alt="Preview"
                          className="w-full max-h-40 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewPost((prev) => ({ ...prev, mediaUrl: "" }))
                          }
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={newPost.isPrivate}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          isPrivate: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-purple-600 bg-slate-800/50 border-purple-500/20 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label
                      htmlFor="isPrivate"
                      className="text-sm text-gray-300"
                    >
                      Make this post private
                    </label>
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
                      setNewPost({
                        content: "",
                        mediaUrl: "",
                        isPrivate: false,
                      });
                      setCreateError(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newPost.content.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    {createLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Posting...
                      </span>
                    ) : (
                      "Share Post"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 mb-4">
              ✨{" "}
              <strong className="text-purple-300">Community Guidelines:</strong>
            </p>
            <p className="text-sm text-gray-400 mb-2">
              • Share your writing journey and creative insights
            </p>
            <p className="text-sm text-gray-400 mb-2">
              • Support and encourage fellow writers
            </p>
            <p className="text-sm text-gray-400">
              • Keep content positive and constructive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;