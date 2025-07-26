async function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  try {
    const settings = await sql`
      SELECT * FROM voice_settings WHERE user_id = ${session.user.id}
    `;

    if (settings.length > 0) {
      return {
        success: true,
        settings: settings[0],
      };
    } else {
      return {
        success: true,
        settings: {
          gender: "female",
          accent: "american",
          style: "normal",
        },
      };
    }
  } catch (error) {
    console.error("Error fetching voice settings:", error);
    return { error: "Failed to fetch voice settings" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}