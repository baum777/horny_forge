import { Link } from 'react-router-dom';
import { SocialGroup } from '@/components/ui/SocialGroup';
import { ContractAddress } from '@/components/ui/ContractAddress';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0B0B0B] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          
          {/* Brand */}
          <div>
            <span className="text-2xl font-black text-white">$HORNY</span>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              The Horny Meta Universe. Where desire meets gains.
            </p>
          </div>

          {/* Socials & CA */}
          <div className="flex flex-col items-center gap-6 w-full">
            <SocialGroup />
            <div className="w-full max-w-md border-t border-white/5 my-2" />
            <ContractAddress />
          </div>

          {/* Microcopy */}
          <div className="text-xs text-muted-foreground space-y-1 opacity-60">
            <p>No wallets required. Badges are status. Rewards are earned weekly.</p>
            <p>© {new Date().getFullYear()} $HORNY. Not financial advice. DYOR. NFA.</p>
          </div>

        </div>
      </div>
    </footer>
  );
}

