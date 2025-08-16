import { supabase } from "../config/supabase.js";
import { pool } from "../config/db.js";

export const uploadFileToStorage = async (file, userId, folderId = null) => {
  const filePath = `${userId}/${Date.now()}-${file.originalname}`;

  // Upload file to Supabase Storage bucket "drive"
  const { error: uploadError } = await supabase.storage
    .from("drive")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) throw new Error(uploadError.message);

  // Save metadata to Postgres
  const result = await pool.query(
    `INSERT INTO files (name, folder_id, owner_id, size, mime_type, storage_path) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [file.originalname, folderId, userId, file.size, file.mimetype, filePath]
  );

  return result.rows[0];
};
