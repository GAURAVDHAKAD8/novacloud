import express from "express";
import { supabase } from "../config/supabaseClient.js";
import crypto from "crypto";

const router = express.Router();

// Generate a share link
router.post("/share", async (req, res) => {
  try {
    const { filePath, permission, expiresInHours } = req.body;

    // Generate unique token
    const token = crypto.randomBytes(16).toString("hex");

    // Calculate expiry
    const expires_at = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    // Insert into shares table
    const { error } = await supabase
      .from("shares")
      .insert([{ file_path: filePath, token, permission, expires_at }]);

    if (error) throw error;

    const shareLink = `http://localhost:5000/share/${token}`;

    res.json({ shareLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Access shared file
router.get("/share/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Lookup token in shares table
    const { data, error } = await supabase
      .from("shares")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Invalid or expired link" });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(403).json({ error: "Link expired" });
    }

    // Generate public download URL
    const { data: fileData, error: fileError } = supabase.storage
      .from("novadrive")
      .getPublicUrl(data.file_path);

    if (fileError) throw fileError;

    res.json({
      fileUrl: fileData.publicUrl,
      permission: data.permission,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
