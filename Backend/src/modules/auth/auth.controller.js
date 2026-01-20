import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase.js";
import { env } from "../../config/env.js";

/**
 * SIGN UP
 */
export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : {},
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(201).json({
    message: "User created successfully",
    userId: data.user.id,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: name || data.user.email.split('@')[0],
    },
  });
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Set token expiration based on rememberMe: 30 days if true, 7 days if false
  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  const token = jwt.sign(
    {
      id: data.user.id,
      email: data.user.email,
      role: "user",
    },
    env.JWT_SECRET,
    { expiresIn }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: maxAge,
  });

  return res.json({ 
    message: "Login successful",
    token: token,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email.split('@')[0],
    }
  });
};

/**
 * SIGN OUT
 */
export const signout = async (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Sign out successful' });
};

/**
 * CURRENT USER
 */
export const me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Fetch user from Supabase Auth to get metadata (name)
    const { data: userData, error } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (error || !userData) {
      // Fallback to JWT data if Supabase fetch fails
      return res.json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: req.user.role,
        passwordChangedAt: null,
      });
    }

    return res.json({
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.user_metadata?.name || userData.user.email.split('@')[0],
      role: req.user.role,
      passwordChangedAt: userData.user.user_metadata?.password_changed_at || null,
    });
  } catch (error) {
    // Fallback to JWT data on error
    return res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || req.user.email.split('@')[0],
      role: req.user.role,
      passwordChangedAt: null,
    });
  }
};

/**
 * CHANGE EMAIL
 */
export const changeEmail = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { newEmail, password } = req.body;

  if (!newEmail || !password) {
    return res.status(400).json({ message: "New email and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // First, get the actual user email from Supabase (in case email was changed)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (userError || !userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const actualEmail = userData.user.email;

    // Verify the current password by attempting to sign in with the actual email
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: actualEmail,
      password: password,
    });

    if (signInError || !signInData) {
      console.error("Password verification error:", signInError?.message);
      return res.status(401).json({ message: "Invalid password" });
    }

    // Update the email using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, {
      email: newEmail,
      email_confirm: true,
    });

    if (error) {
      console.error("Email update error:", error.message);
      if (error.message.includes("already registered")) {
        return res.status(400).json({ message: "This email is already in use" });
      }
      return res.status(400).json({ message: error.message || "Failed to change email" });
    }

    return res.json({
      message: "Email changed successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
      },
    });
  } catch (error) {
    console.error("Change email error:", error);
    return res.status(500).json({ message: "Failed to change email. Please try again." });
  }
};

/**
 * CHANGE PASSWORD
 */
export const changePassword = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long" });
  }

  try {
    // First, get the actual user email from Supabase (in case email was changed)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (userError || !userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const actualEmail = userData.user.email;

    // Verify the current password by attempting to sign in with the actual email
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: actualEmail,
      password: currentPassword,
    });

    if (signInError || !signInData) {
      console.error("Password verification error:", signInError?.message);
      return res.status(401).json({ message: "Invalid current password" });
    }

    // Get current user metadata
    const currentMetadata = userData.user.user_metadata || {};
    
    // Update the password and store the change date in metadata
    const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword,
      user_metadata: {
        ...currentMetadata,
        password_changed_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Password update error:", error.message);
      return res.status(400).json({ message: error.message || "Failed to change password" });
    }

    return res.json({
      message: "Password changed successfully",
      passwordChangedAt: data.user.user_metadata?.password_changed_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password. Please try again." });
  }
};
