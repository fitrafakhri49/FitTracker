import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xlkshqyhblnuwkqzsnfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3NocXloYmxudXdrcXpzbmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzM1OTEsImV4cCI6MjA4MDkwOTU5MX0.dTxhFOiMzOCYXs2AJucmm1XVIUHNymg1YXnqNVs43II";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
