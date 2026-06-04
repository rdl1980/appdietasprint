const sensitivePatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /password=[^&\s]+/gi,
  /token=[^&\s]+/gi,
  /bearer\s+[a-z0-9._-]+/gi,
];

export type ClientErrorEvent = {
  message?: string;
  digest?: string;
  stack?: string;
  path?: string;
  source?: string;
};

export function sanitizeErrorText(value: string | undefined) {
  if (!value) {
    return "";
  }

  return sensitivePatterns.reduce((text, pattern) => text.replace(pattern, "[redacted]"), value).slice(0, 1600);
}

export function sanitizeClientError(event: ClientErrorEvent) {
  return {
    message: sanitizeErrorText(event.message),
    digest: sanitizeErrorText(event.digest),
    stack: sanitizeErrorText(event.stack),
    path: sanitizeErrorText(event.path),
    source: sanitizeErrorText(event.source || "client"),
    reportedAt: new Date().toISOString(),
  };
}
