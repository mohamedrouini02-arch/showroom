import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qtgvmqdvghvijfbacnza.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Z3ZtcWR2Z2h2aWpmYmFjbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTc1NjIsImV4cCI6MjA3NTQzMzU2Mn0.fM3nJs1L3ZnaRV2YRDNPDraGPsrgfQ2jEeIyUBtMR3Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
