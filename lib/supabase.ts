
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access environment variables without crashing the browser
const safeGetEnv = (key: string): string | undefined => {
  try {
    return (window as any).process?.env?.[key] || (globalThis as any).process?.env?.[key];
  } catch {
    return undefined;
  }
};

const supabaseUrl = safeGetEnv('SUPABASE_URL') || 'https://suyeetfefzjjfygqfppr.supabase.co';
const supabaseAnonKey = safeGetEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1eWVldGZlZnpqamZ5Z3FmcHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjk5NjAsImV4cCI6MjA4MzEwNTk2MH0.K3bsfF-z2CwZZLPhEXhvWyKgZeHBJ2ZpwVJ5v1GfyCE';

const isValidConfig = (url: string | undefined, key: string | undefined): boolean => {
  const check = (val: string | undefined) => 
    !!val && typeof val === 'string' && val.trim().length > 0 && val !== 'undefined' && val !== 'null';
  
  return check(url) && check(key);
};

export const supabase: SupabaseClient | null = isValidConfig(supabaseUrl, supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase configuration is missing. The app will run in read-only or limited mode.");
}
