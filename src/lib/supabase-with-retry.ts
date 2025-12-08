import { supabase } from '@/integrations/supabase/client';

// Re-export the main supabase client for backward compatibility
export const supabaseWithRetry = supabase;

// Utility function for database operations with error handling
export async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.warn(`Operation attempt ${attempt} failed, retrying...`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('All attempts failed');
}
