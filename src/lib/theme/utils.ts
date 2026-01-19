import type { ThemeTokens } from './types';

export function generateThemeVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  // Helper to add var
  const add = (key: string, value: string) => {
    vars[`--${key}`] = value;
  };

  // Brand + Surface
  add('brand-primary', tokens.brand.primary);
  add('brand-secondary', tokens.brand.secondary);
  add('brand-foreground', tokens.brand.foreground);
  add('text-primary', tokens.text.primary);
  add('text-secondary', tokens.text.secondary);
  add('surface-bg', tokens.surface.background);
  add('surface-1', tokens.surface.level1);
  add('surface-2', tokens.surface.level2);
  add('surface-3', tokens.surface.level3);
  add('border-subtle', tokens.border.subtle);
  add('border-accent', tokens.border.accent);
  add('glow-soft', tokens.effects.glowSoft);
  add('glow-strong', tokens.effects.glowStrong);

  // Tailwind Colors
  add('background', tokens.tailwind.background);
  add('foreground', tokens.tailwind.foreground);
  add('card', tokens.tailwind.card);
  add('card-foreground', tokens.tailwind.cardForeground);
  add('popover', tokens.tailwind.popover);
  add('popover-foreground', tokens.tailwind.popoverForeground);
  add('primary', tokens.tailwind.primary);
  add('primary-foreground', tokens.tailwind.primaryForeground);
  add('secondary', tokens.tailwind.secondary);
  add('secondary-foreground', tokens.tailwind.secondaryForeground);
  add('muted', tokens.tailwind.muted);
  add('muted-foreground', tokens.tailwind.mutedForeground);
  add('accent', tokens.tailwind.accent);
  add('accent-foreground', tokens.tailwind.accentForeground);
  add('destructive', tokens.tailwind.destructive);
  add('destructive-foreground', tokens.tailwind.destructiveForeground);
  add('border', tokens.tailwind.border);
  add('input', tokens.tailwind.input);
  add('ring', tokens.tailwind.ring);
  add('radius', tokens.tailwind.radius);

  // Sidebar
  add('sidebar-background', tokens.sidebar.background);
  add('sidebar-foreground', tokens.sidebar.foreground);
  add('sidebar-primary', tokens.sidebar.primary);
  add('sidebar-primary-foreground', tokens.sidebar.primaryForeground);
  add('sidebar-accent', tokens.sidebar.accent);
  add('sidebar-accent-foreground', tokens.sidebar.accentForeground);
  add('sidebar-border', tokens.sidebar.border);
  add('sidebar-ring', tokens.sidebar.ring);

  return vars;
}

