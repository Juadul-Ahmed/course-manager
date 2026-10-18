import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

console.log("[Supabase env check]", {
  urlLoaded: Boolean(supabaseUrl),
  secretKeyLoaded: Boolean(supabaseSecretKey),
});

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Supabase server environment variables are missing.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);