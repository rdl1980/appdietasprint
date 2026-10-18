import { describe, expect, it } from "vitest";
import { isEmailConfigured, notifyPrivacyRequest, notifySecurityEvent, sendEmail } from "./email";

describe("email without Resend configured", () => {
  it("reports as not configured", () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it("does not throw and reports the missing key", async () => {
    await expect(sendEmail({ to: "a@b.it", subject: "s", text: "t" })).resolves.toEqual({
      sent: false,
      reason: "RESEND_API_KEY non configurata.",
    });
  });

  it("privacy and security notifications degrade gracefully", async () => {
    await expect(notifyPrivacyRequest({ requestId: "r1", email: "a@b.it", requestType: "access" })).resolves.toMatchObject({ sent: false });
    await expect(notifySecurityEvent({ email: "a@b.it", event: "login" })).resolves.toMatchObject({ sent: false });
  });
});
