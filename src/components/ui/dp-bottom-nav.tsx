import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  { label: "Feed", route: "/feed", icon: "◇" },
  { label: "Matches", route: "/matches", icon: "♡" },
  { label: "Conversas", route: "/conversas", icon: "◯" },
  { label: "Carteira", route: "/carteira", icon: "▣" },
  { label: "Perfil", route: "/perfil", icon: "♙" },
] as const;

export function DPBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.goldLine} />
      <View style={styles.dock}>
        {items.map((item) => {
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              {active ? <View style={styles.activeLine} /> : null}
              <View style={styles.iconWrap}>
                <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
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
  goldLine: { height: 1, backgroundColor: "rgba(233,185,73,0.42)" },
  dock: {
    height: 82,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,2,2,0.99)",
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  item: {
    flex: 1,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
  },
  iconWrap: {
    width: 38,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: "#F1D07B",
    fontSize: 27,
    fontWeight: "300",
    lineHeight: 30,
  },
  iconActive: {
    color: DP.colors.primary,
    textShadowColor: "rgba(229,29,50,0.48)",
    textShadowRadius: 8,
  },
  label: {
    color: "#D7CEC8",
    fontSize: 10,
    fontWeight: "500",
  },
  labelActive: {
    color: DP.colors.primary,
    fontWeight: "800",
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: DP.colors.primary,
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.48,
    shadowRadius: 8,
    elevation: 7,
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.97 }] },
});
