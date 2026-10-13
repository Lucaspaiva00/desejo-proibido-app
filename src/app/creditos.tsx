import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { criarCheckout, listarPacotes } from "../services/pagamentos";

export default function Creditos() {
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState("");

  async function carregar() {
    try {
      const data = await listarPacotes();
      setPacotes(data || []);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar os pacotes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function comprar(packId: string) {
    try {
      setComprando(packId);
      const checkout = await criarCheckout(packId);
      await WebBrowser.openBrowserAsync(checkout.initPoint);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível iniciar a compra");
    } finally {
      setComprando("");
    }
  }

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <View style={styles.content}>
        <Eyebrow>CRÉDITOS</Eyebrow>
        <Text style={styles.title}>Escolha seu pacote</Text>
        <Text style={styles.subtitle}>Adicione créditos à carteira para aproveitar mais recursos da plataforma.</Text>

        <FlatList
          data={pacotes}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.coin}><Text style={styles.coinText}>D+</Text></View>
              <View style={styles.cardInfo}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.creditos}>{item.creditos} créditos</Text>
                <Text style={styles.preco}>
                  {(Number(item.valorCentavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </Text>
              </View>
              <Pressable
                disabled={comprando === item.id}
                onPress={() => comprar(item.id)}
                style={({ pressed }) => [styles.button, pressed && styles.pressed, comprando === item.id && styles.disabled]}
              >
                <Text style={styles.buttonText}>{comprando === item.id ? "..." : "Comprar"}</Text>
                <Text style={styles.buttonArrow}>›</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum pacote disponível</Text>
              <Text style={styles.emptyText}>Atualize novamente em alguns instantes.</Text>
            </View>
          }
        />
      </View>
      <DPBottomNav />
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 36, lineHeight: 40, fontWeight: "700", marginTop: 14 },
  subtitle: { color: "#8F8986", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 20 },
  list: { paddingBottom: 112 },
  card: {
    minHeight: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.6)",
    backgroundColor: "rgba(10,8,6,0.95)",
    padding: 16,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  coin: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: "#F2CD70", backgroundColor: "#151006", alignItems: "center", justifyContent: "center" },
  coinText: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "800" },
  cardInfo: { flex: 1 },
  nome: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 20, fontWeight: "700" },
  creditos: { color: "#C3BBB6", marginTop: 5, fontSize: 12 },
  preco: { color: "#F1C95D", fontFamily: DP_SERIF, fontSize: 20, fontWeight: "800", marginTop: 8 },
  button: { minWidth: 94, height: 47, borderRadius: 13, backgroundColor: "#A9071C", borderWidth: 1, borderColor: "#FF3150", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 13 },
  buttonText: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 13, fontWeight: "700" },
  buttonArrow: { color: "#F2CD70", fontSize: 21, marginLeft: 6 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 22, fontWeight: "700" },
  emptyText: { color: "#8F8986", fontSize: 12, marginTop: 6 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
