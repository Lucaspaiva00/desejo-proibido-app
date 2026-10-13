import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { listarConversas } from "../services/chat";

const filtros = ["Todas", "Não lidas", "Online"] as const;
type Filtro = (typeof filtros)[number];

export default function Conversas() {
  const [loading, setLoading] = useState(true);
  const [conversas, setConversas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todas");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const lista = await listarConversas();
      setConversas(lista || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function nome(item: any) {
    return item?.outro?.perfil?.nome || item?.outro?.nome || item?.outro?.email || "Usuário";
  }

  function foto(item: any) {
    return item?.outro?.fotos?.find((f: any) => f.principal)?.url || item?.outro?.fotos?.[0]?.url || null;
  }

  function ultimaMensagem(item: any) {
    return item?.ultimaMensagem?.textoExibido || item?.ultimaMensagem?.texto || "Sem mensagens ainda";
  }

  const lista = useMemo(() => {
    return conversas.filter((item) => {
      const texto = `${nome(item)} ${item?.outro?.perfil?.cidade || ""}`.toLowerCase();
      if (!texto.includes(busca.toLowerCase())) return false;
      if (filtro === "Não lidas") return Number(item?.naoLidas || item?.mensagensNaoLidas || 0) > 0;
      if (filtro === "Online") return !!item?.outro?.online;
      return true;
    });
  }, [conversas, busca, filtro]);

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader
        action={
          <Pressable style={styles.composeButton} onPress={() => router.push("/matches")}>
            <Text style={styles.composeIcon}>＋</Text>
          </Pressable>
        }
      />

      <View style={styles.content}>
        <Eyebrow>CONVERSAS</Eyebrow>
        <Text style={styles.title}>Mensagens</Text>
        <Text style={styles.subtitle}>Suas conexões em um espaço privado.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar conversas"
            placeholderTextColor="#746D69"
            style={styles.search}
          />
        </View>

        <View style={styles.tabs}>
          {filtros.map((item) => {
            const active = item === filtro;
            return (
              <Pressable key={item} onPress={() => setFiltro(item)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={lista}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const avatar = foto(item);
            const unread = Number(item?.naoLidas || item?.mensagensNaoLidas || 0);
            return (
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => router.push(`/chat?conversaId=${item.id}`)}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{nome(item).charAt(0).toUpperCase()}</Text>
                  </View>
                )}

                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text numberOfLines={1} style={styles.name}>{nome(item)}</Text>
                    {item?.outro?.perfilVerificado ? <Text style={styles.verified}>●</Text> : null}
                    <Text style={styles.time}>{item?.ultimaMensagem?.criadoEm ? "Recente" : ""}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.message}>{ultimaMensagem(item)}</Text>
                  <View style={styles.bottomRow}>
                    {item?.outro?.online ? (
                      <View style={styles.onlineWrap}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Online</Text></View>
                    ) : (
                      <Text style={styles.location}>{item?.outro?.perfil?.cidade || ""}</Text>
                    )}
                    {!item.chatLiberado ? <Text style={styles.lock}>Acesso restrito</Text> : null}
                  </View>
                </View>

                {unread > 0 ? (
                  <View style={styles.unread}><Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text></View>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>◯</Text></View>
              <Text style={styles.emptyTitle}>Nenhuma conversa aqui</Text>
              <Text style={styles.emptyText}>Quando você começar uma conversa, ela aparecerá nesta tela.</Text>
            </View>
          }
        />
      </View>

      <DPBottomNav />
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  composeButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#F0C960", alignItems: "center", justifyContent: "center" },
  composeIcon: { color: DP.colors.primary, fontSize: 24, fontWeight: "400" },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 36, lineHeight: 40, fontWeight: "700", marginTop: 14 },
  subtitle: { color: "#8F8986", fontSize: 13, marginTop: 4, marginBottom: 18 },
  searchWrap: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.56)",
    backgroundColor: "rgba(8,7,6,0.94)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchIcon: { color: "#F1CC6E", fontSize: 23, marginRight: 9 },
  search: { flex: 1, color: "#FFF", fontSize: 13 },
  tabs: { flexDirection: "row", gap: 7, marginTop: 13, marginBottom: 16 },
  tab: { flex: 1, height: 39, borderRadius: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(11,9,8,0.9)", alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: "rgba(135,0,18,0.48)", borderColor: DP.colors.primary },
  tabText: { color: "#9F9691", fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: "#FFF" },
  list: { paddingBottom: 106 },
  card: { minHeight: 88, borderRadius: 17, backgroundColor: "rgba(8,7,6,0.95)", borderWidth: 1, borderColor: "rgba(233,185,73,0.18)", padding: 11, marginBottom: 9, flexDirection: "row", alignItems: "center" },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12, borderWidth: 1.5, borderColor: "#EBC65D" },
  avatarFallback: { backgroundColor: "#171108", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#EBC65D", fontFamily: DP_SERIF, fontSize: 23, fontWeight: "800" },
  info: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700", maxWidth: "60%" },
  verified: { color: DP.colors.primary, fontSize: 9 },
  time: { marginLeft: "auto", color: "#8A827D", fontSize: 9 },
  message: { color: "#B7AEAA", fontSize: 12, marginTop: 5, maxWidth: "93%" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
  onlineWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DP.colors.success },
  onlineText: { color: DP.colors.success, fontSize: 9, fontWeight: "700" },
  location: { color: "#746D69", fontSize: 9 },
  lock: { color: "#EBC65D", fontSize: 9, fontWeight: "700" },
  unread: { minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 7 },
  unreadText: { color: "#FFF", fontWeight: "900", fontSize: 10 },
  empty: { alignItems: "center", paddingTop: 78, paddingHorizontal: 25 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: "#EBC65D", backgroundColor: "rgba(233,185,73,0.06)", alignItems: "center", justifyContent: "center" },
  emptyIconText: { color: "#EBC65D", fontSize: 37 },
  emptyTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 22, fontWeight: "700", marginTop: 16 },
  emptyText: { color: "#8F8986", textAlign: "center", lineHeight: 18, fontSize: 12, marginTop: 6 },
  pressed: { opacity: 0.7 },
});
