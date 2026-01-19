import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const errors = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf-8"));

const ensureStringRecord = (value, label, filePath) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${filePath}: ${label} must be an object`);
    return false;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      errors.push(`${filePath}: ${label}.${key} must be a string`);
      return false;
    }
  }
  return true;
};

const validateThemes = () => {
  const themesDir = path.join(repoRoot, "themes");
  if (!fs.existsSync(themesDir)) {
    errors.push("themes/: directory missing");
    return;
  }

  const themeDirs = fs
    .readdirSync(themesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (themeDirs.length === 0) {
    errors.push("themes/: no theme packs found");
    return;
  }

  for (const themeId of themeDirs) {
    const themeRoot = path.join(themesDir, themeId);
    const tokensPath = path.join(themeRoot, "tokens.json");
    if (!fs.existsSync(tokensPath)) {
      errors.push(`${tokensPath}: missing`);
      continue;
    }

    let tokens;
    try {
      tokens = readJson(tokensPath);
    } catch (err) {
      errors.push(`${tokensPath}: invalid JSON`);
      continue;
    }

    const required = ["themeId", "displayName", "tokens", "assets"];
    for (const key of required) {
      if (!(key in tokens)) {
        errors.push(`${tokensPath}: missing ${key}`);
      }
    }

    if (tokens.themeId !== themeId) {
      errors.push(`${tokensPath}: themeId must match folder name (${themeId})`);
    }

    if (!tokens.tokens || typeof tokens.tokens !== "object") {
      errors.push(`${tokensPath}: tokens must be an object`);
    } else {
      const tokenGroups = {
        brand: ["primary", "secondary", "foreground"],
        text: ["primary", "secondary"],
        surface: ["background", "level1", "level2", "level3"],
        border: ["subtle", "accent"],
        effects: ["glowSoft", "glowStrong"],
        tailwind: [
          "background",
          "foreground",
          "card",
          "cardForeground",
          "popover",
          "popoverForeground",
          "primary",
          "primaryForeground",
          "secondary",
          "secondaryForeground",
          "muted",
          "mutedForeground",
          "accent",
          "accentForeground",
          "destructive",
          "destructiveForeground",
          "border",
          "input",
          "ring",
          "radius",
        ],
        sidebar: [
          "background",
          "foreground",
          "primary",
          "primaryForeground",
          "accent",
          "accentForeground",
          "border",
          "ring",
        ],
      };

      for (const [group, keys] of Object.entries(tokenGroups)) {
        const section = tokens.tokens?.[group];
        if (!section || typeof section !== "object") {
          errors.push(`${tokensPath}: tokens.${group} must be an object`);
          continue;
        }
        for (const key of keys) {
          if (typeof section[key] !== "string") {
            errors.push(`${tokensPath}: tokens.${group}.${key} must be a string`);
          }
        }
      }
    }

    if (!ensureStringRecord(tokens.assets, "assets", tokensPath)) {
      continue;
    }

    for (const assetPath of Object.values(tokens.assets)) {
      const resolvedPath = path.join(themeRoot, "assets", assetPath);
      if (!fs.existsSync(resolvedPath)) {
        errors.push(`${tokensPath}: asset missing at ${resolvedPath}`);
      }
    }

    const copyFiles = fs
      .readdirSync(themeRoot)
      .filter((file) => file.startsWith("copy.") && file.endsWith(".json"));
    if (copyFiles.length === 0) {
      errors.push(`${themeRoot}: missing copy.<lang>.json`);
    } else {
      for (const file of copyFiles) {
        const filePath = path.join(themeRoot, file);
        try {
          const copy = readJson(filePath);
          ensureStringRecord(copy, "copy", filePath);
        } catch {
          errors.push(`${filePath}: invalid JSON`);
        }
      }
    }
  }
};

const extractStringLiterals = (content) => {
  const regex = /(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g;
  return content.match(regex) ?? [];
};

const checkForbiddenTerms = () => {
  const scanDirs = ["src/components", "src/pages"];
  const forbidden = [/horny/i, /meme/i];
  const allowlist = [
    /^HORNY_/,
    /^horny_/,
    /horny-meter-add/,
    /^meme-forged$/,
    /^three-memes$/,
  ];

  for (const dir of scanDirs) {
    const fullDir = path.join(repoRoot, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = walk(fullDir).filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const rawLiteral of extractStringLiterals(content)) {
        const literal = rawLiteral.slice(1, -1);
        if (!forbidden.some((pattern) => pattern.test(literal))) {
          continue;
        }
        if (allowlist.some((pattern) => pattern.test(literal))) {
          continue;
        }
        errors.push(`${file}: forbidden term in string literal "${literal}"`);
      }
    }
  }
};

const checkDirectAssets = () => {
  const scanDirs = ["src/components", "src/pages"];
  const assetRegex = /(^|\/)[^\s"'`]+?\.(svg|png|jpe?g|webp)(\?|#|$)/i;

  for (const dir of scanDirs) {
    const fullDir = path.join(repoRoot, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = walk(fullDir).filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const rawLiteral of extractStringLiterals(content)) {
        const literal = rawLiteral.slice(1, -1);
        const looksLikePath = literal.includes("/") || literal.startsWith("./") || literal.startsWith("../");
        if (!looksLikePath) continue;
        if (!assetRegex.test(literal)) continue;
        if (literal.startsWith("/themes/")) continue;
        if (literal.startsWith("http")) continue;
        errors.push(`${file}: direct asset path "${literal}" (use theme assets)`);
      }
    }
  }
};

validateThemes();
checkForbiddenTerms();
checkDirectAssets();

if (errors.length > 0) {
  console.error("Theme guard failed:");
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
} else {
  console.log("Theme guard passed.");
}

