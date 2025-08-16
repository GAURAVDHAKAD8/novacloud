import { supabase } from "../config/supabase.js";
import { pool } from "../config/db.js";

// ✅ Upload file already done above

// ✅ Generate signed URL for download/preview
export const getSignedUrl = async (storagePath) => {
  const { data, error } = await supabase.storage
    .from("drive")
    .createSignedUrl(storagePath, 60 * 60); // valid 1 hour

  if (error) throw new Error(error.message);
  return data.signedUrl;
};

// ✅ Rename file in DB
export const renameFileInDB = async (fileId, userId, newName) => {
  const result = await pool.query(
    "UPDATE files SET name=$1 WHERE id=$2 AND owner_id=$3 RETURNING *",
    [newName, fileId, userId]
  );
  return result.rows[0];
};

// ✅ Soft delete (move to trash)
export const softDeleteFile = async (fileId, userId) => {
  const result = await pool.query(
    "UPDATE files SET is_deleted=TRUE, deleted_at=NOW() WHERE id=$1 AND owner_id=$2 RETURNING *",
    [fileId, userId]
  );
  return result.rows[0];
};

// ✅ Restore from trash
export const restoreFile = async (fileId, userId) => {
  const result = await pool.query(
    "UPDATE files SET is_deleted=FALSE, deleted_at=NULL WHERE id=$1 AND owner_id=$2 RETURNING *",
    [fileId, userId]
  );
  return result.rows[0];
};

// ✅ Permanent delete
export const permanentlyDeleteFile = async (fileId, userId) => {
  const result = await pool.query(
    "DELETE FROM files WHERE id=$1 AND owner_id=$2 RETURNING *",
    [fileId, userId]
  );
  return result.rows[0];
};
