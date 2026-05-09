import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://azlfvinhyzzgybykzcgj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bGZ2aW5oeXp6Z3lieWt6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzY5MDEsImV4cCI6MjA5MTYxMjkwMX0.BWduMfLcVVr_yLJBbtAS4QCRylA4AFrxvvupSeREOy4";

const adminSessionStorage = {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: (key) => sessionStorage.removeItem(key),
};

export const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "ivy_admin_auth",
    storage: adminSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
