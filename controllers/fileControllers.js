import { uploadFileToStorage } from "../services/fileService.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileData = await uploadFileToStorage(
      req.file,
      req.user.id,
      req.body.folderId || null
    );
    res.status(201).json(fileData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
