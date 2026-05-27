import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-password-form";

export default async function AccountPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!data.user) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <UpdatePasswordForm />
    </>
  );
}
