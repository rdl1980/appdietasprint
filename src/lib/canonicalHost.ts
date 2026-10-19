/**
 * Auth.js cookies and localStorage are host-scoped: a session opened on
 * www.dietsprintai.com is invisible on dietsprintai.com and vice versa.
 * Every alias of the site therefore redirects to the host of NEXT_PUBLIC_SITE_URL.
 */
export function getCanonicalHost(siteUrl: string) {
  try {
    const url = new URL(siteUrl);
    return url.protocol === "https:" ? url.host.toLowerCase() : "";
  } catch {
    return "";
  }
}

export function getCanonicalRedirect(requestUrl: string, siteUrl: string): string | null {
  const canonicalHost = getCanonicalHost(siteUrl);

  if (!canonicalHost) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }

  const host = url.host.toLowerCase();

  if (host === canonicalHost) {
    return null;
  }

  const isWwwAlias = host === `www.${canonicalHost}` || `www.${host}` === canonicalHost;

  if (!isWwwAlias) {
    return null;
  }

  url.protocol = "https:";
  url.host = canonicalHost;
  return url.toString();
}
