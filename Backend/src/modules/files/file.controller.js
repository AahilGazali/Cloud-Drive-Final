import {
  listFiles,
  getSignedUrl,
  softDeleteFile,
  uploadFile,
  renameFile,
  moveFile,
  copyFile,
  toggleStarFile,
} from "./file.service.js";
import { success, fail } from "../../utils/response.js";

/**
 * UPLOAD FILE
 */
export const upload = async (req, res, next) => {
  try {
    const folderId = req.body.folderId || null; // UUID or null
    const file = req.file;

    if (!file) {
      return fail(res, "No file uploaded", 400);
    }

    const uploaded = await uploadFile(req.user.id, folderId, file);
    return success(res, { file: uploaded }, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * LIST FILES IN FOLDER
 */
export const list = async (req, res, next) => {
  try {
    const folderId = req.query.folderId || null; // UUID or null
    const files = await listFiles(req.user.id, folderId);
    return success(res, { files });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET DOWNLOAD LINK
 */
export const downloadLink = async (req, res, next) => {
  try {
    const fileId = req.params.id; // UUID

    const { url, file } = await getSignedUrl(req.user.id, fileId);
    return success(res, { url, file });
  } catch (err) {
    console.error("Download error:", err.message);
    if (err.message === "Forbidden") return fail(res, err.message, 403);
    if (err.message === "Not found" || err.message.includes("not found")) {
      return fail(res, err.message || "File not found", 404);
    }
    // Return more specific error messages
    return fail(res, err.message || "Failed to generate download URL", 500);
  }
};

/**
 * SOFT DELETE FILE
 */
export const remove = async (req, res, next) => {
  try {
    const fileId = req.params.id; // UUID
    const deleted = await softDeleteFile(req.user.id, fileId);
    return success(res, { file: deleted });
  } catch (err) {
    return next(err);
  }
};

/**
 * RENAME FILE
 */
export const rename = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return fail(res, "Name is required", 400);
    }

    const renamed = await renameFile(req.user.id, fileId, name);
    return success(res, { file: renamed });
  } catch (err) {
    if (err.message === "Not found") return fail(res, err.message, 404);
    return next(err);
  }
};

/**
 * MOVE FILE
 */
export const move = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const { folderId } = req.body; // null for root folder

    const moved = await moveFile(req.user.id, fileId, folderId || null);
    return success(res, { file: moved });
  } catch (err) {
    if (err.message === "Not found") return fail(res, err.message, 404);
    if (err.message.includes("already in")) return fail(res, err.message, 400);
    return next(err);
  }
};

/**
 * TOGGLE STAR FILE
 */
export const toggleStar = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const starred = await toggleStarFile(req.user.id, fileId);
    return success(res, { file: starred });
  } catch (err) {
    if (err.message === "Not found" || err.message.includes("not found")) {
      return fail(res, err.message, 404);
    }
    return next(err);
  }
};

/**
 * COPY FILE
 */
export const copy = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const { folderId } = req.body; // null for root folder

    const copied = await copyFile(req.user.id, fileId, folderId || null);
    return success(res, { file: copied }, 201);
  } catch (err) {
    if (err.message === "Not found") return fail(res, err.message, 404);
    return next(err);
  }
};
