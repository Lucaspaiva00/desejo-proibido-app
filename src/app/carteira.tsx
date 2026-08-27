import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { obterCarteira } from "../services/carteira";
import { statusLives } from "../services/lives";
import { getRealtimeSocket } from "../services/liveSocket";

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E21D3D" /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor="#E21D3D" onRefresh={() => { setRefreshing(true); carregar(); }} />}
    >
      <Text style={styles.eyebrow}>CARTEIRA</Text>
      <Text style={styles.title}>Seu saldo</Text>
      <Text style={styles.subtitle}>Use seus créditos em presentes e acompanhe os minutos disponíveis para lives.</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Créditos disponíveis</Text>
        <Text style={styles.balanceValue}>{saldo}</Text>
        <Text style={styles.balanceHint}>Atualização em tempo real</Text>
      </View>

      <View style={styles.minuteCard}>
        <Text style={styles.minuteLabel}>Minutos para assistir lives</Text>
        <Text style={styles.minuteValue}>{minutos}</Text>
      </View>

      <TouchableOpacity style={styles.primary} onPress={() => router.push("/creditos")}>
        <Text style={styles.primaryText}>Comprar créditos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => router.push("/lives")}>
        <Text style={styles.secondaryText}>Ver lives agora</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => router.push("/criadora")}>
        <Text style={styles.secondaryText}>Área da Criadora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050205" },
  content: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, backgroundColor: "#050205", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#E21D3D", fontSize: 12, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 31, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#92858A", lineHeight: 20, marginTop: 6, marginBottom: 18 },
  balanceCard: { backgroundColor: "#260A11", borderRadius: 22, padding: 22, borderWidth: 1, borderColor: "#75152A" },
  balanceLabel: { color: "#D7B8C1", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  balanceValue: { color: "#fff", fontSize: 46, fontWeight: "900", marginTop: 6 },
  balanceHint: { color: "#B88996", marginTop: 5, fontSize: 12 },
  minuteCard: { backgroundColor: "#0F0709", borderRadius: 18, padding: 17, marginTop: 12, borderWidth: 1, borderColor: "#241116" },
  minuteLabel: { color: "#8F8287", fontSize: 12, fontWeight: "800" },
  minuteValue: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 4 },
  primary: { backgroundColor: "#E21D3D", borderRadius: 15, padding: 16, alignItems: "center", marginTop: 16 },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondary: { backgroundColor: "#11080B", borderRadius: 15, padding: 15, alignItems: "center", marginTop: 9, borderWidth: 1, borderColor: "#291219" },
  secondaryText: { color: "#DCCFD3", fontWeight: "800" },
});
