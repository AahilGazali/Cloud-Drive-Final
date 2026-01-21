import { supabase } from "../../config/supabase.js";
import { query } from "../../config/db.js";
import { success, fail } from "../../utils/response.js";

/**
 * CREATE FOLDER
 */
export const createFolder = async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    // Validate parentId if provided
    if (parentId) {
      let parentQuery = supabase
        .from("folders")
        .select("id, user_id")
        .eq("id", parentId)
        .eq("user_id", userId);
      
      // Try to filter by is_deleted, but handle if column doesn't exist
      try {
        parentQuery = parentQuery.eq("is_deleted", false);
      } catch (e) {
        // Column doesn't exist, continue without filter
      }
      
      const { data: parentFolder, error: parentError } = await parentQuery.single();

      if (parentError) {
        // If error is about is_deleted column, retry without it
        if (parentError.message && parentError.message.includes("is_deleted")) {
          const { data: retryParent, error: retryError } = await supabase
            .from("folders")
            .select("id, user_id")
            .eq("id", parentId)
            .eq("user_id", userId)
            .single();
          
          if (retryError || !retryParent) {
            return res.status(400).json({ message: "Parent folder not found or access denied" });
          }
        } else {
          return res.status(400).json({ message: "Parent folder not found or access denied" });
        }
      } else if (!parentFolder) {
        return res.status(400).json({ message: "Parent folder not found or access denied" });
      }
    }

    // Use direct PostgreSQL query to bypass RLS completely - this is CRITICAL
    console.log(`📁 Creating folder for user ${userId} using direct PostgreSQL (bypasses RLS)`);
    
    const insertQuery = `
      INSERT INTO public.folders (name, user_id, parent_id, is_deleted)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const { rows } = await query(insertQuery, [
        name.trim(),
        userId,
        parentId || null,
        false
      ]);
      
      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Failed to create folder" });
      }
      
      console.log(`✅ Folder created successfully: ${rows[0].id}`);
      return res.status(201).json(rows[0]);
    } catch (dbError) {
      console.error(`❌ Database error creating folder:`, dbError.message);
      
      // If is_deleted column doesn't exist, retry without it
      if (dbError.message && dbError.message.includes("is_deleted")) {
        console.warn("⚠️ is_deleted column not found. Retrying without it.");
        const retryQuery = `
          INSERT INTO public.folders (name, user_id, parent_id)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        try {
          const { rows } = await query(retryQuery, [
            name.trim(),
            userId,
            parentId || null
          ]);
          
          if (!rows || rows.length === 0) {
            return res.status(400).json({ message: "Failed to create folder" });
          }
          
          console.log(`✅ Folder created successfully (without is_deleted): ${rows[0].id}`);
          return res.status(201).json(rows[0]);
        } catch (retryError) {
          console.error(`❌ Retry also failed:`, retryError.message);
          return res.status(400).json({ message: retryError.message || "Failed to create folder" });
        }
      }
      
      // If it's an RLS error, provide helpful message
      if (dbError.message && (
        dbError.message.includes("row-level security") ||
        dbError.message.includes("new row violates row-level security") ||
        dbError.message.includes("RLS")
      )) {
        console.error("❌ CRITICAL: RLS error with direct PostgreSQL query!");
        console.error("   Solution: Run FIX_RLS_PERMANENT_SOLUTION.sql in Supabase SQL Editor");
        console.error("   This will fix the issue permanently - no restart needed after running the SQL.");
        return res.status(500).json({ message: "Database permission error. Please run FIX_RLS_PERMANENT_SOLUTION.sql in Supabase SQL Editor. No restart needed after running the SQL." });
      }
      
      return res.status(400).json({ message: dbError.message || "Failed to create folder" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * LIST FOLDERS
 * ?parentId=null → root folders
 */
export const listFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentId = req.query.parentId;

    // Build query step by step
    let query = supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId);

    // Try to filter by is_deleted, but handle if column doesn't exist
    query = query.eq("is_deleted", false);

    // Handle parentId: "null" string means root folders, undefined/null means root, otherwise use the ID
    if (parentId === "null" || parentId === null || parentId === undefined) {
      query = query.is("parent_id", null);
    } else if (parentId) {
      query = query.eq("parent_id", parentId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      // If error is about is_deleted column, retry without it
      if (error.message && error.message.includes("is_deleted")) {
        console.warn("⚠️ is_deleted column not found. Retrying without filter. Please add the column using the SQL in QUICK_FIX.sql");
        
        // Retry query without is_deleted filter
        let retryQuery = supabase
          .from("folders")
          .select("*")
          .eq("user_id", userId);
        
        if (parentId === "null" || parentId === null || parentId === undefined) {
          retryQuery = retryQuery.is("parent_id", null);
        } else if (parentId) {
          retryQuery = retryQuery.eq("parent_id", parentId);
        }
        
        const { data: retryData, error: retryError } = await retryQuery.order("created_at", { ascending: true });
        
        if (retryError) {
          return res.status(400).json({ 
            message: retryError.message,
            hint: "Please add is_deleted column to folders table. See QUICK_FIX.sql"
          });
        }
        return res.json(retryData || []);
      }
      return res.status(400).json({ message: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * RENAME FOLDER
 */
export const renameFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const { name } = req.body;
    const userId = req.user.id;

    if (!folderId) {
      return fail(res, "Folder ID is required", 400);
    }

    if (!name || !name.trim()) {
      return fail(res, "Folder name is required", 400);
    }

    const { data, error } = await supabase
      .from("folders")
      .update({ name: name.trim() })
      .eq("id", folderId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return fail(res, error.message, 400);
    }

    if (!data) {
      return fail(res, "Folder not found", 404);
    }

    return success(res, { folder: data });
  } catch (err) {
    return next(err);
  }
};

/**
 * MOVE FOLDER
 */
export const moveFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const { newParentId } = req.body; // null for root folder
    const userId = req.user.id;

    if (!folderId) {
      return fail(res, "Folder ID is required", 400);
    }

    // Prevent moving folder to itself
    if (folderId === newParentId) {
      return fail(res, "Cannot move folder to itself", 400);
    }

    // Check if folder exists and belongs to user
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id, parent_id")
      .eq("id", folderId)
      .eq("user_id", userId)
      .single();

    if (folderError || !folder) {
      return fail(res, "Folder not found", 404);
    }

    // Prevent circular reference - check if newParentId is a child of folderId
    if (newParentId) {
      let current = newParentId;
      const visited = new Set();
      
      while (current && !visited.has(current)) {
        visited.add(current);
        const { data: parentFolder } = await supabase
          .from("folders")
          .select("id, parent_id")
          .eq("id", current)
          .single();
        
        if (!parentFolder) break;
        
        if (parentFolder.id === folderId) {
          return fail(res, "Cannot move folder into its own subfolder", 400);
        }
        
        current = parentFolder.parent_id;
      }

      // Verify new parent exists and belongs to user
      const { data: newParent, error: parentError } = await supabase
        .from("folders")
        .select("id, user_id")
        .eq("id", newParentId)
        .eq("user_id", userId)
        .single();

      if (parentError || !newParent) {
        return fail(res, "Target folder not found or access denied", 404);
      }
    }

    // Update folder's parent_id
    const { data, error } = await supabase
      .from("folders")
      .update({ parent_id: newParentId || null })
      .eq("id", folderId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return fail(res, error.message, 400);
    }

    if (!data) {
      return fail(res, "Folder not found", 404);
    }

    return success(res, { folder: data });
  } catch (err) {
    return next(err);
  }
};

/**
 * TOGGLE STAR FOLDER
 */
export const toggleStarFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    if (!folderId) {
      return fail(res, "Folder ID is required", 400);
    }

    // First, check if folder exists and is not deleted
    let query = supabase
      .from("folders")
      .select("id, is_starred")
      .eq("id", folderId)
      .eq("user_id", userId);

    // Try to filter by is_deleted, but handle if column doesn't exist
    try {
      query = query.eq("is_deleted", false);
    } catch (e) {
      // Column doesn't exist, continue without filter
    }

    const { data: currentFolder, error: fetchError } = await query.single();

    if (fetchError) {
      // If error is about is_starred column, try without it first
      if (fetchError.message && fetchError.message.includes("is_starred")) {
        // Retry query without is_starred to check if folder exists
        let retryQuery = supabase
          .from("folders")
          .select("id")
          .eq("id", folderId)
          .eq("user_id", userId);
        
        try {
          retryQuery = retryQuery.eq("is_deleted", false);
        } catch (e) {
          // Column doesn't exist, continue
        }
        
        const { data: retryFolder, error: retryError } = await retryQuery.single();
        
        if (retryError || !retryFolder) {
          return fail(res, "Folder not found", 404);
        }
        
        // Folder exists but is_starred column doesn't exist
        return fail(res, "Star functionality not available. Please add is_starred column to folders table. See Backend/migrations/004_add_starred_column.sql", 400);
      }
      
      if (fetchError.code === 'PGRST116') {
        return fail(res, "Folder not found", 404);
      }
      
      return fail(res, "Folder not found", 404);
    }

    if (!currentFolder) {
      return fail(res, "Folder not found", 404);
    }

    // Toggle the starred status
    const newStarredStatus = !(currentFolder.is_starred || false);

    // Update the folder
    let updateQuery = supabase
      .from("folders")
      .update({ is_starred: newStarredStatus })
      .eq("id", folderId)
      .eq("user_id", userId);

    const { data, error } = await updateQuery.select().single();

    if (error) {
      // If error is about missing column, handle gracefully
      if (error.message && error.message.includes("is_starred")) {
        return fail(res, "Star functionality not available. Please add is_starred column to folders table. See Backend/migrations/004_add_starred_column.sql", 400);
      }
      return fail(res, error.message, 400);
    }

    if (!data) {
      return fail(res, "Folder not found", 404);
    }

    return success(res, { folder: data });
  } catch (err) {
    return next(err);
  }
};

/**
 * SOFT DELETE FOLDER (move to trash)
 */
export const deleteFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    if (!folderId) {
      return fail(res, "Folder ID is required", 400);
    }

    // Soft delete by setting is_deleted to true
    // First check if column exists by trying to update
    const { data, error } = await supabase
      .from("folders")
      .update({ is_deleted: true })
      .eq("id", folderId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // If error is about missing column, use hard delete instead
      if (error.message && error.message.includes("is_deleted")) {
        console.warn("is_deleted column not found, using hard delete instead");
        const { data: deletedData, error: deleteError } = await supabase
          .from("folders")
          .delete()
          .eq("id", folderId)
          .eq("user_id", userId)
          .select()
          .single();
        
        if (deleteError) {
          return fail(res, deleteError.message, 400);
        }
        
        if (!deletedData) {
          return fail(res, "Folder not found", 404);
        }
        
        return success(res, { folder: deletedData, message: "Folder permanently deleted (is_deleted column not found)" });
      }
      return fail(res, error.message, 400);
    }

    if (!data) {
      return fail(res, "Folder not found", 404);
    }

    return success(res, { folder: data });
  } catch (err) {
    return next(err);
  }
};