import { SymbolView } from "expo-symbols";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DP } from "../../constants/dp-theme";

const items = [
  {
    label: "Descobrir",
    route: "/feed",
    symbol: { ios: "safari", android: "explore", web: "explore" },
  },
  {
    label: "Matches",
    route: "/matches",
    symbol: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  },
  {
    label: "Conversas",
    route: "/conversas",
    symbol: { ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  },
  {
    label: "Carteira",
    route: "/carteira",
    symbol: { ios: "wallet.bifold", android: "wallet", web: "wallet" },
  },
  {
    label: "Perfil",
    route: "/perfil",
    symbol: { ios: "person", android: "person_outline", web: "person_outline" },
  },
] as const;

export function DPBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.goldLine} />

      <View style={styles.dock}>
        {items.map((item) => {
          const active =
            pathname === item.route ||
            pathname.startsWith(`${item.route}/`);

          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.pressed,
              ]}
            >
              {active ? <View style={styles.activeIndicator} /> : null}

              <View style={styles.iconStage}>
                <SymbolView
                  name={item.symbol as any}
                  size={active ? 34 : 32}
                  tintColor={active ? DP.colors.primary : "#E9E0D8"}
                  style={styles.symbol}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
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
    height: 94,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,2,2,0.995)",
    paddingHorizontal: 10,
  },

  item: {
    flex: 1,
    minWidth: 0,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: 5,
  },

  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 38,
    height: 3,
    borderRadius: 99,
    backgroundColor: DP.colors.primary,
    shadowColor: DP.colors.primary,
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },

  iconStage: {
    width: 46,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
  },

  symbol: {
    width: 35,
    height: 35,
  },

  label: {
    color: "#D8D0C8",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 2,
  },

  labelActive: {
    color: DP.colors.primary,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.96 }],
  },
});
