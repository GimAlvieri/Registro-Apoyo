const requiredConfig = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);

if (missingConfig.length) {
  throw new Error(`Falta configurar en .env: ${missingConfig.join(", ")}`);
}

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  throw new Error("SUPABASE_URL debe ser la URL HTTPS del proyecto de Supabase.");
}

if (anonKey.startsWith("sb_secret_")) {
  throw new Error("SUPABASE_ANON_KEY debe ser una clave anon/public, nunca una clave secreta.");
}

const tokenPayload = anonKey.split(".")[1];
if (tokenPayload) {
  let tokenRole;
  try {
    tokenRole = JSON.parse(Buffer.from(tokenPayload, "base64url").toString("utf8")).role;
  } catch {
    throw new Error("SUPABASE_ANON_KEY no tiene un formato válido.");
  }
  if (tokenRole === "service_role") {
    throw new Error("SUPABASE_ANON_KEY debe ser una clave anon/public, nunca una clave service_role.");
  }
}

module.exports = Object.freeze({ url, anonKey });
