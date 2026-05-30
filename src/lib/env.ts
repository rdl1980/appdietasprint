export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ciao@dietsprintai.com",
  legalController: process.env.NEXT_PUBLIC_LEGAL_CONTROLLER || "Titolare da definire",
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "Indirizzo sede da definire",
  legalVat: process.env.NEXT_PUBLIC_LEGAL_VAT || "P.IVA / codice fiscale da definire",
  dpoEmail: process.env.NEXT_PUBLIC_DPO_EMAIL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
