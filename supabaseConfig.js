import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://uypbqnmyrstqvlawxqzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cGJxbm15cnN0cXZsYXd4cXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjY3MTIsImV4cCI6MjA4MTE0MjcxMn0.rs8vc1Ayw9F7z3emuecYInIUQ-EFwlpUIiwNbg8uDA0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
