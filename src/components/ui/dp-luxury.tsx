import { useNavigation } from "expo-router";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DP } from "../../constants/dp-theme";

export const DP_SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export function LuxuryBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.black} />
      <View style={styles.redGlowTop} />
      <View style={styles.redGlowCenter} />
      <View style={styles.goldArcTop} />
      <View style={styles.goldArcBottom} />
      <View style={styles.goldHairlineTop} />
    </View>
  );
}

export function LockHeart({ size = 48 }: { size?: number }) {
  const inner = Math.round(size * 0.72);
  return (
    <View style={[styles.lockWrap, { width: size, height: size }]}>
      <View style={[styles.lockShackle, { width: size * 0.46, height: size * 0.34, borderRadius: size * 0.2, top: size * 0.02 }]} />
      <View style={[styles.heartShell, { width: inner, height: inner, borderRadius: inner * 0.3, top: size * 0.24 }]}>
        <Text style={[styles.heartGlyph, { fontSize: size * 0.58, lineHeight: size * 0.68 }]}>♡</Text>
        <View style={[styles.keyHole, { width: size * 0.11, height: size * 0.22, borderRadius: size * 0.07 }]} />
      </View>
    </View>
  );
}

export function LuxuryBrand({
  compact = false,
  centered = false,
  tagline = false,
}: {
  compact?: boolean;
  centered?: boolean;
  tagline?: boolean;
}) {
  return (
    <View style={[styles.brandRow, centered && styles.brandCentered]}>
      <LockHeart size={compact ? 38 : 56} />
      <View style={centered ? styles.brandCopyCentered : undefined}>
        <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>Desejo Proibido</Text>
        {tagline ? <Text style={styles.brandTagline}>LIBERTE O SEU LADO REAL</Text> : null}
      </View>
    </View>
  );
}

export function LuxuryHeader({
  action,
  menu = true,
  compact = true,
}: {
  action?: ReactNode;
  menu?: boolean;
  compact?: boolean;
}) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  function openMenu() {
    if (navigation?.openDrawer) navigation.openDrawer();
    else navigation?.getParent?.()?.openDrawer?.();
  }

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.headerSide}>
        {menu ? (
          <Pressable onPress={openMenu} hitSlop={10} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
            <Text style={styles.menuGlyph}>☰</Text>
          </Pressable>
        ) : null}
      </View>
      <LuxuryBrand compact={compact} centered tagline />
      <View style={[styles.headerSide, styles.headerRight]}>{action}</View>
    </View>
  );
}

export function LuxuryScreen({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return (
    <View style={[styles.screen, style]}>
      <LuxuryBackground />
      {children}
    </View>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.eyebrowRow}>
      <Text style={styles.eyebrow}>{children}</Text>
      <View style={styles.eyebrowLine} />
    </View>
  );
}

export function GoldButton({
  title,
  onPress,
  disabled,
  red = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  red?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.goldButton,
        red && styles.redButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.goldButtonText, red && styles.redButtonText]}>{title}</Text>
      <Text style={[styles.goldButtonArrow, red && styles.redButtonText]}>›</Text>
    </Pressable>
  );
}

export function LuxuryCard({
  children,
  style,
  glow = false,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  glow?: boolean;
}) {
  return (
    <View style={[styles.card, glow && styles.cardGlow, style]}>
      {glow ? <View pointerEvents="none" style={styles.cardGlowBlob} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
  black: { ...StyleSheet.absoluteFillObject, backgroundColor: "#020202" },
  redGlowTop: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(150,0,18,0.16)",
    right: -170,
    top: -120,
  },
  redGlowCenter: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(120,0,14,0.10)",
    left: -180,
    top: "34%",
  },
  goldArcTop: {
    position: "absolute",
    width: 430,
    height: 430,
    borderRadius: 215,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.34)",
    right: -290,
    top: -225,
    transform: [{ rotate: "-18deg" }],
  },
  goldArcBottom: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.23)",
    left: -360,
    bottom: -330,
    transform: [{ rotate: "18deg" }],
  },
  goldHairlineTop: {
    position: "absolute",
    right: -80,
    top: 118,
    width: 260,
    height: 1,
    backgroundColor: "rgba(233,185,73,0.18)",
    transform: [{ rotate: "-32deg" }],
  },
  lockWrap: { position: "relative", alignItems: "center" },
  lockShackle: {
    position: "absolute",
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: DP.colors.goldBright,
    backgroundColor: "transparent",
  },
  heartShell: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heartGlyph: {
    color: DP.colors.goldBright,
    fontWeight: "300",
    textShadowColor: "rgba(233,185,73,0.35)",
    textShadowRadius: 8,
  },
  keyHole: { position: "absolute", backgroundColor: DP.colors.primary, bottom: "25%" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandCentered: { justifyContent: "center" },
  brandCopyCentered: { alignItems: "center" },
  brandTitle: {
    color: "#F4D07A",
    fontFamily: DP_SERIF,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    textShadowColor: "rgba(233,185,73,0.24)",
    textShadowRadius: 6,
  },
  brandTitleCompact: { fontSize: 21, lineHeight: 24 },
  brandTagline: {
    color: "#BDA67B",
    fontSize: 6.5,
    letterSpacing: 2.4,
    fontWeight: "800",
    marginTop: 1,
  },
  header: {
    minHeight: 74,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerSide: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  headerRight: { alignItems: "flex-end" },
  menuButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  menuGlyph: { color: DP.colors.goldBright, fontSize: 28, lineHeight: 30, fontWeight: "300" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { color: "#F0D28B", fontSize: 11, fontWeight: "800", letterSpacing: 4 },
  eyebrowLine: { flex: 1, height: 1, backgroundColor: "rgba(233,185,73,0.45)" },
  goldButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DP.colors.goldBright,
    backgroundColor: "#D9A842",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#E9B949",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  redButton: {
    backgroundColor: "#A9071C",
    borderColor: "#FF3150",
    shadowColor: "#E51D32",
    shadowOpacity: 0.35,
  },
  goldButtonText: { color: "#1B1000", fontFamily: DP_SERIF, fontSize: 17, fontWeight: "800" },
  redButtonText: { color: "#FFF8F2" },
  goldButtonArrow: { position: "absolute", right: 18, color: "#1B1000", fontSize: 28, fontWeight: "300" },
  disabled: { opacity: 0.45 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.42)",
    backgroundColor: "rgba(10,7,5,0.94)",
    overflow: "hidden",
  },
  cardGlow: {
    borderColor: "rgba(255,211,112,0.78)",
    shadowColor: "#E51D32",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7,
  },
  cardGlowBlob: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(170,0,20,0.16)",
    right: -80,
    top: -90,
  },
});
