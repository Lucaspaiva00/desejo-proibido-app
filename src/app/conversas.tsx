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
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>DESEJO PROIBIDO</Text>
          <Text style={styles.title}>Conversas</Text>
        </View>
        <Pressable style={styles.composeButton} onPress={() => router.push("/matches")}>
          <Text style={styles.composeIcon}>✎</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar conversas"
          placeholderTextColor="#6E6763"
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
            <Pressable style={styles.card} onPress={() => router.push(`/chat?conversaId=${item.id}`)}>
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
                  {item?.outro?.perfilVerificado ? <Text style={styles.verified}>◆</Text> : null}
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
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>◌</Text></View>
            <Text style={styles.emptyTitle}>Nenhuma conversa aqui</Text>
            <Text style={styles.emptyText}>Quando você começar uma conversa, ela aparecerá nesta tela.</Text>
          </View>
        }
      />

      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000", paddingHorizontal: 15, paddingTop: 18 },
  loading: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  brand: { color: DP.colors.gold, fontSize: 11, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: "#fff", fontSize: 33, fontWeight: "900", letterSpacing: -0.8, marginTop: 5 },
  composeButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center" },
  composeIcon: { color: DP.colors.primary, fontSize: 23, fontWeight: "700" },
  searchWrap: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: DP.colors.borderGold, backgroundColor: "#0B0B0B", flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  searchIcon: { color: DP.colors.gold, fontSize: 21, marginRight: 8 },
  search: { flex: 1, color: "#fff", fontSize: 13 },
  tabs: { height: 42, borderRadius: 13, borderWidth: 1, borderColor: DP.colors.border, flexDirection: "row", overflow: "hidden", marginTop: 12, marginBottom: 15, backgroundColor: "#070707" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: DP.colors.primaryDark },
  tabText: { color: "#9F9691", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  list: { paddingBottom: 100 },
  card: { minHeight: 82, borderRadius: 17, backgroundColor: "#080808", borderWidth: 1, borderColor: "rgba(233,185,73,0.18)", padding: 10, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  avatar: { width: 58, height: 58, borderRadius: 29, marginRight: 11, borderWidth: 1, borderColor: DP.colors.gold },
  avatarFallback: { backgroundColor: "#17120A", alignItems: "center", justifyContent: "center" },
  avatarText: { color: DP.colors.gold, fontSize: 21, fontWeight: "900" },
  info: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { color: "#fff", fontSize: 15, fontWeight: "900", maxWidth: "58%" },
  verified: { color: DP.colors.gold, fontSize: 10 },
  time: { marginLeft: "auto", color: DP.colors.muted, fontSize: 10 },
  message: { color: "#B7AEAA", fontSize: 12, marginTop: 5, maxWidth: "93%" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
  onlineWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DP.colors.success },
  onlineText: { color: DP.colors.success, fontSize: 10, fontWeight: "700" },
  location: { color: DP.colors.dim, fontSize: 10 },
  lock: { color: DP.colors.gold, fontSize: 9, fontWeight: "700" },
  unread: { width: 26, height: 26, borderRadius: 13, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 7 },
  unreadText: { color: "#fff", fontWeight: "900", fontSize: 10 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 25 },
  emptyIcon: { width: 66, height: 66, borderRadius: 24, borderWidth: 1, borderColor: DP.colors.borderGold, backgroundColor: DP.colors.goldSoft, alignItems: "center", justifyContent: "center" },
  emptyIconText: { color: DP.colors.gold, fontSize: 30 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 15 },
  emptyText: { color: DP.colors.muted, textAlign: "center", lineHeight: 18, fontSize: 12, marginTop: 5 },
});
