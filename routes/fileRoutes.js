import express from "express";
import multer from "multer";
import {
  uploadFile,
  getFile,
  renameFile,
  deleteFile,
  restoreFileController,
  permanentDeleteFile,
  downloadFile,
} from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload new file
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);

// Get file + signed URL
router.get("/:id", authMiddleware, getFile);

// Rename file
router.put("/:id", authMiddleware, renameFile);

// Move to trashQ
router.delete("/:id", authMiddleware, deleteFile);

// Restore from trash
router.put("/restore/:id", authMiddleware, restoreFileController);

// Permanent delete
router.delete("/permanent/:id", authMiddleware, permanentDeleteFile);

// Download file
router.get("/:id/download", authMiddleware, downloadFile);

export default router;
