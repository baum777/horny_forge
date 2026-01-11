import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TokenStatsProvider } from "@/lib/hooks/useTokenStats";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "$HORNY - THE HORNY ARCHIVES",
  description: "A living record of collective desire. Infuse. Vote. Ascend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TokenStatsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" theme="dark" />
            {children}
          </TooltipProvider>
        </TokenStatsProvider>
      </body>
    </html>
  );
}

