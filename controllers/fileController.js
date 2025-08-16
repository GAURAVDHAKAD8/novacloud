import { pool } from "../config/db.js";
import supabase from "../config/supabase.js";
import {
  getSignedUrl,
  renameFileInDB,
  softDeleteFile,
  restoreFile,
  permanentlyDeleteFile,
} from "../services/fileService.js";

// ✅ Upload File
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = `${req.user.id}/${Date.now()}_${file.originalname}`;

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from("novadrive") // your bucket
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw uploadError;

    // Save metadata in Postgres
    const result = await pool.query(
      `INSERT INTO files (name, owner_id, size, mimetype, storage_path) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [file.originalname, req.user.id, file.size, file.mimetype, filePath]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get file details + signed URL
export const getFile = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM files WHERE id=$1 AND owner_id=$2",
      [id, req.user.id]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ error: "File not found" });

    const signedUrl = await getSignedUrl(file.storage_path);
    res.json({ ...file, signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Rename file
export const renameFile = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;
  try {
    const updatedFile = await renameFileInDB(id, req.user.id, newName);
    if (!updatedFile)
      return res.status(404).json({ error: "File not found or not yours" });
    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Move to trash
export const deleteFile = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFile = await softDeleteFile(id, req.user.id);
    if (!deletedFile) return res.status(404).json({ error: "File not found" });
    res.json({ message: "File moved to trash", file: deletedFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Restore from trash
export const restoreFileController = async (req, res) => {
  const { id } = req.params;
  try {
    const restoredFile = await restoreFile(id, req.user.id);
    if (!restoredFile) return res.status(404).json({ error: "File not found" });
    res.json({ message: "File restored", file: restoredFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Permanent delete (DB + Supabase)
export const permanentDeleteFile = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM files WHERE id=$1 AND owner_id=$2",
      [id, req.user.id]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete from Supabase
    await supabase.storage.from("novadrive").remove([file.storage_path]);

    // Delete from Postgres
    await pool.query("DELETE FROM files WHERE id=$1", [id]);

    res.json({ message: "File permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Download file (signed URL)
export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM files WHERE id=$1 AND owner_id=$2",
      [id, req.user.id]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ error: "File not found" });

    const { data, error } = await supabase.storage
      .from("novadrive")
      .createSignedUrl(file.storage_path, 60 * 5);

    if (error) throw error;

    res.json({ url: data.signedUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
