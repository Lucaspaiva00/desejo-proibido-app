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
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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
    return (
      <LuxuryScreen>
        <View style={styles.center}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={DP.colors.gold} onRefresh={() => { setRefreshing(true); carregar(); }} />}
      >
        <Eyebrow>CARTEIRA</Eyebrow>
        <Text style={styles.title}>Seu saldo</Text>
        <Text style={styles.subtitle}>Gerencie seus créditos, minutos e benefícios</Text>

        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
          <View style={styles.balanceRow}>
            <View style={styles.coinOuter}>
              <View style={styles.coinInner}>
                <Text style={styles.coinText}>D+</Text>
              </View>
            </View>
            <View>
              <Text style={styles.balanceValue}>{dpNumber(saldo)}</Text>
              <Text style={styles.balanceUnit}>créditos</Text>
            </View>
          </View>
          <View style={styles.updatedRow}>
            <View style={styles.updatedDot} />
            <Text style={styles.updatedText}>Atualizado agora</Text>
          </View>

          <Pressable onPress={() => router.push("/creditos")} style={({ pressed }) => [styles.buyButton, pressed && styles.pressed]}>
            <Text style={styles.buyButtonText}>Comprar créditos</Text>
            <Text style={styles.buyButtonArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.minutesRow}>
          <View style={styles.minutesOrb}>
            <View style={styles.minutesDot} />
          </View>
          <View>
            <Text style={styles.minutesValue}>{dpNumber(minutos)}</Text>
            <Text style={styles.minutesLabel}>minutos de live</Text>
          </View>
        </View>

        <Eyebrow>ACESSO RÁPIDO</Eyebrow>
        <View style={styles.quickRow}>
          <QuickCard icon="▶" title="Assistir lives" subtitle="Criadora ao vivo" onPress={() => router.push("/lives")} />
          <QuickCard icon="♛" title="Área da Criadora" subtitle="Ganhos e saques" onPress={() => router.push("/criadora")} />
        </View>

        <View style={styles.securityRow}>
          <Text style={styles.securityIcon}>◇</Text>
          <Text style={styles.securityText}>Pagamentos e saldo protegidos</Text>
        </View>
      </ScrollView>
      <DPBottomNav />
    </LuxuryScreen>
  );
}

function QuickCard({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
      <Text style={styles.quickArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 112 },
  title: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "700",
    marginTop: 16,
    letterSpacing: -1.2,
  },
  subtitle: { color: "#8F8986", fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 24 },
  balanceCard: {
    overflow: "hidden",
    borderRadius: 26,
    padding: 22,
    backgroundColor: "#1A0304",
    borderWidth: 1.3,
    borderColor: "#F3C95E",
    shadowColor: "#E51D32",
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 10,
  },
  balanceGlow: {
    position: "absolute",
    width: 330,
    height: 260,
    borderRadius: 170,
    backgroundColor: "rgba(176,0,21,0.22)",
    right: -120,
    top: -90,
  },
  balanceLabel: { color: "#F1D78B", fontSize: 12, fontWeight: "800", letterSpacing: 3.2 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 20 },
  coinOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "#F7D36B",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120C05",
    shadowColor: "#F3C95E",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  coinInner: {
    width: 77,
    height: 77,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "#8F6417",
    alignItems: "center",
    justifyContent: "center",
  },
  coinText: { color: "#F5D36D", fontFamily: DP_SERIF, fontSize: 32, fontWeight: "800" },
  balanceValue: { color: "#FFD36F", fontFamily: DP_SERIF, fontSize: 56, lineHeight: 58, fontWeight: "800", letterSpacing: -1.8 },
  balanceUnit: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "700", marginTop: -2 },
  updatedRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  updatedDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#2FE26E", shadowColor: "#2FE26E", shadowOpacity: 0.6, shadowRadius: 7 },
  updatedText: { color: "#A7A09C", fontSize: 13 },
  buyButton: {
    height: 60,
    borderRadius: 29,
    marginTop: 22,
    backgroundColor: "#A9071C",
    borderWidth: 1.2,
    borderColor: "#F5D36D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  buyButtonText: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 19, fontWeight: "800" },
  buyButtonArrow: { position: "absolute", right: 20, color: "#F7D36B", fontSize: 30, fontWeight: "200" },
  minutesRow: { minHeight: 116, flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 8, marginVertical: 18 },
  minutesOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(80,0,10,0.14)",
  },
  minutesDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: DP.colors.primary, shadowColor: DP.colors.primary, shadowOpacity: 0.7, shadowRadius: 10 },
  minutesValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 42, lineHeight: 44, fontWeight: "700" },
  minutesLabel: { color: "#C8C0BA", fontSize: 13, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  quickCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.58)",
    backgroundColor: "rgba(8,7,6,0.94)",
    padding: 16,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1C95D",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120D07",
  },
  quickIconText: { color: "#F2CD70", fontSize: 21, fontWeight: "800" },
  quickTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700", marginTop: 14 },
  quickSubtitle: { color: "#8F8986", fontSize: 11, marginTop: 3 },
  quickArrow: { position: "absolute", right: 14, bottom: 15, color: "#F2CD70", fontSize: 27 },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22 },
  securityIcon: { color: "#F2CD70", fontSize: 14 },
  securityText: { color: "#756F6C", fontSize: 10 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
