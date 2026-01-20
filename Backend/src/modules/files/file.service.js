import { supabase } from "../../config/supabase.js";
import crypto from "crypto";

/**
 * Sanitize filename for storage path
 * Handles Unicode characters and special characters safely
 * Uses Base64 encoding for non-ASCII characters to ensure compatibility
 */
const sanitizeFileName = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Extract extension (preserve it)
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot).toLowerCase() : '';
  
  // Check if filename contains only safe ASCII characters
  const isSafeASCII = /^[a-zA-Z0-9._\s-]+$/.test(name);
  
  let sanitized;
  
  if (isSafeASCII) {
    // Simple sanitization for ASCII-only filenames
    sanitized = name
      .replace(/[<>:"|?*\x00-\x1f]/g, '_')
      .replace(/[/\\]/g, '_')
      .replace(/[\s_]+/g, '_')
      .replace(/^[._]+|[._]+$/g, '') || 'file';
  } else {
    // For filenames with Unicode/special characters, use Base64 encoding
    // This ensures the filename is always safe for storage
    try {
      // Convert to Base64, but make it URL-safe (replace +/= with -_)
      const base64 = Buffer.from(name, 'utf8').toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      sanitized = base64;
    } catch (e) {
      // Fallback: use a hash of the filename
      sanitized = crypto.createHash('md5').update(name).digest('hex').substring(0, 32);
    }
  }
  
  // Limit total length to prevent issues
  const maxNameLength = 200;
  const truncated = sanitized.length > maxNameLength
    ? sanitized.substring(0, maxNameLength)
    : sanitized;
  
  return truncated + ext;
};

/**
 * Upload file to Supabase Storage + save metadata
 */
export const uploadFile = async (userId, folderId, file) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  // ✅ FORCE CORRECT MIME TYPE (CRITICAL FOR PDF PREVIEW)
  const detectedMime =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : file.mimetype;

  // Sanitize filename for storage path (keep original for display)
  const sanitizedFileName = sanitizeFileName(file.originalname);
  const filePath = `${userId}/${folderId ?? "root"}/${Date.now()}_${sanitizedFileName}`;

  // 1️⃣ Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("files")
    .upload(filePath, file.buffer, {
      contentType: detectedMime,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // 2️⃣ Save metadata in database
  // Try with is_deleted, fallback without it if column doesn't exist
  let insertData = {
    name: file.originalname,
    path: filePath,
    size: file.size,
    mime_type: detectedMime,
    user_id: userId,
    folder_id: folderId ?? null,
  };
  
  // Try to include is_deleted, but handle if column doesn't exist
  try {
    insertData.is_deleted = false;
  } catch (e) {
    // Column doesn't exist, continue without it
  }

  const { data, error } = await supabase
    .from("files")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Handle RLS (Row Level Security) errors with helpful message
    if (error.message && error.message.includes("row-level security")) {
      console.error("❌ RLS Error - Service role key may not be configured correctly");
      console.error("Check Backend/.env file - SUPABASE_SERVICE_ROLE_KEY must be the service_role key (not anon key)");
      console.error("See Backend/RLS_FIX_INSTRUCTIONS.md for help");
      throw new Error("Database permission error. Please check that SUPABASE_SERVICE_ROLE_KEY is set correctly in Backend/.env file. See Backend/RLS_FIX_INSTRUCTIONS.md for help.");
    }
    
    // If error is about is_deleted column, retry without it
    if (error.message && error.message.includes("is_deleted")) {
      console.warn("⚠️ is_deleted column not found. Retrying without it. Please add the column using the SQL in QUICK_FIX.sql");
      const { data: retryData, error: retryError } = await supabase
        .from("files")
        .insert({
          name: file.originalname,
          path: filePath,
          size: file.size,
          mime_type: detectedMime,
          user_id: userId,
          folder_id: folderId ?? null,
        })
        .select()
        .single();
      
      if (retryError) {
        // Check for RLS error in retry too
        if (retryError.message && retryError.message.includes("row-level security")) {
          throw new Error("Database permission error. Please check that SUPABASE_SERVICE_ROLE_KEY is set correctly in Backend/.env file. See Backend/RLS_FIX_INSTRUCTIONS.md for help.");
        }
        throw new Error(retryError.message);
      }
      return retryData;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * List files in a folder
 */
export const listFiles = async (userId, folderId, starredOnly = false) => {
  let query = supabase
    .from("files")
    .select("*")
    .eq("user_id", userId);

  // Try to filter by is_deleted, but handle if column doesn't exist
  query = query.eq("is_deleted", false);

  if (folderId) {
    query = query.eq("folder_id", folderId);
  } else {
    query = query.is("folder_id", null);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    // If error is about is_deleted column, retry without it
    if (error.message && error.message.includes("is_deleted")) {
      console.warn("⚠️ is_deleted column not found. Retrying without filter. Please add the column using the SQL in QUICK_FIX.sql");
      
      let retryQuery = supabase
        .from("files")
        .select("*")
        .eq("user_id", userId);
      
      if (folderId) {
        retryQuery = retryQuery.eq("folder_id", folderId);
      } else {
        retryQuery = retryQuery.is("folder_id", null);
      }
      
      const { data: retryData, error: retryError } = await retryQuery.order("created_at", {
        ascending: false,
      });
      
      if (retryError) {
        throw new Error(retryError.message);
      }
      return retryData;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Generate signed download URL
 */
export const getSignedUrl = async (userId, fileId) => {
  let query = supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .single();

  let { data: file, error } = await query;

  if (error) {
    // If error is about is_deleted column, retry without it
    if (error.message && error.message.includes("is_deleted")) {
      console.warn("⚠️ is_deleted column not found. Retrying without filter.");
      const retryQuery = supabase
        .from("files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", userId)
        .single();
      
      const retryResult = await retryQuery;
      if (retryResult.error || !retryResult.data) {
        throw new Error("Not found");
      }
      file = retryResult.data;
    } else if (!file) {
      throw new Error("Not found");
    } else {
      throw new Error(error.message);
    }
  }

  if (!file) {
    throw new Error("Not found");
  }

  // Check if file path exists
  if (!file.path) {
    console.error("❌ File record found but path is missing:", file);
    throw new Error("File path not found in database");
  }

  // Try to create signed URL
  const { data, error: urlError } = await supabase.storage
    .from("files")
    .createSignedUrl(file.path, 60); // 60 seconds

  if (urlError) {
    console.error("❌ Error creating signed URL:", {
      error: urlError.message,
      errorCode: urlError.statusCode,
      fileId: fileId,
      filePath: file.path,
      userId: userId,
      fileName: file.name
    });
    
    // Handle specific Supabase Storage errors
    if (urlError.message && urlError.message.includes("Object not found")) {
      // Try to check if the file exists by listing the directory
      const pathParts = file.path.split('/');
      const fileName = pathParts.pop();
      const directoryPath = pathParts.join('/');
      
      if (directoryPath) {
        const { data: fileList, error: listError } = await supabase.storage
          .from("files")
          .list(directoryPath, {
            limit: 1000
          });

        if (!listError && fileList) {
          const foundFile = fileList.find(f => f.name === fileName);
          if (!foundFile) {
            throw new Error(`File "${file.name}" not found in storage. The file may have been deleted or the path is incorrect.`);
          }
        }
      }
      
      throw new Error(`File "${file.name}" not found in storage. Please contact support if this file should exist.`);
    }
    
    // Generic error
    throw new Error(`Failed to generate download URL: ${urlError.message}`);
  }

  if (!data || !data.signedUrl) {
    throw new Error("Failed to generate download URL");
  }

  return { url: data.signedUrl, file };
};

/**
 * Soft delete file
 */
export const softDeleteFile = async (userId, fileId) => {
  // Try soft delete first
  const { data, error } = await supabase
    .from("files")
    .update({ is_deleted: true })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // If error is about missing column, use hard delete instead
    if (error.message && error.message.includes("is_deleted")) {
      console.warn("⚠️ is_deleted column not found, using hard delete instead. Please add the column using the SQL in QUICK_FIX.sql");
      const { data: deletedData, error: deleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId)
        .eq("user_id", userId)
        .select()
        .single();
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      return deletedData;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Rename file
 */
export const renameFile = async (userId, fileId, newName) => {
  if (!newName || newName.trim() === '') {
    throw new Error("Name required");
  }

  const { data, error } = await supabase
    .from("files")
    .update({ name: newName.trim() })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Not found");
  }

  return data;
};

/**
 * Move file to different folder
 */
export const moveFile = async (userId, fileId, newFolderId) => {
  // Prevent moving to same folder
  const { data: currentFile } = await supabase
    .from("files")
    .select("folder_id")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (!currentFile) {
    throw new Error("Not found");
  }

  if (currentFile.folder_id === newFolderId) {
    throw new Error("File is already in this folder");
  }

  const { data, error } = await supabase
    .from("files")
    .update({ folder_id: newFolderId || null })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Not found");
  }

  return data;
};

/**
 * Toggle star status for a file
 */
export const toggleStarFile = async (userId, fileId) => {
  // First, check if file exists and is not deleted
  let query = supabase
    .from("files")
    .select("id, is_starred")
    .eq("id", fileId)
    .eq("user_id", userId);

  // Try to filter by is_deleted, but handle if column doesn't exist
  try {
    query = query.eq("is_deleted", false);
  } catch (e) {
    // Column doesn't exist, continue without filter
  }

  const { data: currentFile, error: fetchError } = await query.single();

  if (fetchError) {
    // If error is about is_starred column, try without it first
    if (fetchError.message && fetchError.message.includes("is_starred")) {
      // Retry query without is_starred to check if file exists
      let retryQuery = supabase
        .from("files")
        .select("id")
        .eq("id", fileId)
        .eq("user_id", userId);
      
      try {
        retryQuery = retryQuery.eq("is_deleted", false);
      } catch (e) {
        // Column doesn't exist, continue
      }
      
      const { data: retryFile, error: retryError } = await retryQuery.single();
      
      if (retryError || !retryFile) {
        throw new Error("File not found");
      }
      
      // File exists but is_starred column doesn't exist
      throw new Error("Star functionality not available. Please add is_starred column to files table. See Backend/migrations/004_add_starred_column.sql");
    }
    
    if (fetchError.code === 'PGRST116') {
      throw new Error("File not found");
    }
    
    throw new Error("File not found");
  }

  if (!currentFile) {
    throw new Error("File not found");
  }

  // Toggle the starred status
  const newStarredStatus = !(currentFile.is_starred || false);

  // Update the file
  let updateQuery = supabase
    .from("files")
    .update({ is_starred: newStarredStatus })
    .eq("id", fileId)
    .eq("user_id", userId);

  const { data, error } = await updateQuery.select().single();

  if (error) {
    // If error is about missing column, handle gracefully
    if (error.message && error.message.includes("is_starred")) {
      throw new Error("Star functionality not available. Please add is_starred column to files table. See Backend/migrations/004_add_starred_column.sql");
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("File not found");
  }

  return data;
};

/**
 * Copy file (duplicate)
 */
export const copyFile = async (userId, fileId, targetFolderId = null) => {
  // Get original file
  const { data: originalFile, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !originalFile) {
    throw new Error("Not found");
  }

  // Download the original file from storage
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("files")
    .createSignedUrl(originalFile.path, 60);

  if (urlError || !signedUrlData) {
    throw new Error("Failed to access original file");
  }

  // Fetch the file content
  const fileResponse = await fetch(signedUrlData.signedUrl);
  if (!fileResponse.ok) {
    throw new Error("Failed to download original file");
  }

  const fileBlob = await fileResponse.blob();
  const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());

  // Create new path for the copy
  const timestamp = Date.now();
  const nameWithoutExt = originalFile.name.replace(/\.[^/.]+$/, "");
  const extension = originalFile.name.split('.').pop();
  const newFileName = `${nameWithoutExt} (copy).${extension}`;
  // Sanitize the new filename for storage path
  const sanitizedNewFileName = sanitizeFileName(newFileName);
  const newPath = `${userId}/${targetFolderId ?? "root"}/${timestamp}_${sanitizedNewFileName}`;

  // Upload the copy to storage
  const { error: uploadError } = await supabase.storage
    .from("files")
    .upload(newPath, fileBuffer, {
      contentType: originalFile.mime_type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Create database record for the copy
  let insertData = {
    name: newFileName,
    path: newPath,
    size: originalFile.size,
    mime_type: originalFile.mime_type,
    user_id: userId,
    folder_id: targetFolderId ?? null,
  };

  // Try to include is_deleted
  try {
    insertData.is_deleted = false;
  } catch (e) {
    // Column doesn't exist, continue without it
  }

  const { data: newFile, error: insertError } = await supabase
    .from("files")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    // If error is about is_deleted column, retry without it
    if (insertError.message && insertError.message.includes("is_deleted")) {
      const { data: retryData, error: retryError } = await supabase
        .from("files")
        .insert({
          name: newFileName,
          path: newPath,
          size: originalFile.size,
          mime_type: originalFile.mime_type,
          user_id: userId,
          folder_id: targetFolderId ?? null,
        })
        .select()
        .single();

      if (retryError) {
        throw new Error(retryError.message);
      }
      return retryData;
    }
    throw new Error(insertError.message);
  }

  return newFile;
};
