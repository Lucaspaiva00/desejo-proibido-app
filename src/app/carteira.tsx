import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
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
    return <View style={styles.center}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={DP.colors.gold} onRefresh={() => { setRefreshing(true); carregar(); }} />}
      >
        <Text style={styles.brand}>DESEJO PROIBIDO</Text>
        <Text style={styles.kicker}>CARTEIRA</Text>
        <Text style={styles.title}>Seu saldo</Text>
        <Text style={styles.subtitle}>Gerencie seus créditos, minutos e benefícios.</Text>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHalo} />
          <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
          <View style={styles.balanceRow}>
            <View style={styles.coinMark}><Text style={styles.coinMarkText}>D+</Text></View>
            <View>
              <Text style={styles.balanceValue}>{dpNumber(saldo)}</Text>
              <Text style={styles.balanceUnit}>créditos</Text>
            </View>
          </View>
          <View style={styles.updatedRow}><View style={styles.updatedDot} /><Text style={styles.updatedText}>Atualizado agora</Text></View>
          <Pressable style={styles.buyButton} onPress={() => router.push("/creditos")}>
            <Text style={styles.buyButtonText}>Comprar créditos</Text>
            <Text style={styles.buyButtonArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.minutesCard}>
          <View style={styles.minutesIcon}><Text style={styles.minutesIconText}>◉</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.minutesValue}>{dpNumber(minutos)}</Text>
            <Text style={styles.minutesLabel}>minutos de live</Text>
          </View>
          <Text style={styles.minutesGhost}>♡</Text>
        </View>

        <Text style={styles.sectionLabel}>ACESSO RÁPIDO</Text>
        <View style={styles.quickRow}>
          <QuickCard icon="◉" title="Assistir lives" subtitle="Criadoras ao vivo" onPress={() => router.push("/lives")} />
          <QuickCard icon="♕" title="Área da Criadora" subtitle="Ganhos e saques" onPress={() => router.push("/criadora")} />
        </View>

        <View style={styles.protectedRow}>
          <Text style={styles.protectedIcon}>▣</Text>
          <Text style={styles.protectedText}>Pagamentos e saldo protegidos</Text>
        </View>
      </ScrollView>
      <DPBottomNav />
    </View>
  );
}

function QuickCard({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.78 }]} onPress={onPress}>
      <View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
      <Text style={styles.quickArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000" },
  content: { padding: 16, paddingTop: 18, paddingBottom: 104 },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  brand: { color: DP.colors.gold, fontSize: 15, fontWeight: "900", letterSpacing: 1.1 },
  kicker: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 18 },
  title: { color: "#fff", fontSize: 31, fontWeight: "900", letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: DP.colors.muted, fontSize: 12, marginTop: 4, marginBottom: 16 },
  balanceCard: { overflow: "hidden", borderRadius: 22, padding: 18, backgroundColor: "#110503", borderWidth: 1.2, borderColor: DP.colors.gold, ...DP.shadow.gold },
  balanceHalo: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(153,0,0,0.22)", right: -80, top: -80 },
  balanceLabel: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 15, marginTop: 12 },
  coinMark: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#201506", borderWidth: 2, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center", ...DP.shadow.gold },
  coinMarkText: { color: DP.colors.goldBright, fontSize: 23, fontWeight: "900" },
  balanceValue: { color: DP.colors.goldBright, fontSize: 43, fontWeight: "900", lineHeight: 48, letterSpacing: -1.4 },
  balanceUnit: { color: "#fff", fontSize: 19, fontWeight: "700", marginTop: -2 },
  updatedRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 13, marginLeft: 4 },
  updatedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DP.colors.success },
  updatedText: { color: DP.colors.muted, fontSize: 10 },
  buyButton: { height: 50, borderRadius: 12, backgroundColor: DP.colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 15 },
  buyButtonText: { color: "#160E00", fontWeight: "900", fontSize: 14 },
  buyButtonArrow: { position: "absolute", right: 16, color: "#160E00", fontSize: 28, fontWeight: "300" },
  minutesCard: { minHeight: 78, borderRadius: 18, marginTop: 12, backgroundColor: "#0B0B0B", borderWidth: 1, borderColor: DP.colors.border, flexDirection: "row", alignItems: "center", padding: 14, overflow: "hidden" },
  minutesIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: DP.colors.primarySoft, borderWidth: 1, borderColor: DP.colors.borderStrong, alignItems: "center", justifyContent: "center", marginRight: 12 },
  minutesIconText: { color: DP.colors.primary, fontSize: 23 },
  minutesValue: { color: "#fff", fontSize: 25, fontWeight: "900" },
  minutesLabel: { color: DP.colors.textSoft, fontSize: 11, marginTop: 1 },
  minutesGhost: { position: "absolute", right: 10, fontSize: 63, color: "rgba(229,29,50,0.12)" },
  sectionLabel: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginTop: 20, marginBottom: 10 },
  quickRow: { flexDirection: "row", gap: 9 },
  quickCard: { flex: 1, minHeight: 122, borderRadius: 17, borderWidth: 1, borderColor: DP.colors.border, backgroundColor: "#0A0A0A", padding: 13 },
  quickIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#141414", borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center" },
  quickIconText: { color: DP.colors.gold, fontSize: 21, fontWeight: "900" },
  quickTitle: { color: "#fff", fontSize: 12, fontWeight: "900", marginTop: 9 },
  quickSubtitle: { color: DP.colors.muted, fontSize: 9, marginTop: 2 },
  quickArrow: { position: "absolute", right: 11, bottom: 7, color: DP.colors.primary, fontSize: 20 },
  protectedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18 },
  protectedIcon: { color: DP.colors.gold, fontSize: 14 },
  protectedText: { color: DP.colors.dim, fontSize: 10 },
});
