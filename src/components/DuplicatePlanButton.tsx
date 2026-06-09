"use client";

import { useRouter } from "next/navigation";
import { CopyPlus } from "lucide-react";
import { Button } from "./Button";
import type { UserProfile } from "@/lib/types";

type DuplicatePlanButtonProps = {
  profile: UserProfile;
};

const profileStorageKey = "dietSprintProfile";
const draftProfileStorageKey = "dietSprintDraftProfile";
const legacyProfileStorageKey = "dietaSprintProfile";
const legacyDraftProfileStorageKey = "dietaSprintDraftProfile";

export function DuplicatePlanButton({ profile }: DuplicatePlanButtonProps) {
  const router = useRouter();

  function duplicatePlan() {
    window.localStorage.setItem(draftProfileStorageKey, JSON.stringify(profile));
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    window.localStorage.removeItem(legacyDraftProfileStorageKey);
    window.localStorage.removeItem(legacyProfileStorageKey);
    router.push("/planner?draft=1");
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={duplicatePlan}>
      <CopyPlus size={16} aria-hidden="true" />
      Duplica nel planner
    </Button>
  );
}
