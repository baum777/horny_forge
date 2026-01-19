import { useTheme } from '@/components/ThemeProvider';

type CopyParams = Record<string, string | number>;

const formatCopy = (template: string, params?: CopyParams) => {
  if (!params) return template;
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.split(`{${key}}`).join(String(value));
  }, template);
};

export const useCopy = () => {
  const { copy } = useTheme();

  return (key: string, params?: CopyParams) => {
    const value = copy[key];
    if (value === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`Missing copy key: ${key}`);
      }
      return key;
    }
    return formatCopy(value, params);
  };
};

