import { pool } from "../config/db.js";

export const createFolder = async (req, res) => {
  const { name, parentId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO folders (name, parent_id, owner_id) VALUES ($1, $2, $3) RETURNING *",
      [name, parentId || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const renameFolder = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;
  try {
    const result = await pool.query(
      "UPDATE folders SET name=$1 WHERE id=$2 AND owner_id=$3 RETURNING *",
      [newName, id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Folder not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFolder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE folders SET is_deleted=TRUE, deleted_at=NOW() WHERE id=$1 AND owner_id=$2 RETURNING *",
      [id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Folder not found" });
    res.json({ message: "Folder moved to trash", folder: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
