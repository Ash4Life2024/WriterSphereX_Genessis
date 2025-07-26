async function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  try {
    const posts = await sql`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email
      FROM posts p
      JOIN auth_users u ON p.user_id = u.id
      WHERE p.is_private = false 
         OR p.user_id = ${session.user.id}
      ORDER BY p.created_at DESC
    `;

    return {
      success: true,
      posts: posts,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { error: "Failed to fetch posts" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}