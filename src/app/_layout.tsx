import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DP_SERIF, LockHeart } from "../components/ui/dp-luxury";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";

const sections = [
  {
    title: "CONEXÕES",
    items: [
      {
        route: "lives",
        label: "Live",
        symbol: { ios: "dot.radiowaves.left.and.right", android: "sensors", web: "sensors" },
      },
      {
        route: "matches",
        label: "Matches",
        symbol: { ios: "heart.fill", android: "favorite", web: "favorite" },
      },
      {
        route: "conversas",
        label: "Conversas",
        symbol: { ios: "bubble.left.and.bubble.right.fill", android: "forum", web: "forum" },
      },
    ],
  },
  {
    title: "MINHA CONTA",
    items: [
      {
        route: "perfil",
        label: "Perfil",
        symbol: { ios: "person.crop.circle.fill", android: "account_circle", web: "account_circle" },
      },
      {
        route: "fotos",
        label: "Fotos",
        symbol: { ios: "photo.on.rectangle.angled", android: "photo_library", web: "photo_library" },
      },
      {
        route: "carteira",
        label: "Carteira",
        symbol: { ios: "wallet.bifold.fill", android: "account_balance_wallet", web: "account_balance_wallet" },
      },
      {
        route: "creditos",
        label: "Comprar créditos",
        symbol: { ios: "creditcard.fill", android: "paid", web: "paid" },
      },
    ],
  },
  {
    title: "CRIADORES E SEGURANÇA",
    items: [
      {
        route: "criadora",
        label: "Área da Criadora",
        symbol: { ios: "crown.fill", android: "workspace_premium", web: "workspace_premium" },
      },
      {
        route: "bloqueados",
        label: "Bloqueados",
        symbol: { ios: "person.crop.circle.badge.xmark", android: "person_off", web: "person_off" },
      },
    ],
  },
] as const;

function DrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const activeRoute = props.state?.routeNames?.[props.state?.index];
  const [nome, setNome] = useState("Lucas");
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

      setNome(perfil?.nome || usuario?.email?.split("@")?.[0] || "Lucas");
      setSaldo(Number(usuario?.saldoCreditos || 0));
      setVip(!!(usuario?.premiumAtivo || usuario?.isPremium));
      setFoto(principal?.url || "");
    } catch {
      // Mantém o drawer funcional mesmo se o resumo não carregar.
    }
  }

  function go(route: string) {
    props.navigation.navigate(route);
    props.navigation.closeDrawer();
  }

  return (
    <View style={styles.drawerRoot}>
      <View pointerEvents="none" style={styles.drawerRedGlow} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.drawerContent,
          {
            paddingTop: Math.max(insets.top + 24, 34),
            paddingBottom: Math.max(insets.bottom + 24, 30),
          },
        ]}
      >
        <View style={styles.brandBlock}>
          <View style={styles.brandLock}>
            <LockHeart size={88} />
          </View>
          <View style={styles.brandWords}>
            <Text style={styles.brandWord}>DESEJO</Text>
            <Text style={styles.brandWord}>PROIBIDO</Text>
          </View>
        </View>

        <View style={styles.brandDivider}>
          <View style={styles.brandFlareOuter}>
            <View style={styles.brandFlare} />
          </View>
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
                <Text style={styles.vipCrown}>♛</Text>
                <Text style={styles.vipText}>VIP</Text>
              </View>
            </View>

            <View style={styles.creditRow}>
              <View style={styles.creditCoinCircle}>
                <Text style={styles.creditCoin}>C</Text>
              </View>
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
                  <View
                    style={[
                      styles.itemIconWrap,
                      active && styles.itemIconWrapActive,
                    ]}
                  >
                    <SymbolView
                      name={item.symbol as any}
                      size={26}
                      tintColor={active ? "#F2C76A" : "#DDB059"}
                      style={styles.itemSymbol}
                    />
                  </View>

                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                    {item.label}
                  </Text>

                  {active && item.route === "lives" ? (
                    <View style={styles.liveDot} />
                  ) : (
                    <SymbolView
                      name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
                      size={22}
                      tintColor="#8F8B88"
                      style={styles.itemChevron}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        {vip ? <Text style={styles.hiddenVipState}>VIP ativo</Text> : null}
      </ScrollView>
    </View>
  );
}

export default function Layout() {
  useRealtimeNotifications();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(382, Math.round(width * 0.86));

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#010101",
          width: drawerWidth,
        },
        sceneStyle: { backgroundColor: "#000" },
        overlayColor: "rgba(0,0,0,0.74)",
        swipeEdgeWidth: 62,
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
  drawerRoot: {
    flex: 1,
    backgroundColor: "#010101",
    overflow: "hidden",
  },
  drawerRedGlow: {
    position: "absolute",
    width: 245,
    height: 720,
    borderRadius: 160,
    backgroundColor: "rgba(88,0,10,0.20)",
    right: -165,
    top: 180,
    transform: [{ rotate: "-7deg" }],
  },
  drawerContent: {
    paddingHorizontal: 26,
  },

  brandBlock: {
    minHeight: 142,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 4,
  },
  brandLock: {
    width: 94,
    alignItems: "center",
    justifyContent: "center",
  },
  brandWords: {
    marginLeft: 4,
    justifyContent: "center",
  },
  brandWord: {
    color: "#DDAE4F",
    fontFamily: DP_SERIF,
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  brandDivider: {
    height: 1,
    backgroundColor: "rgba(208,151,48,0.52)",
    marginHorizontal: 2,
    marginTop: 2,
    marginBottom: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  brandFlareOuter: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,183,55,0.04)",
  },
  brandFlare: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F7C447",
    shadowColor: "#F7C447",
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },

  profileRow: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 21,
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "#D8A33C",
    backgroundColor: "#080808",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  avatarInitial: {
    color: "#E4B44D",
    fontFamily: DP_SERIF,
    fontSize: 36,
    fontWeight: "700",
  },

  profileCopy: {
    flex: 1,
    marginLeft: 20,
    minWidth: 0,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileName: {
    flexShrink: 1,
    color: "#FFF",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
  },
  vipBadge: {
    height: 30,
    borderRadius: 6,
    backgroundColor: "#E9B949",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  vipCrown: {
    color: "#161009",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  vipText: {
    color: "#161009",
    fontSize: 13,
    fontWeight: "900",
  },
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  creditCoinCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E0AE43",
    alignItems: "center",
    justifyContent: "center",
  },
  creditCoin: {
    color: "#E0AE43",
    fontSize: 15,
    lineHeight: 17,
    fontWeight: "900",
  },
  creditText: {
    color: "#E5E0DD",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400",
  },

  section: {
    marginTop: 2,
    marginBottom: 19,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 9,
  },
  sectionTitle: {
    color: "#DDB059",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 2.4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(208,151,48,0.38)",
  },

  drawerItem: {
    minHeight: 66,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginVertical: 3,
  },
  drawerItemActive: {
    backgroundColor: "rgba(100,0,10,0.68)",
    borderWidth: 1,
    borderColor: "rgba(181,16,31,0.80)",
    shadowColor: "#C20C25",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(221,176,89,0.035)",
    borderWidth: 1,
    borderColor: "rgba(221,176,89,0.10)",
  },
  itemIconWrapActive: {
    backgroundColor: "rgba(119,5,18,0.52)",
    borderColor: "rgba(242,199,106,0.34)",
    shadowColor: "#E3A83F",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  itemSymbol: {
    width: 28,
    height: 28,
  },
  itemLabel: {
    flex: 1,
    color: "#F2EFED",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "400",
  },
  itemLabelActive: {
    color: "#FFF",
    fontWeight: "500",
  },
  itemChevron: {
    width: 22,
    height: 22,
    marginLeft: 8,
  },
  liveDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F0263D",
    marginRight: 7,
    shadowColor: "#F0263D",
    shadowOpacity: 0.80,
    shadowRadius: 8,
    elevation: 8,
  },

  hiddenVipState: {
    height: 0,
    opacity: 0,
  },
  pressed: {
    opacity: 0.74,
  },
});
