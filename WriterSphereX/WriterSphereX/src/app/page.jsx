"use client";

import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client"; // ✅ Added import
import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newPost, setNewPost] = React.useState({ content: "", mediaUrl: "", isPrivate: false });
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  const { user, isLoading: userLoading } = useUser(); // ✅ Correct destructuring
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
    if (!newPost.content.trim()) return setCreateError("Please write something to share");

    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Creation failed");

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

  if (userLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in</div>;

  return (
    <div className="min-h-screen text-white p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ...UI and JSX for posts, buttons, and modals unchanged... */}
    </div>
  );
}

export default MainComponent;
