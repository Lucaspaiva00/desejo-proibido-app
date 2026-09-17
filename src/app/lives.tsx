import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { EmptyState, Kicker, Pill, PrimaryButton, StatCard } from "../components/ui/dp-ui";
import { DP, dpNumber } from "../constants/dp-theme";
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

  function abrir(item: LiveItem) {
    if (status?.podeAssistir) {
      router.push({ pathname: "/live/[id]", params: { id: item.id } });
      return;
    }
    Alert.alert("Visualização indisponível", "Sua conta não está habilitada como espectador desta live.");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DP.colors.primary} />
        <Text style={styles.muted}>Preparando as transmissões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={DP.colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              carregar(true);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Kicker>AO VIVO AGORA</Kicker>
                <Text style={styles.title}>Entre na conversa.</Text>
                <Text style={styles.subtitle}>Transmissões em tempo real com chat, presentes e interação direta.</Text>
              </View>
              <Pill tone="primary">● {items.length} online</Pill>
            </View>

            {status?.podeTransmitir ? (
              <View style={styles.creatorCard}>
                <View style={styles.creatorGlow} />
                <Pill tone="gold">CREATOR</Pill>
                <Text style={styles.creatorTitle}>{status.liveAtiva ? "Sua live está ativa" : "Pronta para aparecer?"}</Text>
                <Text style={styles.creatorText}>{status.liveAtiva ? "Volte para sua transmissão e continue de onde parou." : "Abra sua câmera e comece uma nova transmissão agora."}</Text>
                <PrimaryButton
                  title={status.liveAtiva ? "Voltar para minha live" : "Iniciar uma live"}
                  subtitle="Câmera, chat, meta e presentes"
                  onPress={() => router.push("/transmitir")}
                />
              </View>
            ) : null}

            {status?.podeAssistir ? (
              <View style={styles.balanceRow}>
                <StatCard label="Minutos" value={dpNumber(status.minutosDisponiveis)} helper="Para assistir" />
                <StatCard label="Créditos" value={dpNumber(status.saldoCreditos)} helper="Para interagir" accent />
              </View>
            ) : null}

            {!!erro ? <Text style={styles.error}>{erro}</Text> : null}
            <Text style={styles.sectionTitle}>Transmissões disponíveis</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="Tudo tranquilo por enquanto" text="Nenhuma criadora está ao vivo agora. Puxe a tela para atualizar." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => abrir(item)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.media}>
              {item.host?.foto ? (
                <Image source={{ uri: item.host.foto }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoFallback}>
                  <Text style={styles.avatarText}>{(item.host?.nome || "?").slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.mediaShade} />
              <View style={styles.liveTag}><View style={styles.dot} /><Text style={styles.liveTagText}>AO VIVO</Text></View>
              <View style={styles.viewerTag}><Text style={styles.viewerTagText}>{item.viewersOnline || 0} assistindo</Text></View>
              <View style={styles.mediaCopy}>
                <View style={styles.hostRow}>
                  <Text numberOfLines={1} style={styles.hostName}>{item.host?.nome || "Criadora"}</Text>
                  {item.host?.verificada ? <Text style={styles.verified}>✓</Text> : null}
                </View>
                <Text numberOfLines={1} style={styles.liveTitle}>{item.titulo || "Ao vivo agora"}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationText}>
                  {item.host?.cidade ? `${item.host.cidade}${item.host.estado ? ` • ${item.host.estado}` : ""}` : "Localização privada"}
                </Text>
                <Text style={styles.cardHint}>Toque para entrar na transmissão</Text>
              </View>
              <View style={styles.enterButton}><Text style={styles.enterButtonText}>Entrar</Text><Text style={styles.enterArrow}>›</Text></View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.content}
      />
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DP.colors.background },
  content: { padding: 18, paddingTop: 22, paddingBottom: 112 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: DP.colors.background, gap: 10 },
  muted: { color: DP.colors.muted, marginTop: 4 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
  title: { color: DP.colors.text, fontSize: 31, lineHeight: 35, fontWeight: "900", letterSpacing: -1, marginTop: 7 },
  subtitle: { color: DP.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 290 },
  creatorCard: {
    overflow: "hidden",
    backgroundColor: "#1A0D11",
    borderRadius: DP.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    marginBottom: 14,
    ...DP.shadow.card,
  },
  creatorGlow: { position: "absolute", width: 170, height: 170, borderRadius: 85, right: -50, top: -70, backgroundColor: "rgba(244,196,106,0.06)" },
  creatorTitle: { color: DP.colors.text, fontSize: 22, fontWeight: "900", marginTop: 13, letterSpacing: -0.5 },
  creatorText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 15 },
  balanceRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  sectionTitle: { color: DP.colors.text, fontSize: 19, fontWeight: "900", marginBottom: 12, marginTop: 4 },
  card: {
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: DP.colors.border,
    marginBottom: 14,
    ...DP.shadow.card,
  },
  media: { height: 218, backgroundColor: DP.colors.surface2, position: "relative" },
  photo: { width: "100%", height: "100%" },
  photoFallback: { flex: 1, backgroundColor: "#281019", alignItems: "center", justifyContent: "center" },
  avatarText: { color: DP.colors.text, fontSize: 48, fontWeight: "900" },
  mediaShade: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.22)" },
  liveTag: { position: "absolute", left: 13, top: 13, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,5,8,0.82)", borderRadius: DP.radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DP.colors.primary },
  liveTagText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  viewerTag: { position: "absolute", right: 13, top: 13, backgroundColor: "rgba(10,5,8,0.72)", borderRadius: DP.radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  viewerTagText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  mediaCopy: { position: "absolute", left: 14, right: 14, bottom: 14 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  hostName: { color: "#fff", fontSize: 22, fontWeight: "900", maxWidth: 260, textShadowColor: "rgba(0,0,0,0.7)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  verified: { color: DP.colors.info, fontWeight: "900", fontSize: 17 },
  liveTitle: { color: "rgba(255,255,255,0.88)", marginTop: 3, fontSize: 13, fontWeight: "700" },
  cardBottom: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 15, paddingVertical: 12 },
  locationText: { color: DP.colors.textSoft, fontSize: 12, fontWeight: "800" },
  cardHint: { color: DP.colors.dim, fontSize: 11, marginTop: 4 },
  enterButton: { flexDirection: "row", alignItems: "center", backgroundColor: DP.colors.primary, borderRadius: DP.radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  enterButtonText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  enterArrow: { color: "#fff", fontSize: 20, marginLeft: 5, marginTop: -1 },
  error: { color: DP.colors.danger, backgroundColor: "rgba(255,99,122,0.08)", borderWidth: 1, borderColor: "rgba(255,99,122,0.22)", padding: 12, borderRadius: DP.radius.md, marginBottom: 14 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
