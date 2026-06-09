import { Header } from "@/components/Header";
import { getPlanTier } from "@/lib/entitlements";
import { getAuthenticatedUser } from "@/lib/supabase/data";
import { ResultsClient } from "./results-client";

export default async function ResultsPage() {
  const user = await getAuthenticatedUser();
  const planTier = getPlanTier(user);

  return (
    <>
      <Header />
      <ResultsClient planTier={planTier} />
    </>
  );
}
