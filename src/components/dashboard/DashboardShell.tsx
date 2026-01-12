import type { ReactNode } from "react";

const DashboardShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-20 space-y-10">
        {children}
      </div>
    </div>
  );
};

export default DashboardShell;
