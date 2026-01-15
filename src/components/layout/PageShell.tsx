import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export type PageState = "active" | "teaser" | "locked";

export interface PageSpec {
  page: string;
  flavor: string;
  energy: number;
  state?: PageState;
  tier?: string;
}

interface PageShellProps {
  children: React.ReactNode;
  spec: PageSpec;
}

export function PageShell({ children, spec }: PageShellProps) {
  const location = useLocation();

  useEffect(() => {
    document.body.dataset.page = spec.page;
    document.body.dataset.flavor = spec.flavor;
    document.body.dataset.energy = spec.energy.toString();
    document.body.dataset.state = spec.state ?? "active";
    if (typeof spec.tier === "string") {
      document.body.dataset.tier = spec.tier;
    } else {
      document.body.removeAttribute("data-tier");
    }

    return () => {
      // Keep attributes until next page renders (PageShell for next route will overwrite)
    };
  }, [spec, location]);

  return <>{children}</>;
}

