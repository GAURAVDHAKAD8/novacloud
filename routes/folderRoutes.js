import express from "express";
import {
  createFolder,
  renameFolder,
  deleteFolder,
} from "../controllers/folderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createFolder);
router.put("/:id", authMiddleware, renameFolder);
router.delete("/:id", authMiddleware, deleteFolder);

export default router;
