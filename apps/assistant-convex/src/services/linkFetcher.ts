export interface LinkMetadataResult {
  url: string;
  canonicalUrl?: string;
  domain: string;
  title?: string;
  description?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  contentSnippet?: string;
  fetchedAt: number;
  fetchStatus: 'success' | 'partial' | 'failed';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function extractMeta(html: string, property: string): string | undefined {
  // Match <meta property="..." content="..."> or <meta name="..." content="...">
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  const match = regex.exec(html);
  if (match) return match[1];

  // Also try reversed attribute order: content="..." property="..."
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i',
  );
  const match2 = regex2.exec(html);
  return match2?.[1];
}

function extractTitle(html: string): string | undefined {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1]?.trim();
}

function extractCanonicalUrl(html: string): string | undefined {
  const match =
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (match) return match[1];

  const match2 =
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i.exec(html);
  return match2?.[1];
}

function extractFaviconUrl(html: string, baseUrl: string): string | undefined {
  const match =
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i.exec(
      html,
    );
  if (match?.[1]) {
    const href = match[1];
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  }

  // Fallback to /favicon.ico
  try {
    const origin = new URL(baseUrl).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return undefined;
  }
}

function extractContentSnippet(html: string): string {
  // Remove script and style blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // Strip all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text.slice(0, 500);
}

// TODO: Replace manual HTML parsing with Firecrawl or a similar service for
// more robust metadata extraction
// 👀 Needs Verification
export async function fetchLinkMetadata(
  url: string,
): Promise<LinkMetadataResult> {
  const domain = extractDomain(url);
  const fetchedAt = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let html: string;
  try {
    const response = await fetch(url, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signal: controller.signal as any,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LetUsCookBot/1.0; +https://letuscook.app)',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return { url, domain, fetchedAt, fetchStatus: 'failed' };
    }

    html = await response.text();
  } catch {
    return { url, domain, fetchedAt, fetchStatus: 'failed' };
  } finally {
    clearTimeout(timeoutId);
  }

  // Extract metadata
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  const ogImage = extractMeta(html, 'og:image');
  const metaDescription = extractMeta(html, 'description');
  const htmlTitle = extractTitle(html);
  const canonicalUrl = extractCanonicalUrl(html);
  const faviconUrl = extractFaviconUrl(html, url);
  const contentSnippet = extractContentSnippet(html);

  const title = ogTitle ?? htmlTitle;
  const description = ogDescription ?? metaDescription;

  // Determine fetch status
  const hasMinimalData = title !== undefined || description !== undefined;
  const fetchStatus = hasMinimalData ? 'success' : 'partial';

  return {
    url,
    canonicalUrl,
    domain,
    title,
    description,
    faviconUrl,
    ogImageUrl: ogImage,
    contentSnippet: contentSnippet.length > 0 ? contentSnippet : undefined,
    fetchedAt,
    fetchStatus,
  };
}
