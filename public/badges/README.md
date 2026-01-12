# Badge Assets Organization

This directory contains all badge images organized by version and rarity.

## Structure

```
badges/
  v1/                    # Versioned asset pack
    common/              # Common rarity badges
    uncommon/            # Uncommon rarity badges
    rare/                # Rare rarity badges
    epic/                # Epic rarity badges
    legendary/           # Legendary rarity badges
    ui/                  # UI icons (lock, progress, etc.)
  manifest.json          # Badge metadata (optional)
  _archive/              # Old/unused badges (optional)
```

## Naming Convention

- **Dateiname = badgeId** (1:1 mapping)
- Format: `snake_case`, lowercase, URL-safe
- Extensions: `.webp` (preferred), `.png` (fallback), `.svg` (if vector needed)
- Examples:
  - `first_signal.webp`
  - `streak_starter.webp`
  - `amplifier.webp`

## Usage

### Backend

Badge icons are referenced via public URLs:

```typescript
icon: "/badges/v1/common/first_signal.webp"
```

### Frontend

```tsx
<img src={badge.icon} alt={badge.name} />
```

## Migration

To organize existing badge assets:

```bash
# Dry run (preview changes)
npm run badges:dry

# Apply changes
npm run badges:apply
```

## Adding New Badges

1. Create badge image file: `public/badges/v1/{rarity}/{badgeId}.webp`
2. Update `manifest.json` (if used)
3. Ensure backend DTO returns correct `icon` URL
4. Frontend will automatically display with fallback if missing

## Fallback Behavior

If a badge icon is missing:
- Frontend shows placeholder from `public/badges/v1/ui/unknown.svg`
- Backend can optionally set `icon` to default fallback

