import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSetting } from "@shared/schema";

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hslH = Math.round(h * 360);
  const hslS = Math.round(s * 100);
  const hslL = Math.round(l * 100);

  return `${hslH} ${hslS}% ${hslL}%`;
}

export default function ThemeEngine() {
  const { data: settings = [] } = useQuery<SiteSetting[]>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    // Ensure dark class is always on
    document.documentElement.classList.add("dark");

    // Build a map of settings by key for quick lookup
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Apply color settings (converted from hex to HSL)
    const colorMap: Record<string, string> = {
      primary_color: "--primary",
      background_color: "--background",
      card_color: "--card",
      accent_color: "--accent",
      text_color: "--foreground",
    };

    Object.entries(colorMap).forEach(([settingKey, cssVar]) => {
      const value = settingsMap.get(settingKey);
      if (value && value.startsWith("#")) {
        const hslValue = hexToHsl(value);
        document.documentElement.style.setProperty(cssVar, hslValue);
      }
    });

    // Apply font settings
    const fontHeading = settingsMap.get("font_heading");
    if (fontHeading) {
      document.documentElement.style.setProperty("--font-heading", fontHeading);
    }

    const fontBody = settingsMap.get("font_body");
    if (fontBody) {
      document.documentElement.style.setProperty("--font-sans", fontBody);
    }

    // Apply border radius
    const borderRadius = settingsMap.get("border_radius");
    if (borderRadius) {
      document.documentElement.style.setProperty("--radius", `${borderRadius}rem`);
    }
  }, [settings]);

  return null;
}
