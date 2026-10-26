import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  { label: "Início", route: "/home", icon: "⌂" },
  { label: "Descobrir", route: "/feed", icon: "⌕" },
  { label: "Lives", route: "/lives", icon: "◉" },
  { label: "Conversas", route: "/conversas", icon: "◌" },
  { label: "VIP", route: "/creditos", icon: "♕" },
  { label: "Carteira", route: "/carteira", icon: "▱" },
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
                <Text style={[styles.icon, item.label === "VIP" && styles.vipIcon, active && styles.iconActive]}>
                  {item.icon}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.label, item.label === "VIP" && styles.vipLabel, active && styles.labelActive]}>
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
  goldLine: { height: 1, backgroundColor: "rgba(224,168,66,0.58)" },
  dock: {
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,2,2,0.995)",
    paddingHorizontal: 3,
    paddingBottom: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },
  iconWrap: {
    width: 33,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: "#A9A9AB",
    fontSize: 27,
    fontWeight: "300",
    lineHeight: 30,
  },
  vipIcon: { color: "#E7B94F" },
  iconActive: {
    color: DP.colors.primary,
    textShadowColor: "rgba(229,29,50,0.68)",
    textShadowRadius: 9,
  },
  label: {
    color: "#C8C5C4",
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "500",
  },
  vipLabel: { color: "#E7B94F" },
  labelActive: {
    color: DP.colors.primary,
    fontWeight: "800",
  },
  activeLine: {
    position: "absolute",
    bottom: 2,
    width: 40,
    height: 3,
    borderRadius: 999,
    backgroundColor: DP.colors.primary,
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.75,
    shadowRadius: 7,
    elevation: 7,
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.97 }] },
});
