async function handler({ search, upcoming_only = false, limit = 50 }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  try {
    let queryString = `
      SELECT 
        s.*,
        u.name as user_name,
        u.email as user_email
      FROM schedules s
      JOIN auth_users u ON s.user_id = u.id
      WHERE s.user_id = $1
    `;

    const queryValues = [session.user.id];
    let paramCount = 2;

    if (search) {
      queryString += ` AND (
        LOWER(s.title) LIKE LOWER($${paramCount}) 
        OR LOWER(s.description) LIKE LOWER($${paramCount + 1})
      )`;
      queryValues.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    if (upcoming_only) {
      queryString += ` AND s.scheduled_date >= $${paramCount}`;
      queryValues.push(new Date());
      paramCount++;
    }

    queryString += ` ORDER BY s.scheduled_date ASC`;

    if (limit) {
      queryString += ` LIMIT $${paramCount}`;
      queryValues.push(limit);
    }

    const schedules = await sql(queryString, queryValues);

    return {
      success: true,
      schedules: schedules,
      count: schedules.length,
    };
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return { error: "Failed to fetch schedules" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}