import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eraowuvhbxrljmdoeljd.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYW93dXZoYnhybGptZG9lbGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTY0NzMsImV4cCI6MjA5MzY5MjQ3M30.aCcZT85lft_UL4eivfUQmp2Yk-LAifCLSj59tXfxVBU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
