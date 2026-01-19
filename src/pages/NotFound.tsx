import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useCopy } from "@/lib/theme/copy";

const NotFound = () => {
  const t = useCopy();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell
      spec={{
        page: "notfound",
        flavor: "default",
        energy: 1,
      }}
    >
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">{t("errors.notFoundTitle")}</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            {t("errors.notFoundCta")}
          </a>
        </div>
      </div>
    </PageShell>
  );
};

export default NotFound;
