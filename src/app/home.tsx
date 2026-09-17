import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { BrandMark, Kicker, PrimaryButton, SecondaryButton, StatCard } from "../components/ui/dp-ui";
import { DP, dpNumber } from "../constants/dp-theme";
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

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.primary} /></View>;
  }

  const nome = usuario?.perfil?.nome?.split(" ")?.[0] || "você";

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandMark compact />

        <View style={styles.hero}>
          <Kicker>SEU ESPAÇO</Kicker>
          <Text style={styles.title}>Boa escolha te ver por aqui, {nome}.</Text>
          <Text style={styles.subtitle}>Descubra novas conexões, acompanhe lives e mantenha tudo em um só lugar.</Text>
        </View>

        <View style={styles.metrics}>
          <StatCard label="Seu plano" value={usuario?.isPremium ? "Premium" : "Free"} helper="Status atual" accent={!!usuario?.isPremium} />
          <StatCard label="Créditos" value={dpNumber(usuario?.saldoCreditos)} helper="Disponíveis" />
        </View>

        <View style={styles.featureCard}>
          <View style={styles.liveDot} />
          <Text style={styles.featureKicker}>AO VIVO</Text>
          <Text style={styles.featureTitle}>Entre onde a conversa está acontecendo agora.</Text>
          <Text style={styles.featureText}>Lives com chat, presentes, metas e interação em tempo real.</Text>
          <PrimaryButton title="Ver lives agora" subtitle="Descubra quem está online" onPress={() => router.push("/lives")} />
        </View>

        <Text style={styles.sectionTitle}>Atalhos</Text>
        <View style={styles.shortcuts}>
          <SecondaryButton title="Descobrir pessoas" onPress={() => router.push("/feed")} />
          <SecondaryButton title="Minhas conversas" onPress={() => router.push("/conversas")} />
          <SecondaryButton title="Carteira e créditos" onPress={() => router.push("/carteira")} />
          <SecondaryButton title="Área da Criadora" onPress={() => router.push("/criadora")} />
        </View>
      </ScrollView>
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: DP.colors.background, justifyContent: "center", alignItems: "center" },
  page: { flex: 1, backgroundColor: DP.colors.background },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 110 },
  hero: { marginTop: 34, marginBottom: 20 },
  title: { color: DP.colors.text, fontSize: 33, lineHeight: 37, fontWeight: "900", letterSpacing: -1.1, marginTop: 8 },
  subtitle: { color: DP.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 390 },
  metrics: { flexDirection: "row", gap: 10, marginBottom: 16 },
  featureCard: {
    position: "relative",
    backgroundColor: "#1A0C11",
    borderRadius: DP.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    overflow: "hidden",
    ...DP.shadow.card,
  },
  liveDot: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,45,85,0.09)", right: -60, top: -70 },
  featureKicker: { color: DP.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  featureTitle: { color: DP.colors.text, fontSize: 24, lineHeight: 28, fontWeight: "900", letterSpacing: -0.6, marginTop: 8, maxWidth: 320 },
  featureText: { color: DP.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18, maxWidth: 330 },
  sectionTitle: { color: DP.colors.text, fontSize: 19, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  shortcuts: { gap: 9 },
});
