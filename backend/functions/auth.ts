import { supabase } from '../config/supabase';

/**
 * Authenticate user and get user ID
 */
export async function authenticateUser(
  accessToken: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) throw error;
    if (!data.user) throw new Error('User not found');

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; session?: any; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      session: data.session,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Sign in failed',
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: any
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Sign up failed',
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Sign out failed',
    };
  }
}
