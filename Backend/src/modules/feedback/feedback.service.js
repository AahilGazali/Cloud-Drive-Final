/**
 * Feedback Service - Handles feedback operations
 */

import { supabase } from "../../config/supabase.js";

/**
 * Create feedback
 */
export const createFeedback = async (userId, feedbackText, userEmail) => {
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: userId,
      feedback: feedbackText,
      user_email: userEmail,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Provide helpful error message if table doesn't exist
    if (error.message && error.message.includes('does not exist') || error.message.includes('schema cache')) {
      throw new Error('Feedback table not found. Please run the migration: Backend/migrations/005_create_feedback_table.sql in Supabase SQL Editor. See Backend/FEEDBACK_SETUP.md for instructions.');
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get all feedback for a user
 */
export const getUserFeedback = async (userId) => {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get all feedback (admin only)
 */
export const getAllFeedback = async () => {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
