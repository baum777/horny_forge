const socialLinks = [
  {
    href: "https://dexscreener.com/solana/EARThGewsskrBg6CMvX9dDxNtniAC4sHMSTHR5NNxWji",
    label: "Dexscreener",
    icon: "/hero_socials_and_logo_icons/dexscreener-icon.svg",
  },
  {
    href: "https://x.com/i/communities/2009563480613949770",
    label: "X Community",
    icon: "/hero_socials_and_logo_icons/x.svg",
  },
  {
    href: "https://discord.com/channels/1439751512091005042/1446863164808364255",
    label: "Discord",
    icon: "/hero_socials_and_logo_icons/discord-icon.svg",
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col pt-16 overflow-hidden bg-[#050505]">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
        <img
          src="/hero_socials_and_logo_icons/hero-logo.png"
          alt="$HORNY Logo"
          className="w-40 h-40 object-contain"
        />

        <p className="text-4xl md:text-5xl font-black tracking-tight text-white">$HORNY</p>

        <div className="flex items-center justify-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`$HORNY ${link.label}`}
              className="inline-flex items-center justify-center outline-none"
            >
              <img src={link.icon} alt={`${link.label} icon`} className="w-8 h-8" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

