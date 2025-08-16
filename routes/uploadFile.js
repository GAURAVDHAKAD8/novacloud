import express from "express";
import multer from "multer";
import { supabase } from "../supabaseClient.js";
import path from "path";

const router = express.Router();

// Multer setup (stores file temporarily before upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // unique file path
    const filePath = `${Date.now()}-${file.originalname}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("novadrive") // ✅ use your bucket name
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("novadrive")
      .getPublicUrl(filePath);

    res.json({
      message: "File uploaded successfully",
      filePath,
      publicUrl: publicData.publicUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
