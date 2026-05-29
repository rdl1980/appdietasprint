import { User } from "@supabase/supabase-js";

const defaultAdminUsernames = ["rdladmin"];
const defaultAdminEmails = ["abbonamenti.dileva@gmail.com"];

function splitEnvList(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) {
    return false;
  }

  const adminEmails = [...defaultAdminEmails, ...splitEnvList(process.env.ADMIN_EMAILS)];
  const adminUsernames = [...defaultAdminUsernames, ...splitEnvList(process.env.ADMIN_USERNAMES)];
  const email = user.email?.toLowerCase() || "";
  const username = String(user.app_metadata?.username || "").toLowerCase();
  const role = String(user.app_metadata?.role || "").toLowerCase();

  return role === "admin" || adminEmails.includes(email) || adminUsernames.includes(username);
}
