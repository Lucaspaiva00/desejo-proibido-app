import { SymbolView } from "expo-symbols";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  {
    label: "Início",
    route: "/home",
    symbol: { ios: "house.fill", android: "home", web: "home" },
  },
  {
    label: "Descobrir",
    route: "/feed",
    symbol: { ios: "safari.fill", android: "explore", web: "explore" },
  },
  {
    label: "Lives",
    route: "/lives",
    symbol: { ios: "dot.radiowaves.left.and.right", android: "sensors", web: "sensors" },
  },
  {
    label: "Conversas",
    route: "/conversas",
    symbol: { ios: "bubble.left.and.bubble.right.fill", android: "forum", web: "forum" },
  },
  {
    label: "VIP",
    route: "/creditos",
    symbol: { ios: "crown.fill", android: "workspace_premium", web: "workspace_premium" },
  },
  {
    label: "Carteira",
    route: "/carteira",
    symbol: { ios: "wallet.bifold.fill", android: "account_balance_wallet", web: "account_balance_wallet" },
  },
  {
    label: "Perfil",
    route: "/perfil",
    symbol: { ios: "person.crop.circle.fill", android: "account_circle", web: "account_circle" },
  },
] as const;

export function DPBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.goldLine} />

      <View style={styles.dock}>
        {items.map((item) => {
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);
          const vip = item.label === "VIP";
          const iconColor = active
            ? DP.colors.primary
            : vip
              ? "#E8B94A"
              : "#D7D1CB";

          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              {active ? <View style={styles.activeIndicator} /> : null}

              <View
                style={[
                  styles.iconShell,
                  active && styles.iconShellActive,
                  vip && !active && styles.iconShellVip,
                ]}
              >
                <SymbolView
                  name={item.symbol as any}
                  size={active ? 27 : 25}
                  tintColor={iconColor}
                  style={styles.symbol}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  vip && styles.vipLabel,
                  active && styles.labelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80,
    backgroundColor: "#020202",
  },

  goldLine: {
    height: 1,
    backgroundColor: "rgba(217,169,54,0.52)",
  },

  dock: {
    height: 88,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,2,2,0.995)",
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },

  item: {
    flex: 1,
    minWidth: 0,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  itemActive: {
    transform: [{ translateY: -1 }],
  },

  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 99,
    backgroundColor: DP.colors.primary,
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.95,
    shadowRadius: 9,
    elevation: 8,
  },

  iconShell: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  iconShellActive: {
    backgroundColor: "rgba(227,27,45,0.09)",
    borderWidth: 1,
    borderColor: "rgba(227,27,45,0.22)",
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.48,
    shadowRadius: 9,
    elevation: 6,
  },

  iconShellVip: {
    backgroundColor: "rgba(232,185,74,0.035)",
  },

  symbol: {
    width: 29,
    height: 29,
  },

  label: {
    color: "#BBB5B0",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "500",
    letterSpacing: 0.05,
  },

  vipLabel: {
    color: "#E8B94A",
    fontWeight: "700",
  },

  labelActive: {
    color: DP.colors.primary,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.95 }],
  },
});
