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
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>CONEXÕES</Text>
            <Text style={styles.title}>Seus Matches</Text>
            <Text style={styles.subtitle}>Pessoas que também escolheram você.</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.countText}>{matches.length}</Text></View>
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Buscar por nome ou cidade"
            placeholderTextColor="#6E6763"
            value={busca}
            onChangeText={setBusca}
            style={styles.search}
          />
        </View>

        <FlatList
          data={matchesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 110 }}
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
                    {item.outro?.perfilVerificado ? <Text style={styles.verified}>◆</Text> : null}
                  </View>
                  <Text style={styles.location}>{perfil?.cidade || "Localização não informada"}{perfil?.estado ? ` • ${perfil.estado}` : ""}</Text>
                  {item.outro?.online ? (
                    <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Online agora</Text></View>
                  ) : null}

                  <View style={styles.actions}>
                    <Pressable style={styles.chatBtn} onPress={() => router.push(`/chat?conversaId=${item.conversaId}`)}>
                      <Text style={styles.chatBtnText}>Conversar</Text>
                    </Pressable>
                    <Pressable style={styles.profileBtn} onPress={() => router.push(`/usuario?id=${item.outro.id}`)}>
                      <Text style={styles.profileBtnText}>Ver perfil</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>♡</Text></View>
              <Text style={styles.emptyTitle}>Nenhum match encontrado</Text>
              <Text style={styles.emptyText}>Novas conexões vão aparecer aqui quando houver interesse dos dois lados.</Text>
            </View>
          }
        />
      </View>
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, padding: 16, paddingTop: 20 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  headerRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 17 },
  kicker: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: DP.colors.muted, fontSize: 12, marginTop: 4 },
  countBadge: { minWidth: 40, height: 40, paddingHorizontal: 10, borderRadius: 20, backgroundColor: DP.colors.primarySoft, borderWidth: 1, borderColor: DP.colors.borderStrong, alignItems: "center", justifyContent: "center" },
  countText: { color: DP.colors.primary, fontWeight: "900" },
  searchWrap: { height: 52, borderRadius: 16, backgroundColor: "#0C0C0C", borderWidth: 1, borderColor: DP.colors.borderGold, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, marginBottom: 17 },
  searchIcon: { color: DP.colors.gold, fontSize: 22, marginRight: 8 },
  search: { flex: 1, color: "#fff", fontSize: 14 },
  card: { flexDirection: "row", minHeight: 178, backgroundColor: "#090909", borderRadius: 22, borderWidth: 1, borderColor: "rgba(233,185,73,0.22)", overflow: "hidden", marginBottom: 13, ...DP.shadow.card },
  photo: { width: 132, minHeight: 178, backgroundColor: "#151515" },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  fallbackText: { color: DP.colors.gold, fontSize: 34, fontWeight: "900" },
  info: { flex: 1, padding: 14, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#fff", fontSize: 20, fontWeight: "900", maxWidth: "86%" },
  verified: { color: DP.colors.primary, fontSize: 11 },
  location: { color: DP.colors.muted, fontSize: 12, marginTop: 4 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DP.colors.success },
  onlineText: { color: DP.colors.success, fontSize: 11, fontWeight: "700" },
  actions: { gap: 7, marginTop: 12 },
  chatBtn: { height: 38, borderRadius: 10, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", ...DP.shadow.primary },
  chatBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  profileBtn: { height: 36, borderRadius: 10, borderWidth: 1, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center" },
  profileBtnText: { color: DP.colors.gold, fontWeight: "800", fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 20 },
  emptyIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: DP.colors.goldSoft, borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center" },
  emptyIconText: { color: DP.colors.gold, fontSize: 34 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 15 },
  emptyText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 },
});
