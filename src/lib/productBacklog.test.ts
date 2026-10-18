import { describe, expect, it } from "vitest";
import { backlogAreas, backlogItems, backlogStatusLabels } from "./productBacklog";

describe("product backlog data", () => {
  it("has unique ids", () => {
    const ids = backlogItems.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only known areas, priorities and statuses", () => {
    for (const item of backlogItems) {
      expect(backlogAreas).toContain(item.area);
      expect(["P0", "P1", "P2", "P3"]).toContain(item.priority);
      expect(Object.keys(backlogStatusLabels)).toContain(item.status);
      expect(item.title.trim().length).toBeGreaterThan(3);
      expect(item.detail.trim().length).toBeGreaterThan(10);
    }
  });

  it("keeps the next sprint explicit", () => {
    expect(backlogItems.some((item) => item.status === "next")).toBe(true);
  });
});
