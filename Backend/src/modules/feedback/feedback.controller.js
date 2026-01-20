/**
 * Feedback Controller - Handles feedback API requests
 */

import { createFeedback, getUserFeedback, getAllFeedback } from "./feedback.service.js";
import { success, fail } from "../../utils/response.js";
import { query } from "../../config/db.js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

/**
 * CREATE FEEDBACK
 * POST /api/feedback
 */
/**
 * SETUP FEEDBACK TABLE (one-time setup)
 * POST /api/feedback/setup
 */
export const setup = async (req, res, next) => {
  try {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Path from Backend/src/modules/feedback/feedback.controller.js to Backend/migrations/
    // feedback.controller.js -> feedback/ -> modules/ -> src/ -> Backend/ -> migrations/
    const migrationPath = join(__dirname, "../../../migrations/005_create_feedback_table.sql");
    
    console.log("Migration path:", migrationPath);
    
    // Check if file exists
    if (!existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }
    
    const sql = readFileSync(migrationPath, "utf8");
    console.log("SQL loaded, executing migration...");

    // Execute SQL - PostgreSQL pool.query handles multi-statement SQL
    await query(sql);
    console.log("Migration executed successfully");

    return success(res, { message: "Feedback table created successfully" });
  } catch (err) {
    console.error("Feedback setup error:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    return fail(res, err.message || "Failed to setup feedback table", 500);
  }
};

export const create = async (req, res, next) => {
  try {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }

    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return fail(res, "Feedback text is required", 400);
    }

    try {
      const feedbackRecord = await createFeedback(
        req.user.id,
        feedback.trim(),
        req.user.email
      );

      return success(res, { feedback: feedbackRecord }, 201);
    } catch (err) {
      // If table doesn't exist, try to create it automatically
      if (err.message && (err.message.includes("does not exist") || err.message.includes("schema cache"))) {
        try {
          // Try to setup the table
          const __filename2 = fileURLToPath(import.meta.url);
          const __dirname2 = dirname(__filename2);
          // Path from Backend/src/modules/feedback/feedback.controller.js to Backend/migrations/
          const migrationPath2 = join(__dirname2, "../../../migrations/005_create_feedback_table.sql");
          const sql2 = readFileSync(migrationPath2, "utf8");
          
          // Execute SQL - PostgreSQL pool.query handles multi-statement SQL
          await query(sql2);
          
          // Retry creating feedback
          const feedbackRecord = await createFeedback(
            req.user.id,
            feedback.trim(),
            req.user.email
          );
          return success(res, { feedback: feedbackRecord }, 201);
        } catch (setupErr) {
          console.error("Auto-setup failed:", setupErr);
          return fail(res, "Feedback table not found. Please run the migration SQL in Supabase SQL Editor. See Backend/FEEDBACK_SETUP.md for instructions.", 500);
        }
      }
      throw err;
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * GET USER FEEDBACK
 * GET /api/feedback
 */
export const list = async (req, res, next) => {
  try {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }

    const feedbackList = await getUserFeedback(req.user.id);
    return success(res, { feedback: feedbackList });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET ALL FEEDBACK (Admin only - for future use)
 * GET /api/feedback/all
 */
export const listAll = async (req, res, next) => {
  try {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }

    // Check if user is admin (you can add role check here)
    // For now, allow all authenticated users to see all feedback
    const feedbackList = await getAllFeedback();
    return success(res, { feedback: feedbackList });
  } catch (err) {
    return next(err);
  }
};
