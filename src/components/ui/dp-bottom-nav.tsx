import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  { label: "Descobrir", route: "/feed", icon: "◒" },
  { label: "Lives", route: "/lives", icon: "●" },
  { label: "Chats", route: "/conversas", icon: "◫" },
  { label: "Carteira", route: "/carteira", icon: "◇" },
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
              style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
            >
              <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
              <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 50,
  },
  dock: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,12,16,0.97)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DP.colors.border,
    paddingHorizontal: 6,
    ...DP.shadow.card,
  },
  item: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  itemActive: { backgroundColor: DP.colors.primarySoft },
  icon: { color: DP.colors.dim, fontSize: 18, fontWeight: "900" },
  iconActive: { color: DP.colors.primary },
  label: { color: DP.colors.dim, fontSize: 9, fontWeight: "800" },
  labelActive: { color: DP.colors.text },
  pressed: { opacity: 0.72 },
});
