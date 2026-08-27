import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiErrorMessage } from "../services/http";
import { getRealtimeSocket } from "../services/liveSocket";
import { listarLives, LiveItem, statusLives, LiveStatus } from "../services/lives";

export default function LivesScreen() {
  const [items, setItems] = useState<LiveItem[]>([]);
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (silent = false) => {
    try {
      if (!silent) setErro("");
      const [lista, me] = await Promise.all([listarLives(), statusLives()]);
      setItems(lista);
      setStatus(me);
    } catch (e: any) {
      setErro(apiErrorMessage(e, "Não foi possível carregar as lives"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    let socket: any;
    const update = () => carregar(true);
    (async () => {
      try {
        socket = await getRealtimeSocket();
        socket.on("live:list:update", update);
      } catch (e) {
        console.log(e);
      }
    })();
    return () => socket?.off("live:list:update", update);
  }, [carregar]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E21D3D" />
        <Text style={styles.muted}>Buscando transmissões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#E21D3D"
            onRefresh={() => {
              setRefreshing(true);
              carregar(true);
            }}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>AO VIVO AGORA</Text>
                <Text style={styles.title}>Lives</Text>
                <Text style={styles.subtitle}>
                  Entre, participe do chat e envie presentes em tempo real.
                </Text>
              </View>
              <View style={styles.livePill}>
                <View style={styles.dot} />
                <Text style={styles.livePillText}>{items.length}</Text>
              </View>
            </View>

            {status?.podeTransmitir ? (
              <TouchableOpacity style={styles.creatorCta} onPress={() => router.push("/transmitir")}>
                <Text style={styles.creatorCtaTitle}>Você pode transmitir</Text>
                <Text style={styles.creatorCtaText}>
                  {status.liveAtiva ? "Continuar minha live" : "Abrir uma live agora"}
                </Text>
              </TouchableOpacity>
            ) : null}

            {status?.podeAssistir ? (
              <View style={styles.balanceRow}>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Minutos</Text>
                  <Text style={styles.balanceValue}>{status.minutosDisponiveis || 0}</Text>
                </View>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Créditos</Text>
                  <Text style={styles.balanceValue}>{status.saldoCreditos || 0}</Text>
                </View>
              </View>
            ) : null}

            {!!erro && <Text style={styles.error}>{erro}</Text>}
            <Text style={styles.sectionTitle}>Transmissões disponíveis</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔴</Text>
            <Text style={styles.emptyTitle}>Nenhuma live agora</Text>
            <Text style={styles.muted}>Puxe a tela para atualizar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => {
              if (status?.podeAssistir) {
                router.push({ pathname: "/live/[id]", params: { id: item.id } });
              } else {
                Alert.alert("Visualização indisponível", "Sua conta não está habilitada como espectador desta live.");
              }
            }}
          >
            {item.host?.foto ? (
              <Image source={{ uri: item.host.foto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{(item.host?.nome || "?").slice(0, 1).toUpperCase()}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.cardTop}>
                <Text numberOfLines={1} style={styles.hostName}>{item.host?.nome || "Criadora"}</Text>
                {item.host?.verificada ? <Text style={styles.verified}>✓</Text> : null}
              </View>
              <Text numberOfLines={1} style={styles.liveTitle}>{item.titulo || "Ao vivo agora"}</Text>
              <Text style={styles.metaText}>
                {item.viewersOnline || 0} assistindo
                {item.host?.cidade ? ` · ${item.host.cidade}${item.host.estado ? `/${item.host.estado}` : ""}` : ""}
              </Text>
            </View>

            <View style={styles.watchButton}>
              <Text style={styles.watchButtonText}>Entrar</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050205" },
  content: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050205", gap: 12 },
  hero: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  eyebrow: { color: "#E21D3D", fontSize: 12, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#9C9095", fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 300 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#1A0A0E", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#3A121B" },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF274C" },
  livePillText: { color: "#fff", fontWeight: "900" },
  creatorCta: { backgroundColor: "#17090D", borderColor: "#6E1728", borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14 },
  creatorCtaTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  creatorCtaText: { color: "#E21D3D", marginTop: 4, fontWeight: "700" },
  balanceRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  balanceCard: { flex: 1, backgroundColor: "#10070A", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#241016" },
  balanceLabel: { color: "#877A7F", fontSize: 12, textTransform: "uppercase", fontWeight: "800" },
  balanceValue: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 12, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#0E0709", borderWidth: 1, borderColor: "#221015", borderRadius: 20, padding: 13, marginBottom: 11 },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#1D1014" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 23, fontWeight: "900" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  hostName: { color: "#fff", fontSize: 16, fontWeight: "900", maxWidth: 180 },
  verified: { color: "#61A9FF", fontWeight: "900" },
  liveTitle: { color: "#C7BBC0", marginTop: 3, fontSize: 13 },
  metaText: { color: "#776A70", marginTop: 5, fontSize: 12 },
  watchButton: { backgroundColor: "#E21D3D", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  watchButtonText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  error: { color: "#FF8094", backgroundColor: "#2B0D14", padding: 12, borderRadius: 12, marginBottom: 14 },
  empty: { alignItems: "center", paddingVertical: 44 },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 8 },
  muted: { color: "#8D8085", marginTop: 6 },
});
