import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CA = "7S2bVZJYAYQwN6iwwf2fMMWu15ajLveh2QDYhtJ3pump";

export function ContractAddress({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CA);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contract Address</span>
      <button 
        onClick={handleCopy}
        className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
      >
        <code className="text-sm md:text-base font-mono text-white bg-transparent border-none p-0">
          {CA}
        </code>
        {copied ? (
          <Check className="w-4 h-4 text-[#FFE600]" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
}

