"use client";

import { useRouter } from "next/navigation";
import { CopyPlus } from "lucide-react";
import { Button } from "./Button";
import type { UserProfile } from "@/lib/types";

type DuplicatePlanButtonProps = {
  profile: UserProfile;
};

export function DuplicatePlanButton({ profile }: DuplicatePlanButtonProps) {
  const router = useRouter();

  function duplicatePlan() {
    window.localStorage.setItem("dietaSprintDraftProfile", JSON.stringify(profile));
    window.localStorage.setItem("dietaSprintProfile", JSON.stringify(profile));
    router.push("/planner?draft=1");
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={duplicatePlan}>
      <CopyPlus size={16} aria-hidden="true" />
      Duplica nel planner
    </Button>
  );
}
