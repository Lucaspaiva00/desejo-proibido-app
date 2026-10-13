import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockHeart, LuxuryBackground } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";

const sections = [
  {
    title: "CONEXÕES",
    items: [
      { route: "feed", label: "Feed", icon: "◇" },
      { route: "lives", label: "Lives", icon: "◉" },
      { route: "matches", label: "Matches", icon: "♡" },
      { route: "conversas", label: "Conversas", icon: "◯" },
    ],
  },
  {
    title: "MEU PERFIL",
    items: [
      { route: "perfil", label: "Meu perfil", icon: "♙" },
      { route: "fotos", label: "Minhas fotos", icon: "▧" },
    ],
  },
  {
    title: "SALDO E CRÉDITOS",
    items: [
      { route: "carteira", label: "Carteira", icon: "▱" },
      { route: "creditos", label: "Comprar créditos", icon: "◎" },
    ],
  },
  {
    title: "PRIVACIDADE",
    items: [
      { route: "criadora", label: "Área da Criadora", icon: "☆" },
      { route: "bloqueados", label: "Bloqueados", icon: "⊘" },
    ],
  },
] as const;

function DrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const activeRoute = props.state?.routeNames?.[props.state?.index];

  function go(route: string) {
    props.navigation.navigate(route);
    props.navigation.closeDrawer();
  }

  return (
    <View style={styles.drawerRoot}>
      <LuxuryBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.drawerContent, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: Math.max(insets.bottom + 24, 30) }]}
      >
        <View style={styles.drawerBrand}>
          <LockHeart size={54} />
          <Text style={styles.drawerBrandText}>Desejo Proibido</Text>
          <Pressable onPress={() => props.navigation.closeDrawer()} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
            {section.items.map((item) => {
              const active = activeRoute === item.route;
              return (
                <Pressable
                  key={item.route}
                  onPress={() => go(item.route)}
                  style={({ pressed }) => [styles.drawerItem, active && styles.drawerItemActive, pressed && styles.pressed]}
                >
                  <View style={[styles.itemIconWrap, active && styles.itemIconWrapActive]}>
                    <Text style={[styles.itemIcon, active && styles.itemIconActive]}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                  <Text style={[styles.itemArrow, active && styles.itemArrowActive]}>›</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Text style={styles.version}>Versão 1.0</Text>
      </ScrollView>
    </View>
  );
}

export default function Layout() {
  useRealtimeNotifications();

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: "#020202", width: 326 },
        sceneStyle: { backgroundColor: DP.colors.background },
        overlayColor: "rgba(0,0,0,0.68)",
        swipeEdgeWidth: 46,
      }}
    >
      <Drawer.Screen name="feed" options={{ title: "Feed" }} />
      <Drawer.Screen name="lives" options={{ title: "Lives" }} />
      <Drawer.Screen name="matches" options={{ title: "Matches" }} />
      <Drawer.Screen name="conversas" options={{ title: "Conversas" }} />
      <Drawer.Screen name="perfil" options={{ title: "Meu perfil" }} />
      <Drawer.Screen name="fotos" options={{ title: "Minhas fotos" }} />
      <Drawer.Screen name="carteira" options={{ title: "Carteira" }} />
      <Drawer.Screen name="creditos" options={{ title: "Comprar créditos" }} />
      <Drawer.Screen name="criadora" options={{ title: "Área da Criadora" }} />
      <Drawer.Screen name="bloqueados" options={{ title: "Bloqueados" }} />

      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="home" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="cadastro" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="usuario" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen
        name="chat"
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
          title: "Conversa",
          headerStyle: { backgroundColor: "#050505" },
          headerTintColor: "#F2CD70",
          headerTitleStyle: { color: "#FFF", fontWeight: "800" },
          headerShadowVisible: false,
        }}
      />
      <Drawer.Screen
        name="videochamada"
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
          title: "Videochamada",
          headerStyle: { backgroundColor: "#050505" },
          headerTintColor: "#F2CD70",
          headerTitleStyle: { color: "#FFF", fontWeight: "800" },
          headerShadowVisible: false,
        }}
      />
      <Drawer.Screen
        name="transmitir"
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
          title: "Transmitir ao vivo",
          headerStyle: { backgroundColor: "#050505" },
          headerTintColor: "#F2CD70",
          headerTitleStyle: { color: "#FFF", fontWeight: "800" },
          headerShadowVisible: false,
        }}
      />
      <Drawer.Screen
        name="live/[id]"
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
          title: "Ao vivo",
          headerStyle: { backgroundColor: "#050505" },
          headerTintColor: "#F2CD70",
          headerTitleStyle: { color: "#FFF", fontWeight: "800" },
          headerShadowVisible: false,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerRoot: { flex: 1, backgroundColor: "#020202", overflow: "hidden" },
  drawerContent: { paddingHorizontal: 18 },
  drawerBrand: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(233,185,73,0.2)",
    marginBottom: 12,
  },
  drawerBrandText: {
    flex: 1,
    color: "#F4D07A",
    fontFamily: "serif",
    fontSize: 27,
    fontWeight: "700",
    marginLeft: 8,
  },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#F4D07A", fontSize: 38, fontWeight: "200", lineHeight: 40 },
  section: { marginTop: 18 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 7, paddingHorizontal: 8 },
  sectionTitle: { color: "#EBC66F", fontSize: 10, fontWeight: "800", letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(233,185,73,0.34)" },
  drawerItem: {
    minHeight: 58,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginVertical: 2,
  },
  drawerItemActive: {
    backgroundColor: "rgba(139,5,24,0.46)",
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.28)",
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemIconWrapActive: {
    borderWidth: 1,
    borderColor: DP.colors.primary,
    borderRadius: 20,
    backgroundColor: "rgba(229,29,50,0.12)",
  },
  itemIcon: { color: "#F3EEE9", fontSize: 28, fontWeight: "300" },
  itemIconActive: { color: DP.colors.primary },
  itemLabel: { flex: 1, color: "#F4F0ED", fontSize: 16, fontWeight: "600" },
  itemLabelActive: { color: "#FFF8F5", fontWeight: "800" },
  itemArrow: { color: "#8E8580", fontSize: 30, fontWeight: "200" },
  itemArrowActive: { color: DP.colors.primary },
  version: { color: "#77716E", fontSize: 11, marginTop: 34, paddingHorizontal: 10 },
  pressed: { opacity: 0.72 },
});
