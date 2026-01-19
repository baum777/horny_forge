import { useState } from 'react';
import { Twitter, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getShareRedirectUrl } from '@/lib/api/share';
import { useCopy } from '@/lib/theme/copy';

interface SharePanelProps {
  artifactId: string;
  caption: string;
  compact?: boolean;
}

export function SharePanel({ artifactId, caption, compact = false }: SharePanelProps) {
  const t = useCopy();
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);
  const artifactUrl = `${window.location.origin}/artifact/${artifactId}`;
  const shareText = t('share.artifact', { caption });
  const hashtags = t('share.hashtags');

  const resolveShareUrl = async () => {
    const redirectUrl = await getShareRedirectUrl(artifactId);
    return redirectUrl ?? artifactUrl;
  };

  const shareToX = async () => {
    const resolvedUrl = await resolveShareUrl();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(resolvedUrl)}&hashtags=${hashtags}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const copyLink = async () => {
    try {
      const resolvedUrl = await resolveShareUrl();
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied('link');
      toast.success(t('share.copy.linkSuccess'));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t('share.copy.failed'));
    }
  };

  const copyText = async () => {
    try {
      const resolvedUrl = await resolveShareUrl();
      const tagText = hashtags
        .split(',')
        .map((tag) => `#${tag.trim()}`)
        .join(' ');
      await navigator.clipboard.writeText(`${shareText} ${resolvedUrl} ${tagText}`.trim());
      setCopied('text');
      toast.success(t('share.copy.textSuccess'));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t('share.copy.failed'));
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={shareToX}
          size="sm"
          className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
        >
          <Twitter className="w-4 h-4" />
        </Button>
        <Button
          onClick={copyLink}
          size="sm"
          variant="outline"
        >
          {copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {t('share.title')}
      </h4>
      
      <Button
        onClick={shareToX}
        className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8]"
      >
        <Twitter className="w-4 h-4 mr-2" />
        {t('share.actions.shareToX')}
      </Button>

      <div className="flex gap-2">
        <Button
          onClick={copyLink}
          variant="outline"
          className="flex-1"
        >
          {copied === 'link' ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
          {t('share.actions.copyLink')}
        </Button>
        <Button
          onClick={copyText}
          variant="outline"
          className="flex-1"
        >
          {copied === 'text' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {t('share.actions.copyText')}
        </Button>
      </div>
    </div>
  );
}
