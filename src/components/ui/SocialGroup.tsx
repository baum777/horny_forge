import { ExternalLink, LineChart, MessageCircle, Twitter } from "lucide-react";

export function SocialGroup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Dex Screener */}
      <a
        href="https://dexscreener.com/solana/EARThGewsskrBg6CMvX9dDxNtniAC4sHMSTHR5NNxWji"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-[#FFE600] transition-all duration-200 hover:drop-shadow-[0_0_15px_rgba(255,230,0,0.5)]"
        aria-label="Dex Screener"
      >
        <LineChart className="w-6 h-6" />
      </a>

      {/* Discord */}
      <a
        href="https://discord.com/channels/1439751512091005042/1446863164808364255"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-[#FFE600] transition-all duration-200 hover:drop-shadow-[0_0_15px_rgba(255,230,0,0.5)]"
        aria-label="Discord"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* X Community */}
      <a
        href="https://x.com/i/communities/2009563480613949770"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-[#FFE600] transition-all duration-200 hover:drop-shadow-[0_0_15px_rgba(255,230,0,0.5)]"
        aria-label="X Community"
      >
        <Twitter className="w-6 h-6" />
      </a>
    </div>
  );
}

