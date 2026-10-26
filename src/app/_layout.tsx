import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockHeart, LuxuryBackground } from "../components/ui/dp-luxury";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";

const sections = [
  {
    title: "CONEXÕES",
    items: [
      { route: "lives", label: "Live", icon: "◉" },
      { route: "matches", label: "Matches", icon: "♡" },
      { route: "conversas", label: "Conversas", icon: "◌" },
    ],
  },
  {
    title: "MINHA CONTA",
    items: [
      { route: "perfil", label: "Perfil", icon: "♙" },
      { route: "fotos", label: "Fotos", icon: "▧" },
      { route: "carteira", label: "Carteira", icon: "▱" },
      { route: "creditos", label: "Comprar créditos", icon: "◎" },
    ],
  },
  {
    title: "CRIADORES E SEGURANÇA",
    items: [
      { route: "criadora", label: "Área da Criadora", icon: "♕" },
      { route: "bloqueados", label: "Bloqueados", icon: "⊘" },
    ],
  },
] as const;

function DrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const activeRoute = props.state?.routeNames?.[props.state?.index];
  const [nome, setNome] = useState("Perfil");
  const [saldo, setSaldo] = useState(0);
  const [vip, setVip] = useState(false);
  const [foto, setFoto] = useState("");

  useEffect(() => {
    carregarResumo();
  }, []);

  async function authHeader() {
    const token = await obterToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function carregarResumo() {
    try {
      const headers = await authHeader();
      const [perfilRes, usuarioRes, fotosRes] = await Promise.all([
        api.get("/perfil/me", { headers }),
        api.get("/usuarios/me", { headers }),
        api.get("/fotos/minhas", { headers }),
      ]);

      const perfil = perfilRes.data || {};
      const usuario = usuarioRes.data || {};
      const fotos = Array.isArray(fotosRes.data) ? fotosRes.data : [];
      const principal = fotos.find((item: any) => item?.principal) || fotos[0];

      setNome(perfil?.nome || usuario?.email?.split("@")?.[0] || "Perfil");
      setSaldo(Number(usuario?.saldoCreditos || 0));
      setVip(!!(usuario?.premiumAtivo || usuario?.isPremium));
      setFoto(principal?.url || "");
    } catch {
      // O menu continua utilizável mesmo se o resumo não carregar.
    }
  }

  function go(route: string) {
    props.navigation.navigate(route);
    props.navigation.closeDrawer();
  }

  return (
    <View style={styles.drawerRoot}>
      <LuxuryBackground />
      <View style={styles.drawerShade} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.drawerContent,
          {
            paddingTop: Math.max(insets.top + 18, 28),
            paddingBottom: Math.max(insets.bottom + 24, 30),
          },
        ]}
      >
        <View style={styles.drawerBrand}>
          <LockHeart size={76} />
          <View style={styles.drawerBrandCopy}>
            <Text style={styles.drawerBrandGold}>DESEJO</Text>
            <Text style={styles.drawerBrandRed}>PROIBIDO</Text>
          </View>
        </View>

        <View style={styles.brandDivider}>
          <View style={styles.brandFlare} />
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarRing}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{nome.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.profileCopy}>
            <View style={styles.profileNameRow}>
              <Text numberOfLines={1} style={styles.profileName}>{nome}</Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipCrown}>♕</Text>
                <Text style={styles.vipText}>{vip ? "VIP" : "VIP"}</Text>
              </View>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditCoin}>Ⓒ</Text>
              <Text style={styles.creditText}>{saldo.toLocaleString("pt-BR")} créditos</Text>
            </View>
          </View>
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
                  style={({ pressed }) => [
                    styles.drawerItem,
                    active && styles.drawerItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.itemIconWrap}>
                    <Text style={[styles.itemIcon, active && styles.itemIconActive]}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                  {active && item.route === "lives" ? <View style={styles.liveDot} /> : <Text style={styles.itemArrow}>›</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
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
        drawerStyle: {
          backgroundColor: "#020202",
          width: 360,
        },
        sceneStyle: { backgroundColor: "#000" },
        overlayColor: "rgba(0,0,0,0.76)",
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="feed" options={{ title: "Descobrir" }} />
      <Drawer.Screen name="lives" options={{ title: "Live" }} />
      <Drawer.Screen name="matches" options={{ title: "Matches" }} />
      <Drawer.Screen name="conversas" options={{ title: "Conversas" }} />
      <Drawer.Screen name="perfil" options={{ title: "Perfil" }} />
      <Drawer.Screen name="fotos" options={{ title: "Fotos" }} />
      <Drawer.Screen name="carteira" options={{ title: "Carteira" }} />
      <Drawer.Screen name="creditos" options={{ title: "Comprar créditos" }} />
      <Drawer.Screen name="criadora" options={{ title: "Área da Criadora" }} />
      <Drawer.Screen name="bloqueados" options={{ title: "Bloqueados" }} />

      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="home" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="cadastro" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="recuperar-senha" options={{ drawerItemStyle: { display: "none" } }} />
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
  drawerShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  drawerContent: { paddingHorizontal: 22 },
  drawerBrand: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  drawerBrandCopy: { marginLeft: 10 },
  drawerBrandGold: {
    color: "#E9B949",
    fontFamily: "serif",
    fontSize: 31,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  drawerBrandRed: {
    color: "#E51D32",
    fontFamily: "serif",
    fontSize: 31,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  brandDivider: {
    height: 1,
    backgroundColor: "rgba(233,185,73,0.42)",
    marginHorizontal: 4,
    marginBottom: 22,
    alignItems: "center",
  },
  brandFlare: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -4,
    backgroundColor: "#F5C95C",
    shadowColor: "#F5C95C",
    shadowOpacity: 0.9,
    shadowRadius: 9,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 24,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#D9A936",
    backgroundColor: "#090909",
    overflow: "hidden",
    shadowColor: "#E9B949",
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  avatarInitial: { color: "#E9B949", fontFamily: "serif", fontSize: 34, fontWeight: "800" },
  profileCopy: { flex: 1, marginLeft: 17 },
  profileNameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileName: { maxWidth: 142, color: "#FFF", fontSize: 24, fontWeight: "800" },
  vipBadge: {
    minWidth: 62,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#F0C24B",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  vipCrown: { color: "#171009", fontSize: 14, fontWeight: "900" },
  vipText: { color: "#171009", fontSize: 13, fontWeight: "900" },
  creditRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 11 },
  creditCoin: { color: "#E9B949", fontSize: 23, fontWeight: "800" },
  creditText: { color: "#E7E1DC", fontSize: 16, fontWeight: "500" },
  section: { marginTop: 8, marginBottom: 11 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 6, marginBottom: 8 },
  sectionTitle: { color: "#EBC66F", fontSize: 11, fontWeight: "800", letterSpacing: 2.8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(233,185,73,0.38)" },
  drawerItem: {
    minHeight: 64,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginVertical: 2,
  },
  drawerItemActive: {
    backgroundColor: "rgba(128,0,15,0.60)",
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.56)",
    shadowColor: "#E51D32",
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  itemIconWrap: { width: 54, alignItems: "flex-start", justifyContent: "center" },
  itemIcon: { color: "#E9B949", fontSize: 31, fontWeight: "300" },
  itemIconActive: { color: "#F3C95E" },
  itemLabel: { flex: 1, color: "#F7F4F1", fontSize: 18, fontWeight: "500" },
  itemLabelActive: { color: "#FFF", fontWeight: "600" },
  itemArrow: { color: "#A6A2A0", fontSize: 34, fontWeight: "200" },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F42A43",
    marginRight: 8,
    shadowColor: "#F42A43",
    shadowOpacity: 0.7,
    shadowRadius: 7,
  },
  pressed: { opacity: 0.72 },
});
