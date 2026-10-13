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
import { DP_SERIF, Eyebrow, GoldButton, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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
      <LuxuryScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DP.colors.gold} />
          <Text style={styles.muted}>Preparando as transmissões...</Text>
        </View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={DP.colors.gold}
            onRefresh={() => {
              setRefreshing(true);
              carregar(true);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <Eyebrow>AO VIVO</Eyebrow>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Lives</Text>
                <Text style={styles.subtitle}>Transmissões em tempo real, presentes e interação direta.</Text>
              </View>
              <View style={styles.onlinePill}><View style={styles.dot} /><Text style={styles.onlinePillText}>{items.length} online</Text></View>
            </View>

            {status?.podeTransmitir ? (
              <View style={styles.creatorCard}>
                <View style={styles.creatorGlow} />
                <Text style={styles.creatorKicker}>CREATOR</Text>
                <Text style={styles.creatorTitle}>{status.liveAtiva ? "Sua live está ativa" : "Pronta para aparecer?"}</Text>
                <Text style={styles.creatorText}>
                  {status.liveAtiva ? "Volte para sua transmissão e continue de onde parou." : "Abra sua câmera e comece uma nova transmissão agora."}
                </Text>
                <GoldButton
                  title={status.liveAtiva ? "Voltar para minha live" : "Iniciar uma live"}
                  onPress={() => router.push("/transmitir")}
                  red
                />
              </View>
            ) : null}

            {status?.podeAssistir ? (
              <View style={styles.balanceRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>MINUTOS</Text>
                  <Text style={styles.statValue}>{dpNumber(status.minutosDisponiveis)}</Text>
                  <Text style={styles.statHelper}>Para assistir</Text>
                </View>
                <View style={[styles.stat, styles.statAccent]}>
                  <Text style={styles.statLabel}>CRÉDITOS</Text>
                  <Text style={styles.statValue}>{dpNumber(status.saldoCreditos)}</Text>
                  <Text style={styles.statHelper}>Para interagir</Text>
                </View>
              </View>
            ) : null}

            {!!erro ? <Text style={styles.error}>{erro}</Text> : null}
            <Text style={styles.sectionTitle}>Transmissões disponíveis</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyLive}><Text style={styles.emptyLiveText}>◉</Text></View>
            <Text style={styles.emptyTitle}>Tudo tranquilo por enquanto</Text>
            <Text style={styles.emptyText}>Nenhuma criadora está ao vivo agora. Puxe a tela para atualizar.</Text>
          </View>
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
                  {item.host?.verificada ? <Text style={styles.verified}>●</Text> : null}
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
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#8F8986", marginTop: 4 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 13, marginBottom: 20 },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 38, lineHeight: 42, fontWeight: "700" },
  subtitle: { color: "#8F8986", fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 280 },
  onlinePill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(229,29,50,0.46)", backgroundColor: "rgba(118,0,17,0.25)" },
  onlinePillText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  creatorCard: { overflow: "hidden", backgroundColor: "rgba(27,7,10,0.96)", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "rgba(233,185,73,0.46)", marginBottom: 14 },
  creatorGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, right: -60, top: -75, backgroundColor: "rgba(229,29,50,0.1)" },
  creatorKicker: { color: "#F2CD70", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  creatorTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "700", marginTop: 11 },
  creatorText: { color: "#9C9591", fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 15 },
  balanceRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  stat: { flex: 1, minHeight: 103, borderRadius: 17, borderWidth: 1, borderColor: "rgba(233,185,73,0.24)", backgroundColor: "rgba(9,7,6,0.94)", padding: 14 },
  statAccent: { borderColor: "rgba(229,29,50,0.4)", backgroundColor: "rgba(93,0,14,0.22)" },
  statLabel: { color: "#9A918B", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  statValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 25, fontWeight: "700", marginTop: 5 },
  statHelper: { color: "#746D69", fontSize: 10, marginTop: 3 },
  sectionTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 21, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: "rgba(8,7,6,0.96)", borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(233,185,73,0.34)", marginBottom: 14 },
  media: { height: 228, backgroundColor: "#111", position: "relative" },
  photo: { width: "100%", height: "100%" },
  photoFallback: { flex: 1, backgroundColor: "#241012", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 52, fontWeight: "800" },
  mediaShade: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.24)" },
  liveTag: { position: "absolute", left: 13, top: 13, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(78,0,11,0.85)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(229,29,50,0.5)" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DP.colors.primary },
  liveTagText: { color: "#FFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  viewerTag: { position: "absolute", right: 13, top: 13, backgroundColor: "rgba(4,4,4,0.75)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  viewerTagText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  mediaCopy: { position: "absolute", left: 15, right: 15, bottom: 14 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hostName: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "700", maxWidth: 260, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7 },
  verified: { color: DP.colors.primary, fontSize: 10 },
  liveTitle: { color: "rgba(255,255,255,0.88)", marginTop: 3, fontSize: 12, fontWeight: "700" },
  cardBottom: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 15, paddingVertical: 12 },
  locationText: { color: "#ECE4DE", fontSize: 11, fontWeight: "800" },
  cardHint: { color: "#746D69", fontSize: 10, marginTop: 4 },
  enterButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#A9071C", borderWidth: 1, borderColor: "#FF3150", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10 },
  enterButtonText: { color: "#FFF", fontFamily: DP_SERIF, fontWeight: "700", fontSize: 12 },
  enterArrow: { color: "#F2CD70", fontSize: 20, marginLeft: 5, marginTop: -1 },
  error: { color: "#FFD1D7", backgroundColor: "rgba(130,0,17,0.25)", borderWidth: 1, borderColor: "rgba(229,29,50,0.3)", padding: 12, borderRadius: 13, marginBottom: 14 },
  empty: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 26 },
  emptyLive: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, borderColor: "#EBC65D", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(233,185,73,0.06)" },
  emptyLiveText: { color: DP.colors.primary, fontSize: 34 },
  emptyTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 23, fontWeight: "700", marginTop: 18 },
  emptyText: { color: "#8F8986", textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 6 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
});
