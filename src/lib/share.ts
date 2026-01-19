// X (Twitter) sharing utilities

const HASHTAGS = ['Blueprint', 'Template'];
const SITE_URL = 'https://example.com'; // Placeholder

export interface ShareContent {
  text: string;
  url?: string;
  hashtags?: string[];
}

export function buildXIntentUrl(content: ShareContent): string {
  const params = new URLSearchParams();
  
  params.set('text', content.text);
  
  if (content.url) {
    params.set('url', content.url);
  }
  
  const hashtags = content.hashtags || HASHTAGS;
  params.set('hashtags', hashtags.join(','));
  
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function openXShare(content: ShareContent): void {
  const url = buildXIntentUrl(content);
  window.open(url, '_blank', 'width=550,height=420');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

// Generic share URL builder
export function getShareUrl(path: string = ''): string {
  return `${SITE_URL}${path}`;
}
