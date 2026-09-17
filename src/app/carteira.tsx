import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { Kicker, PrimaryButton, SecondaryButton, StatCard } from "../components/ui/dp-ui";
import { DP, dpNumber } from "../constants/dp-theme";
import { obterCarteira } from "../services/carteira";
import { getRealtimeSocket } from "../services/liveSocket";
import { statusLives } from "../services/lives";

export default function Carteira() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [minutos, setMinutos] = useState(0);

  const carregar = useCallback(async () => {
    try {
      const [wallet, status] = await Promise.all([obterCarteira(), statusLives()]);
      setSaldo(Number(wallet?.saldoCreditos || 0));
      setMinutos(Number(status?.minutosDisponiveis || 0));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    let socket: any;
    const walletUpdate = (p: any) => p?.saldoCreditos != null && setSaldo(Number(p.saldoCreditos));
    (async () => {
      try {
        socket = await getRealtimeSocket();
        socket.on("wallet:update", walletUpdate);
      } catch {}
    })();
    return () => socket?.off("wallet:update", walletUpdate);
  }, [carregar]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={DP.colors.primary} /></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={DP.colors.primary} onRefresh={() => { setRefreshing(true); carregar(); }} />}
      >
        <Kicker>CARTEIRA</Kicker>
        <Text style={styles.title}>Seu saldo, sem complicação.</Text>
        <Text style={styles.subtitle}>Créditos para interações e minutos para acompanhar transmissões ao vivo.</Text>

        <View style={styles.heroBalance}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>CRÉDITOS DISPONÍVEIS</Text>
          <Text style={styles.balanceValue}>{dpNumber(saldo)}</Text>
          <Text style={styles.balanceHint}>Saldo atualizado em tempo real</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Minutos" value={dpNumber(minutos)} helper="Para assistir lives" />
          <StatCard label="Status" value="Ativo" helper="Carteira disponível" accent />
        </View>

        <View style={styles.buyCard}>
          <Text style={styles.buyKicker}>RECARREGAR</Text>
          <Text style={styles.buyTitle}>Quer continuar interagindo?</Text>
          <Text style={styles.buyText}>Adicione créditos para presentes e mantenha minutos disponíveis para lives.</Text>
          <PrimaryButton title="Comprar créditos" subtitle="Ver pacotes disponíveis" onPress={() => router.push("/creditos")} />
        </View>

        <Text style={styles.sectionTitle}>Acesso rápido</Text>
        <View style={styles.quickList}>
          <SecondaryButton title="Ver lives agora" onPress={() => router.push("/lives")} />
          <SecondaryButton title="Área da Criadora" onPress={() => router.push("/criadora")} />
        </View>
      </ScrollView>
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DP.colors.background },
  content: { padding: 18, paddingTop: 22, paddingBottom: 112 },
  center: { flex: 1, backgroundColor: DP.colors.background, alignItems: "center", justifyContent: "center" },
  title: { color: DP.colors.text, fontSize: 31, lineHeight: 35, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  subtitle: { color: DP.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 20, maxWidth: 360 },
  heroBalance: {
    overflow: "hidden",
    backgroundColor: "#1E0C12",
    borderRadius: DP.radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    ...DP.shadow.card,
  },
  balanceGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,45,85,0.11)", right: -80, top: -90 },
  balanceLabel: { color: "#DDBCC7", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  balanceValue: { color: DP.colors.text, fontSize: 52, lineHeight: 59, fontWeight: "900", letterSpacing: -1.8, marginTop: 7 },
  balanceHint: { color: DP.colors.muted, fontSize: 11, marginTop: 5 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  buyCard: {
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.xl,
    borderWidth: 1,
    borderColor: DP.colors.border,
    padding: 18,
    marginTop: 16,
  },
  buyKicker: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  buyTitle: { color: DP.colors.text, fontSize: 22, fontWeight: "900", marginTop: 8, letterSpacing: -0.4 },
  buyText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 15 },
  sectionTitle: { color: DP.colors.text, fontSize: 19, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  quickList: { gap: 9 },
});
