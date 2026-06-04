"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";

export function ExportDataButton() {
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function exportData() {
    setError("");
    setIsExporting(true);
    const response = await fetch("/api/privacy/export");
    setIsExporting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Export non disponibile.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dietsprint-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={exportData} disabled={isExporting}>
        <Download size={16} aria-hidden="true" />
        {isExporting ? "Genero..." : "Scarica export JSON"}
      </Button>
      {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
    </div>
  );
}
