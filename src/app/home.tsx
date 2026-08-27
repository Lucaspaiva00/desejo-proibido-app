import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { buscarUsuarioLogado } from "../services/auth";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try { setUsuario(await buscarUsuarioLogado()); }
      catch (error) { console.log(error); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#E21D3D" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>DESEJO PROIBIDO</Text>
      <Text style={styles.title}>Olá{usuario?.perfil?.nome ? `, ${usuario.perfil.nome}` : ""}</Text>
      <Text style={styles.subtitle}>Escolha onde quer entrar.</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricLabel}>Plano</Text><Text style={styles.metricValue}>{usuario?.isPremium ? "Premium" : "Free"}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>Créditos</Text><Text style={styles.metricValue}>{usuario?.saldoCreditos ?? 0}</Text></View>
      </View>

      <TouchableOpacity style={styles.liveButton} onPress={() => router.push("/lives")}>
        <Text style={styles.liveIcon}>🔴</Text>
        <View style={{ flex: 1 }}><Text style={styles.buttonTitle}>Lives agora</Text><Text style={styles.buttonSub}>Assista ou abra sua transmissão</Text></View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/feed")}><Text style={styles.buttonTitle}>Descobrir pessoas</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/conversas")}><Text style={styles.buttonTitle}>Conversas</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/criadora")}><Text style={styles.buttonTitle}>Área da Criadora</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#050205", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#050205", padding: 20, paddingTop: 64 },
  eyebrow: { color: "#E21D3D", fontSize: 12, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 31, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#8E8186", marginTop: 5, marginBottom: 20 },
  metrics: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metric: { flex: 1, backgroundColor: "#0F0709", borderRadius: 15, padding: 14, borderWidth: 1, borderColor: "#241116" },
  metricLabel: { color: "#81757A", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  metricValue: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 4 },
  liveButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#2A0A11", padding: 17, borderRadius: 17, marginBottom: 10, borderWidth: 1, borderColor: "#80192E" },
  liveIcon: { fontSize: 22 },
  button: { backgroundColor: "#10080A", padding: 17, borderRadius: 17, marginBottom: 10, borderWidth: 1, borderColor: "#241116" },
  buttonTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  buttonSub: { color: "#B797A1", fontSize: 12, marginTop: 3 },
});
