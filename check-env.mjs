import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

console.log({
  supabaseUrlLoaded: Boolean(process.env.SUPABASE_URL),
  supabaseSecretKeyLoaded: Boolean(process.env.SUPABASE_SECRET_KEY),
});