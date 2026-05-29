import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const defaultEmail = "abbonamenti.dileva@gmail.com";
const defaultUsername = "rdladmin";

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this script.`);
  }

  return value;
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  const rl = createInterface({ input, output });
  const password = await rl.question("Admin password: ");
  rl.close();
  return password;
}

async function findUserByEmail(supabase, email) {
  let page = 1;

  while (page < 100) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());

    if (user || data.users.length < 100) {
      return user || null;
    }

    page += 1;
  }

  throw new Error("User lookup stopped after 100 pages.");
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const email = process.env.ADMIN_EMAIL || defaultEmail;
  const username = process.env.ADMIN_USERNAME || defaultUsername;
  const password = await readPassword();

  if (password.length < 8) {
    throw new Error("Admin password must be at least 8 characters.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existingUser = await findUserByEmail(supabase, email);
  const appMetadata = {
    ...(existingUser?.app_metadata || {}),
    role: "admin",
    username,
  };

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      app_metadata: appMetadata,
    });

    if (error) {
      throw error;
    }

    console.log(`Updated admin user ${data.user.email} (${data.user.id}).`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });

  if (error) {
    throw error;
  }

  console.log(`Created admin user ${data.user.email} (${data.user.id}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
