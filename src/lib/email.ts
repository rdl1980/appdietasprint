import "server-only";
import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type PrivacyRequestEmailInput = {
  requestId: string;
  email: string;
  requestType: string;
  notes?: string | null;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailInput) {
  const resend = getResendClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY non configurata." };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "DietaSprint AI <no-reply@dietsprintai.com>",
    to,
    subject,
    text,
    html,
    replyTo,
  });

  if (error) {
    console.error("Resend email error", error);
    return { sent: false, reason: error.message };
  }

  return { sent: true };
}

export async function notifyPrivacyRequest({ requestId, email, requestType, notes }: PrivacyRequestEmailInput) {
  const to =
    process.env.PRIVACY_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    "ciao@dietsprintai.com";

  const text = [
    "Nuova richiesta privacy/GDPR da DietaSprint AI.",
    "",
    `ID richiesta: ${requestId}`,
    `Email utente: ${email}`,
    `Tipo richiesta: ${requestType}`,
    "",
    "Note:",
    notes?.trim() || "Nessuna nota inserita.",
  ].join("\n");

  return sendEmail({
    to,
    subject: `Nuova richiesta privacy DietaSprint AI - ${requestId}`,
    text,
    replyTo: email,
  });
}
