export function getAuthEndpoint(baseUrl: string | undefined, path: string): string | null {
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return null;
    }
    return `${url.href.replace(/\/+$/, '')}/api/v1/auth/${path}`;
  } catch {
    return null;
  }
}
