import { useCopy } from '@/lib/theme/copy';
import { useAsset } from '@/lib/theme/assets';

const socialLinks = [
  {
    href: "https://dexscreener.com/solana/EARThGewsskrBg6CMvX9dDxNtniAC4sHMSTHR5NNxWji",
    labelKey: "brand.social.dexscreener",
    assetKey: "socialDex",
  },
  {
    href: "https://x.com/i/communities/2009563480613949770",
    labelKey: "brand.social.xCommunity",
    assetKey: "socialX",
  },
  {
    href: "https://discord.com/channels/1439751512091005042/1446863164808364255",
    labelKey: "brand.social.discord",
    assetKey: "socialDiscord",
  },
];

export default function Hero() {
  const t = useCopy();
  const getAsset = useAsset();
  return (
    <section className="relative min-h-screen flex flex-col pt-16 overflow-hidden bg-[#050505]">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
        <img
          src={getAsset("logo")}
          alt={t('brand.logoAlt')}
          className="w-40 h-40 object-contain"
        />

        <p className="text-4xl md:text-5xl font-black tracking-tight text-white">{t('brand.wordmark')}</p>

        <div className="flex items-center justify-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('brand.social.ariaLabel', { label: t(link.labelKey) })}
              className="inline-flex items-center justify-center outline-none"
            >
              <img src={getAsset(link.assetKey)} alt={t('brand.social.iconAlt', { label: t(link.labelKey) })} className="w-8 h-8" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

