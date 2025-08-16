import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", authMiddleware, upload.single("file"), uploadFile);

export default router;
