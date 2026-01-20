import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createFolder,
  listFolders,
  deleteFolder,
  renameFolder,
  moveFolder,
  toggleStarFolder,
} from "./folder.controller.js";

const router = Router();

/**
 * CREATE folder
 * POST /api/folders
 * Body:
 *  - name (string)
 *  - parentId (uuid | optional)
 */
router.post("/", authenticate, createFolder);

/**
 * LIST folders
 * GET /api/folders
 * Query:
 *  - parentId (uuid | optional)
 */
router.get("/", authenticate, listFolders);

/**
 * RENAME folder
 * PATCH /api/folders/:id/rename
 * Body: { name: string }
 */
router.patch("/:id/rename", authenticate, renameFolder);

/**
 * MOVE folder
 * PATCH /api/folders/:id/move
 * Body: { newParentId: uuid | null }
 */
router.patch("/:id/move", authenticate, moveFolder);

/**
 * TOGGLE STAR folder
 * PATCH /api/folders/:id/star
 */
router.patch("/:id/star", authenticate, toggleStarFolder);

/**
 * DELETE folder (soft delete - move to trash)
 * DELETE /api/folders/:id
 */
router.delete("/:id", authenticate, deleteFolder);

export default router;
