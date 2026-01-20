import { supabase } from "../../config/supabase.js";

export const searchByName = async (userId, term) => {
  if (!term || term.trim() === '') {
    return { files: [], folders: [] };
  }

  const searchTerm = term.trim().toLowerCase();

  try {
    // Search folders - try with is_deleted first
    let foldersQuery = supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .ilike("name", `%${searchTerm}%`);

    let { data: folders, error: foldersError } = await foldersQuery;

    if (foldersError) {
      console.error("Error searching folders (with is_deleted):", foldersError);
      // If is_deleted column doesn't exist or causes error, retry without it
      const retryQuery = supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .ilike("name", `%${searchTerm}%`);
      
      const { data: retryFolders, error: retryError } = await retryQuery;
      
      if (retryError) {
        console.error("Error searching folders (without is_deleted):", retryError);
        folders = [];
      } else {
        folders = retryFolders || [];
      }
    }

    // Search files - try with is_deleted first
    let filesQuery = supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .ilike("name", `%${searchTerm}%`);

    let { data: files, error: filesError } = await filesQuery;

    if (filesError) {
      console.error("Error searching files (with is_deleted):", filesError);
      // If is_deleted column doesn't exist or causes error, retry without it
      const retryQuery = supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .ilike("name", `%${searchTerm}%`);
      
      const { data: retryFiles, error: retryError } = await retryQuery;
      
      if (retryError) {
        console.error("Error searching files (without is_deleted):", retryError);
        files = [];
      } else {
        files = retryFiles || [];
      }
    }

    console.log("Search term:", searchTerm);
    console.log("User ID:", userId);
    console.log("Files found:", files?.length || 0);
    console.log("Folders found:", folders?.length || 0);
    
    // Log first few results for debugging
    if (files && files.length > 0) {
      console.log("Sample files:", files.slice(0, 3).map(f => ({ id: f.id, name: f.name })));
    }
    if (folders && folders.length > 0) {
      console.log("Sample folders:", folders.slice(0, 3).map(f => ({ id: f.id, name: f.name })));
    }

    return {
      files: files || [],
      folders: folders || []
    };
  } catch (err) {
    console.error("Search error:", err);
    return { files: [], folders: [] };
  }
};

