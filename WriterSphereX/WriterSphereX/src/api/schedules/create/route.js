async function handler({
  title,
  description,
  scheduled_date,
  is_private = false,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  if (!scheduled_date) {
    return { error: "Scheduled date is required" };
  }

  try {
    const scheduledDateTime = new Date(scheduled_date);
    if (isNaN(scheduledDateTime.getTime())) {
      return { error: "Invalid scheduled date format" };
    }

    const [newSchedule] = await sql`
      INSERT INTO schedules (user_id, title, description, scheduled_date, is_private, created_at, updated_at)
      VALUES (${session.user.id}, ${title.trim()}, ${
      description || null
    }, ${scheduledDateTime}, ${is_private}, NOW(), NOW())
      RETURNING *
    `;

    const [scheduleWithUser] = await sql`
      SELECT 
        s.*,
        u.name as user_name,
        u.email as user_email
      FROM schedules s
      JOIN auth_users u ON s.user_id = u.id
      WHERE s.id = ${newSchedule.id}
    `;

    return {
      success: true,
      schedule: scheduleWithUser,
    };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { error: "Failed to create schedule" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}