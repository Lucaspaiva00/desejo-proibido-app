export const DP = {
  colors: {
    background: "#070507",
    backgroundSoft: "#0B080B",
    surface: "#110D11",
    surface2: "#171117",
    surface3: "#1E161D",
    text: "#FFF8FB",
    textSoft: "#D9CCD2",
    muted: "#9B8D94",
    dim: "#6F6369",
    primary: "#FF2D55",
    primaryDark: "#B81034",
    primarySoft: "rgba(255,45,85,0.12)",
    gold: "#F4C46A",
    success: "#34D17B",
    warning: "#F4B64B",
    danger: "#FF637A",
    info: "#73A7FF",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,45,85,0.28)",
    glass: "rgba(17,13,17,0.88)",
    blackGlass: "rgba(5,3,5,0.74)",
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 30,
    pill: 999,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 40,
  },
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 24,
      elevation: 10,
    },
    primary: {
      shadowColor: "#FF2D55",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 22,
      elevation: 8,
    },
  },
} as const;

export const dpNumber = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("pt-BR");
