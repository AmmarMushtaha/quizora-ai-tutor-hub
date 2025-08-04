import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://lgndwpkbhtoylgphhhzu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbmR3cGtiaHRveWxncGhoaHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDU4MTYsImV4cCI6MjA2NzcyMTgxNn0.YP0ImWGr_uEWQwgnguUN7kuIW6_JWdT07xTIft7jNcE";

// Enhanced Supabase client with retry logic
export const supabaseWithRetry = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (url, options = {}) => {
      const maxRetries = 3;
      const retryDelay = 1000;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            return response;
          }
          
          // If it's a server error and not the last attempt, retry
          if (response.status >= 500 && attempt < maxRetries) {
            console.warn(`Request failed with status ${response.status}, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
          
          return response;
        } catch (error) {
          if (attempt === maxRetries) {
            console.error('Max retries reached, request failed:', error);
            throw error;
          }
          
          console.warn(`Request attempt ${attempt} failed, retrying in ${retryDelay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
      
      throw new Error('All retry attempts failed');
    }
  }
});

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