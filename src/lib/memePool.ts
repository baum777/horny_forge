const normalizeBase = (base: string): string => {
  if (!base) return '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export const buildMemePoolUrl = (fileName: string): string => {
  const base = normalizeBase(import.meta.env.BASE_URL ?? '/');
  return `${base}horny_base/${fileName}`;
};
