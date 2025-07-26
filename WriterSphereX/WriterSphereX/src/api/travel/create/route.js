async function handler({
  destination,
  transport_mode = "driving",
  alert_time,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  if (!destination || destination.trim() === "") {
    return { error: "Destination is required" };
  }

  if (!alert_time) {
    return { error: "Alert time is required" };
  }

  try {
    const alertDateTime = new Date(alert_time);
    if (isNaN(alertDateTime.getTime())) {
      return { error: "Invalid alert time format" };
    }

    const [newAlert] = await sql`
      INSERT INTO travel_alerts (user_id, destination, transport_mode, alert_time, is_active, created_at)
      VALUES (${
        session.user.id
      }, ${destination.trim()}, ${transport_mode}, ${alertDateTime}, ${true}, NOW())
      RETURNING *
    `;

    const [alertWithUser] = await sql`
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email
      FROM travel_alerts t
      JOIN auth_users u ON t.user_id = u.id
      WHERE t.id = ${newAlert.id}
    `;

    return {
      success: true,
      alert: alertWithUser,
    };
  } catch (error) {
    console.error("Error creating travel alert:", error);
    return { error: "Failed to create travel alert" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}