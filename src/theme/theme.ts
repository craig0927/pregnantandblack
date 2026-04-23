/*  PAB Brand Theme — Pregnant and Black
 *  Brand palette: coral, peach, cream, charcoal
 *  Typography: Poppins (loaded via expo-font in App.tsx)
 *  Design intent: warm, personal, never clinical
 */

export const colors = {
  // ── Brand palette ──────────────────────────────────────
  coral:      "#E07856",   // primary accent — buttons, headings, active states
  coralLight: "#E8936F",   // hover / pressed variant
  coralDark:  "#C4613E",   // contrast-safe on white for small text
  peach:      "#F2B89C",   // soft backgrounds, cards, tags
  peony:      "#D97B8F",   // secondary accent — highlights, badges
  cream:      "#FAF3E8",   // page background (replaces flat gray)
  charcoal:   "#2E2E2E",   // primary text
  warmGray:   "#6B5E5E",   // secondary / muted text

  // ── Core tokens (mapped to brand) ─────────────────────
  primary:     "#E07856",
  text:        "#2E2E2E",
  muted:       "#6B5E5E",
  bg:          "#FAF3E8",
  card:        "#FFFFFF",
  border:      "#E8D5C4",
  inputBorder: "#DBC8B8",
  inputBg:     "#FFFFFF",

  // ── Neutrals (still useful for structure) ─────────────
  black:   "#000000",
  white:   "#FFFFFF",
  gray950: "#0A0A0A",
  gray900: "#171717",
  gray800: "#262626",
  gray700: "#404040",
  gray600: "#525252",
  gray500: "#737373",
  gray400: "#A3A3A3",
  gray300: "#D4D4D4",
  gray200: "#EBEBEB",
  gray100: "#F4F4F5",
  gray50:  "#FAFAFA",

  // ── Semantic ──────────────────────────────────────────
  success:  "#22C55E",
  warning:  "#F59E0B",
  error:    "#DC2626",
  accent:   "#E07856",   // alias for coral (back-compat)
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/* Font family tokens — use these instead of hard-coded strings.
 * Poppins must be loaded in App.tsx via expo-font before first render.
 * Fallbacks: the default system font renders if Poppins isn't ready.  */
export const fonts = {
  regular:    "Poppins_400Regular",
  medium:     "Poppins_500Medium",
  semiBold:   "Poppins_600SemiBold",
  bold:       "Poppins_700Bold",
};

export const typography = {
  h1:        { fontSize: 32, fontWeight: "700" as const, fontFamily: fonts.bold },
  h2:        { fontSize: 24, fontWeight: "600" as const, fontFamily: fonts.semiBold },
  h3:        { fontSize: 18, fontWeight: "500" as const, fontFamily: fonts.medium },
  bodyLarge: { fontSize: 16, fontWeight: "400" as const, fontFamily: fonts.regular },
  body:      { fontSize: 14, fontWeight: "400" as const, fontFamily: fonts.regular },
  caption:   { fontSize: 12, fontWeight: "400" as const, fontFamily: fonts.regular },
};

export const shadow = {
  card: {
    shadowColor: "#C4A98C",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  soft: {
    shadowColor: "#C4A98C",
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
};

/* Neumorphic tokens kept for backward-compat but re-mapped to warm palette.
 * Prefer shadow.card / shadow.soft for new components.  */
export const neumorph = {
  bg: "#FAF3E8" as const,
  insetBg: "#F0E4D4" as const,
  shadowColor: "#C4A98C" as const,
  raised: {
    shadowColor: "#C4A98C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: "#FFFFFF",
  },
  inset: {
    backgroundColor: "#F0E4D4",
    elevation: 0,
    shadowOpacity: 0,
  },
};

const theme = { colors, spacing, radius, typography, fonts, shadow, neumorph };

export default theme;
