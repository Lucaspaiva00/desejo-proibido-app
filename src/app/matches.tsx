import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { buscarMatches } from "../services/matches";

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregar() {
    try {
      const data = await buscarMatches();
      setMatches(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const matchesFiltrados = matches.filter((item) => {
    const perfil = item.outro?.perfil;
    return `${perfil?.nome || ""} ${perfil?.cidade || ""}`.toLowerCase().includes(busca.toLowerCase());
  });

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={DP.colors.gold} />
        </View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <View style={styles.content}>
        <Eyebrow>CONEXÕES</Eyebrow>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Seus Matches</Text>
            <Text style={styles.subtitle}>Pessoas que também escolheram você.</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{matches.length}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Buscar por nome ou cidade"
            placeholderTextColor="#79716C"
            value={busca}
            onChangeText={setBusca}
            style={styles.search}
          />
        </View>

        <FlatList
          data={matchesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const perfil = item.outro?.perfil;
            const foto = item.outro?.fotos?.[0]?.url;
            const nome = perfil?.nome || "Usuário";
            const idade = perfil?.idade || item.outro?.idade;
            return (
              <View style={styles.card}>
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]}>
                    <Text style={styles.fallbackText}>{nome.charAt(0).toUpperCase()}</Text>
                  </View>
                )}

                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>{nome}{idade ? `, ${idade}` : ""}</Text>
                    {item.outro?.perfilVerificado ? <Text style={styles.verified}>●</Text> : null}
                  </View>
                  <Text style={styles.location}>
                    {perfil?.cidade || "Localização não informada"}
                    {perfil?.estado ? ` • ${perfil.estado}` : ""}
                  </Text>

                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [styles.chatBtn, pressed && styles.pressed]}
                      onPress={() => router.push(`/chat?conversaId=${item.conversaId}`)}
                    >
                      <Text style={styles.chatBtnText}>Conversar</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.profileBtn, pressed && styles.pressed]}
                      onPress={() => router.push(`/usuario?id=${item.outro.id}`)}
                    >
                      <Text style={styles.profileBtnText}>Ver perfil</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyHeart}><Text style={styles.emptyHeartText}>♡</Text></View>
              <Text style={styles.emptyTitle}>Nenhum match encontrado</Text>
              <Text style={styles.emptyText}>Novas conexões aparecem aqui quando o interesse acontece dos dois lados.</Text>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 14, marginBottom: 20 },
  title: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.9,
  },
  subtitle: { color: "#8F8986", fontSize: 14, marginTop: 5 },
  countBadge: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "rgba(120,0,18,0.28)",
    borderWidth: 1,
    borderColor: DP.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  countText: { color: DP.colors.primary, fontFamily: DP_SERIF, fontSize: 18, fontWeight: "800" },
  searchWrap: {
    height: 62,
    borderRadius: 17,
    backgroundColor: "rgba(7,6,5,0.92)",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.65)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: { color: "#F2CD70", fontSize: 24, marginRight: 10 },
  search: { flex: 1, color: "#fff", fontSize: 14 },
  list: { paddingBottom: 112 },
  card: {
    minHeight: 202,
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.55)",
    backgroundColor: "rgba(8,7,6,0.94)",
    padding: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  photo: { width: 137, height: 176, borderRadius: 14, backgroundColor: "#161616" },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.5)",
    backgroundColor: "#120C07",
  },
  fallbackText: { color: "#F3C963", fontFamily: DP_SERIF, fontSize: 45, fontWeight: "800" },
  info: { flex: 1, paddingLeft: 14, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 23, fontWeight: "700", maxWidth: "88%" },
  verified: { color: DP.colors.primary, fontSize: 10 },
  location: { color: "#8F8986", fontSize: 13, marginTop: 4 },
  actions: { gap: 9, marginTop: 18 },
  chatBtn: {
    height: 48,
    borderRadius: 13,
    backgroundColor: "#A8061C",
    borderWidth: 1,
    borderColor: "#FF3150",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 5,
  },
  chatBtnText: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 15, fontWeight: "800" },
  profileBtn: {
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EDBD4D",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  profileBtnText: { color: "#F0CE77", fontFamily: DP_SERIF, fontSize: 14, fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 78, paddingHorizontal: 28 },
  emptyHeart: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: DP.colors.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233,185,73,0.06)",
  },
  emptyHeartText: { color: DP.colors.gold, fontSize: 50 },
  emptyTitle: { color: "#fff", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "700", marginTop: 20 },
  emptyText: { color: "#8F8986", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
