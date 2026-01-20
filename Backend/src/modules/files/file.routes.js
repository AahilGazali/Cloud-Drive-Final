// modules/files/file.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  upload,
  list,
  downloadLink,
  remove,
  rename,
  move,
  copy,
  toggleStar,
} from "./file.controller.js";

const router = Router();
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// 🔴 THIS LINE ENABLES POST /api/files
router.post("/", uploadMiddleware.single("file"), upload);

// GET /api/files
router.get("/", list);

// GET /api/files/:id/signed-url
router.get("/:id/signed-url", downloadLink);

// DELETE /api/files/:id
router.delete("/:id", remove);

// PATCH /api/files/:id/rename
router.patch("/:id/rename", rename);

// PATCH /api/files/:id/move
router.patch("/:id/move", move);

// POST /api/files/:id/copy
router.post("/:id/copy", copy);

// PATCH /api/files/:id/star
router.patch("/:id/star", authenticate, toggleStar);

export default router;
