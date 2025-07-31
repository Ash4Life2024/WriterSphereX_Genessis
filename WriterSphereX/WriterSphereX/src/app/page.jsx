"use client";

import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useUpload } from "../utilities/runtime-helpers";

export default function Page() {
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
  const { user, isLoading: userLoading } = useUser();
  const [upload, { loading: uploadLoading }] = useUpload();

  React.useEffect(() => {
    if (!userLoading && user) {
      fetchPosts();
    }
  }, [userLoading, user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/get-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20, offset: 0 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Fetch failed");
      setPosts(data.posts || []);
    } catch (err) {
      setError("Failed to load posts. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim())
      return setCreateError("Please write something to share");
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      const data = await res.json();
      if (!res.ok || data.error)
        throw new Error(data.error || "Creation failed");
      setNewPost({ content: "", mediaUrl: "", isPrivate: false });
      setShowCreateForm(false);
      fetchPosts();
    } catch (err) {
      setCreateError("Failed to create post. Please try again.");
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url, error } = await upload({ file });
      if (error) throw new Error(error);
      setNewPost((prev) => ({ ...prev, mediaUrl: url }));
    } catch (err) {
      setCreateError("Failed to upload media. Please try again.");
      console.error(err);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please sign in
      </div>
    );

  return (
    <div className="min-h-screen text-white px-6 py-10 bg-space-gradient font-cosmic">
      <h1 className="heading-cosmic fade-in">📖 Your Story Forge</h1>

      <button
        className="btn-glow mb-6 fade-in"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? "Cancel" : "Create New Post"}
      </button>

      {showCreateForm && (
        <form
          onSubmit={createPost}
          className="fade-in bg-slate-800 p-4 rounded-lg mb-6"
        >
          <textarea
            className="w-full p-2 bg-slate-900 text-white rounded"
            rows="4"
            value={newPost.content}
            onChange={(e) =>
              setNewPost((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder="Share your thoughts with the cosmos..."
          />
          <input
            type="file"
            onChange={handleFileUpload}
            className="mt-4 block text-sm"
          />
          <label className="block my-2 text-sm">
            <input
              type="checkbox"
              checked={newPost.isPrivate}
              onChange={(e) =>
                setNewPost((prev) => ({
                  ...prev,
                  isPrivate: e.target.checked,
                }))
              }
            />{" "}
            Make post private
          </label>
          {createError && (
            <p className="text-red-400 text-sm">{createError}</p>
          )}
          <button type="submit" className="btn-glow mt-2">
            {createLoading ? "Sharing..." : "Share to Stars"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="fade-in">🔄 Loading your constellation...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        posts.map((post, i) => (
          <div
            key={i}
            className="fade-in bg-slate-800 p-4 rounded-lg mb-4 shadow-lg"
          >
            <p className="mb-2">{post.content}</p>
            {post.mediaUrl && (
              <img
                src={post.mediaUrl}
                alt="Attached media"
                className="max-w-full rounded mb-2"
              />
            )}
            <p className="text-sm text-slate-400">
              {formatDate(post.createdAt)}
              {post.isPrivate && " • 🔒 Private"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
