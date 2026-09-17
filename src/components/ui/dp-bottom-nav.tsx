import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  { label: "Feed", route: "/feed", icon: "⌁" },
  { label: "Matches", route: "/matches", icon: "♡" },
  { label: "Conversas", route: "/conversas", icon: "◌" },
  { label: "Carteira", route: "/carteira", icon: "▣" },
  { label: "Perfil", route: "/perfil", icon: "○" },
] as const;

export function DPBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.dock}>
        {items.map((item) => {
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
              {active ? <View style={styles.activeLine} /> : null}
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
    zIndex: 60,
  },
  dock: {
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(3,3,3,0.985)",
    borderTopWidth: 1,
    borderTopColor: DP.colors.borderGold,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  item: {
    flex: 1,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
  },
  iconWrap: {
    width: 32,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: DP.colors.primarySoft,
  },
  icon: {
    color: DP.colors.gold,
    fontSize: 22,
    fontWeight: "800",
  },
  iconActive: {
    color: DP.colors.primary,
  },
  label: {
    color: "#A99884",
    fontSize: 9,
    fontWeight: "700",
  },
  labelActive: {
    color: DP.colors.primary,
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 30,
    height: 3,
    borderRadius: 999,
    backgroundColor: DP.colors.primary,
    ...DP.shadow.primary,
  },
  pressed: { opacity: 0.7 },
});
