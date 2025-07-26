async function handler({ content, media_url, is_private = false }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  if (!content || content.trim() === "") {
    return { error: "Content is required" };
  }

  try {
    const [newPost] = await sql`
      INSERT INTO posts (user_id, content, media_url, is_private, created_at, updated_at)
      VALUES (${session.user.id}, ${content.trim()}, ${
      media_url || null
    }, ${is_private}, NOW(), NOW())
      RETURNING *
    `;

    const [postWithUser] = await sql`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email
      FROM posts p
      JOIN auth_users u ON p.user_id = u.id
      WHERE p.id = ${newPost.id}
    `;

    return {
      success: true,
      post: postWithUser,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    return { error: "Failed to create post" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}