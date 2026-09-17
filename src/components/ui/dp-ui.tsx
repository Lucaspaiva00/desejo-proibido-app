import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandIcon, compact && styles.brandIconCompact]}>
        <View style={styles.brandIconInner} />
      </View>
      <View>
        <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>Desejo Proibido</Text>
        {!compact ? <Text style={styles.brandSub}>CONEXÕES • LIVES • PRIVACIDADE</Text> : null}
      </View>
    </View>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "gold";
}) {
  const toneStyle =
    tone === "primary"
      ? styles.pillPrimary
      : tone === "success"
        ? styles.pillSuccess
        : tone === "gold"
          ? styles.pillGold
          : styles.pillNeutral;

  const textStyle =
    tone === "primary"
      ? styles.pillTextPrimary
      : tone === "success"
        ? styles.pillTextSuccess
        : tone === "gold"
          ? styles.pillTextGold
          : styles.pillTextNeutral;

  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, textStyle]}>{children}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {helper ? <Text style={styles.statHelper}>{helper}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  subtitle,
  onPress,
  disabled,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.primaryButtonTitle}>{title}</Text>
        {subtitle ? <Text style={styles.primaryButtonSub}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.primaryButtonArrow}>›</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
      <Text style={styles.secondaryButtonArrow}>›</Text>
    </Pressable>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}><View style={styles.emptyMarkInner} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DP.colors.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    ...DP.shadow.primary,
  },
  brandIconCompact: { width: 34, height: 34, borderRadius: 12 },
  brandIconInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: "#fff",
  },
  brandTitle: { color: DP.colors.text, fontSize: 21, fontWeight: "900", letterSpacing: -0.5 },
  brandTitleCompact: { fontSize: 17 },
  brandSub: { color: DP.colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.25, marginTop: 2 },
  kicker: { color: DP.colors.primary, fontWeight: "900", fontSize: 11, letterSpacing: 1.7 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: DP.colors.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.25 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: DP.radius.pill, borderWidth: 1 },
  pillNeutral: { backgroundColor: DP.colors.surface2, borderColor: DP.colors.border },
  pillPrimary: { backgroundColor: DP.colors.primarySoft, borderColor: DP.colors.borderStrong },
  pillSuccess: { backgroundColor: "rgba(52,209,123,0.10)", borderColor: "rgba(52,209,123,0.24)" },
  pillGold: { backgroundColor: "rgba(244,196,106,0.10)", borderColor: "rgba(244,196,106,0.24)" },
  pillText: { fontSize: 11, fontWeight: "900" },
  pillTextNeutral: { color: DP.colors.textSoft },
  pillTextPrimary: { color: "#FF91A7" },
  pillTextSuccess: { color: DP.colors.success },
  pillTextGold: { color: DP.colors.gold },
  statCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: DP.colors.border,
    ...DP.shadow.card,
  },
  statCardAccent: { backgroundColor: "#1D0C12", borderColor: DP.colors.borderStrong },
  statLabel: { color: DP.colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" },
  statValue: { color: DP.colors.text, fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 5, letterSpacing: -0.5 },
  statHelper: { color: DP.colors.dim, fontSize: 11, marginTop: 3 },
  primaryButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DP.colors.primary,
    borderRadius: DP.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...DP.shadow.primary,
  },
  primaryButtonTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  primaryButtonSub: { color: "rgba(255,255,255,0.76)", fontSize: 11, marginTop: 3 },
  primaryButtonArrow: { color: "#fff", fontSize: 30, fontWeight: "300", marginLeft: 10, marginTop: -2 },
  secondaryButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: DP.colors.border,
  },
  secondaryButtonText: { color: DP.colors.textSoft, fontWeight: "800", fontSize: 14 },
  secondaryButtonArrow: { color: DP.colors.dim, fontSize: 25 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 42,
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.xl,
    borderWidth: 1,
    borderColor: DP.colors.border,
  },
  emptyMark: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: DP.colors.primarySoft,
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMarkInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: DP.colors.primary },
  emptyTitle: { color: DP.colors.text, fontSize: 18, fontWeight: "900", marginTop: 14 },
  emptyText: { color: DP.colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
});
