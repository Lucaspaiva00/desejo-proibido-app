import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, LuxuryBrand, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { buscarPerfilPublico } from "../services/usuarios";

type Aba = "CONTEUDO" | "SOBRE" | "FOTOS";

export default function Usuario() {
  const { id } = useLocalSearchParams();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("CONTEUDO");

  async function carregar() {
    try {
      const data = await buscarPerfilPublico(String(id));
      setPerfil(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  if (!perfil) {
    return (
      <LuxuryScreen>
        <SafeAreaView style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Perfil não encontrado</Text>
          <Pressable onPress={() => router.back()} style={styles.backSimple}><Text style={styles.backSimpleText}>Voltar</Text></Pressable>
        </SafeAreaView>
      </LuxuryScreen>
    );
  }

  const nome = perfil.perfil?.nome || "Perfil";
  const cidade = perfil.perfil?.cidade || "";
  const estado = perfil.perfil?.estado || "";
  const bio = perfil.perfil?.bio || "Mais que fotos, são momentos reais.";
  const fotos = perfil.fotos || [];
  const principal = perfil.fotoPrincipal || fotos.find((foto: any) => foto.principal)?.url || fotos[0]?.url;
  const idade = perfil.perfil?.idade || perfil.idade;

  return (
    <LuxuryScreen>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>
          <LuxuryBrand compact centered />
          <Pressable style={styles.headerButton}>
            <Text style={styles.more}>⋮</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.avatarRing}>
            {principal ? (
              <Image source={{ uri: principal }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{nome.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{nome}</Text>
            {perfil.perfilVerificado ? <Text style={styles.verified}>●</Text> : null}
          </View>
          <Text style={styles.role}>{perfil.creatorStatus === "APROVADA" ? "Criadora de Conteúdo" : "Perfil Desejo Proibido"}</Text>
          <Text style={styles.bio}>{bio}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{fotos.length}</Text><Text style={styles.statLabel}>Fotos</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{idade || "—"}</Text><Text style={styles.statLabel}>Idade</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{perfil.perfilVerificado ? "✓" : "—"}</Text><Text style={styles.statLabel}>Verificado</Text></View>
          </View>

          <Pressable style={({ pressed }) => [styles.mainAction, pressed && styles.pressed]} onPress={() => router.back()}>
            <Text style={styles.mainActionText}>Voltar ao feed</Text>
          </Pressable>

          <View style={styles.tabs}>
            {([
              ["CONTEUDO", "Conteúdo"],
              ["SOBRE", "Sobre"],
              ["FOTOS", "Fotos"],
            ] as const).map(([value, label]) => (
              <Pressable key={value} style={[styles.tab, aba === value && styles.tabActive]} onPress={() => setAba(value)}>
                <Text style={[styles.tabText, aba === value && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {aba === "SOBRE" ? (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Sobre {nome}</Text>
              <Text style={styles.aboutText}>{bio}</Text>
              {!!(cidade || estado) ? <Text style={styles.aboutLocation}>{cidade}{estado ? ` • ${estado}` : ""}</Text> : null}
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              numColumns={3}
              data={fotos}
              keyExtractor={(item) => String(item.id)}
              columnWrapperStyle={styles.galleryRow}
              renderItem={({ item }) => (
                <View style={styles.galleryCard}>
                  <Image source={{ uri: item.url }} style={styles.galleryPhoto} />
                  {aba === "CONTEUDO" ? (
                    <View style={styles.contentBadge}>
                      <Text style={styles.contentBadgeText}>♡</Text>
                    </View>
                  ) : null}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyGallery}>
                  <Text style={styles.emptyGalleryText}>Este perfil ainda não publicou fotos.</Text>
                </View>
              }
            />
          )}
        </ScrollView>
      </SafeAreaView>
      <DPBottomNav />
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  notFoundTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 26, fontWeight: "700" },
  backSimple: { marginTop: 20, borderWidth: 1, borderColor: "#EBC65D", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backSimpleText: { color: "#F1CD70", fontWeight: "800" },
  header: { height: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerButtonText: { color: "#F1CD70", fontSize: 40, lineHeight: 42, fontWeight: "200" },
  more: { color: "#FFF", fontSize: 28, lineHeight: 30 },
  content: { paddingHorizontal: 20, paddingBottom: 110, alignItems: "center" },
  avatarRing: { width: 166, height: 166, borderRadius: 83, borderWidth: 2, borderColor: "#F2CD70", padding: 5, marginTop: 8, shadowColor: "#F2CD70", shadowOpacity: 0.26, shadowRadius: 14, elevation: 7 },
  avatar: { width: "100%", height: "100%", borderRadius: 78, resizeMode: "cover" },
  avatarFallback: { backgroundColor: "#18120A", alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 56, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 14 },
  name: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 29, fontWeight: "700" },
  verified: { color: "#F2CD70", fontSize: 10 },
  role: { color: "#D5C8BC", fontSize: 12, marginTop: 2 },
  bio: { color: "#EEE7E2", fontFamily: DP_SERIF, fontSize: 15, lineHeight: 21, textAlign: "center", marginTop: 6, maxWidth: 330 },
  stats: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 20, marginBottom: 17 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 21, fontWeight: "700" },
  statLabel: { color: "#B4AAA4", fontSize: 10, marginTop: 3 },
  statDivider: { width: 1, height: 35, backgroundColor: "rgba(233,185,73,0.22)" },
  mainAction: { width: "100%", height: 53, borderRadius: 15, backgroundColor: "#A9071C", borderWidth: 1, borderColor: "#FF3150", alignItems: "center", justifyContent: "center", shadowColor: DP.colors.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  mainActionText: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700" },
  tabs: { width: "100%", height: 50, flexDirection: "row", alignItems: "flex-end", marginTop: 16, borderBottomWidth: 1, borderBottomColor: "rgba(233,185,73,0.2)" },
  tab: { flex: 1, height: 48, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#F2CD70" },
  tabText: { color: "#8F8986", fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: "#FFF" },
  galleryRow: { gap: 8 },
  galleryCard: { flex: 1, height: 150, borderRadius: 12, overflow: "hidden", marginTop: 10, backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(233,185,73,0.22)" },
  galleryPhoto: { width: "100%", height: "100%", resizeMode: "cover" },
  contentBadge: { position: "absolute", left: 8, bottom: 8, width: 27, height: 27, borderRadius: 14, backgroundColor: "rgba(30,12,6,0.86)", borderWidth: 1, borderColor: "#F2CD70", alignItems: "center", justifyContent: "center" },
  contentBadgeText: { color: "#F2CD70", fontSize: 14 },
  aboutCard: { width: "100%", marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(233,185,73,0.35)", backgroundColor: "rgba(8,7,6,0.94)", padding: 18 },
  aboutTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 20, fontWeight: "700" },
  aboutText: { color: "#BBB1AA", fontSize: 13, lineHeight: 20, marginTop: 8 },
  aboutLocation: { color: "#F1CD70", fontSize: 11, fontWeight: "800", marginTop: 12 },
  emptyGallery: { width: "100%", paddingVertical: 40, alignItems: "center" },
  emptyGalleryText: { color: "#8F8986", fontSize: 12 },
  pressed: { opacity: 0.72 },
});
