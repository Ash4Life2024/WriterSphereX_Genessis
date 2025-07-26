async function handler({ gender, accent, style }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  const validGenders = ["male", "female"];
  const validAccents = ["american", "british", "australian", "canadian"];
  const validStyles = ["normal", "casual", "professional", "energetic"];

  if (gender && !validGenders.includes(gender)) {
    return { error: "Invalid gender. Must be 'male' or 'female'" };
  }

  if (accent && !validAccents.includes(accent)) {
    return {
      error:
        "Invalid accent. Must be 'american', 'british', 'australian', or 'canadian'",
    };
  }

  if (style && !validStyles.includes(style)) {
    return {
      error:
        "Invalid style. Must be 'normal', 'casual', 'professional', or 'energetic'",
    };
  }

  try {
    const existingSettings = await sql`
      SELECT * FROM voice_settings WHERE user_id = ${session.user.id}
    `;

    let savedSettings;

    if (existingSettings.length > 0) {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (gender !== undefined) {
        updateFields.push(`gender = $${paramCount}`);
        updateValues.push(gender);
        paramCount++;
      }

      if (accent !== undefined) {
        updateFields.push(`accent = $${paramCount}`);
        updateValues.push(accent);
        paramCount++;
      }

      if (style !== undefined) {
        updateFields.push(`style = $${paramCount}`);
        updateValues.push(style);
        paramCount++;
      }

      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());
      paramCount++;

      updateValues.push(session.user.id);

      const updateQuery = `
        UPDATE voice_settings 
        SET ${updateFields.join(", ")}
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const [updatedSettings] = await sql(updateQuery, updateValues);
      savedSettings = updatedSettings;
    } else {
      const [newSettings] = await sql`
        INSERT INTO voice_settings (user_id, gender, accent, style, created_at, updated_at)
        VALUES (
          ${session.user.id}, 
          ${gender || "female"}, 
          ${accent || "american"}, 
          ${style || "normal"}, 
          NOW(), 
          NOW()
        )
        RETURNING *
      `;
      savedSettings = newSettings;
    }

    return {
      success: true,
      settings: savedSettings,
    };
  } catch (error) {
    console.error("Error saving voice settings:", error);
    return { error: "Failed to save voice settings" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}