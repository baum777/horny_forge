import { useTheme } from '@/components/ThemeProvider';
import type { ThemeAssets } from './types';

export const resolveAsset = (assets: ThemeAssets, name: string, fallback: string = ''): string => {
  return assets[name] ?? fallback;
};

export const useAsset = () => {
  const { assets } = useTheme();
  return (name: string, fallback: string = '') => resolveAsset(assets, name, fallback);
};


