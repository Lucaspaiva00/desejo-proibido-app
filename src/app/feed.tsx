import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, GoldButton, LockHeart, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import {
  bloquearUsuario,
  buscarFeed,
  curtirUsuario,
  denunciarUsuario,
  pularUsuario,
} from "../services/feed";

const categorias = ["Para conhecer", "Perto de você", "Mesmo objetivo", "Outra cidade", "Online"];

export default function Feed() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [indice, setIndice] = useState(0);
  const [categoria, setCategoria] = useState("Para conhecer");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      const dados = await buscarFeed();
      setUsuarios(dados || []);
      setIndice(0);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar o feed.");
    } finally {
      setLoading(false);
    }
  }

  const usuario = usuarios[indice];

  function proximo() {
    setIndice((old) => old + 1);
  }

  async function curtir() {
    if (!usuario) return;
    try {
      const r = await curtirUsuario(usuario.id);
      if (r?.matchCriado) Alert.alert("Match!", "Vocês curtiram um ao outro.");
      proximo();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao curtir.");
    }
  }

  async function pular() {
    if (!usuario) return;
    try {
      await pularUsuario(usuario.id);
      proximo();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao pular.");
    }
  }

  async function bloquear() {
    if (!usuario) return;
    Alert.alert("Bloquear perfil", "Deseja bloquear este perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Bloquear",
        style: "destructive",
        onPress: async () => {
          try {
            await bloquearUsuario(usuario.id);
            proximo();
          } catch (error: any) {
            Alert.alert("Erro", error?.response?.data?.erro || "Erro ao bloquear.");
          }
        },
      },
    ]);
  }

  async function denunciar() {
    if (!usuario) return;
    Alert.alert("Denunciar perfil", "Deseja denunciar este perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Denunciar",
        style: "destructive",
        onPress: async () => {
          try {
            await denunciarUsuario(usuario.id);
            Alert.alert("Denúncia enviada", "Obrigado pelo aviso.");
            proximo();
          } catch (error: any) {
            Alert.alert("Erro", error?.response?.data?.erro || "Erro ao denunciar.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}>
          <LockHeart size={76} />
          <ActivityIndicator size="small" color={DP.colors.gold} />
          <Text style={styles.loadingText}>Encontrando conexões para você...</Text>
        </View>
      </LuxuryScreen>
    );
  }

  if (!usuario) {
    return (
      <LuxuryScreen>
        <LuxuryHeader
          action={
            <Pressable onPress={carregar} style={styles.refreshSmall}>
              <Text style={styles.refreshSmallText}>↻</Text>
            </Pressable>
          }
        />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyGlow} />
          <View style={styles.emptyLines}>
            <View style={styles.emptyLine} />
            <View style={styles.lockCircle}><LockHeart size={94} /></View>
            <View style={styles.emptyLine} />
          </View>
          <Text style={styles.emptyTitle}>Você já viu todos os perfis</Text>
          <Text style={styles.emptyText}>Atualize para descobrir novas conexões disponíveis.</Text>
          <View style={styles.emptyButton}>
            <GoldButton title="Buscar novamente" onPress={carregar} red />
          </View>
        </View>
        <DPBottomNav />
      </LuxuryScreen>
    );
  }

  const nome = usuario?.perfil?.nome || "Perfil";
  const idade = usuario?.perfil?.idade || usuario?.idade || null;
  const cidade = usuario?.perfil?.cidade || "";
  const estado = usuario?.perfil?.estado || "";
  const bio = usuario?.perfil?.bio || "";
  const inicial = nome.charAt(0).toUpperCase();

  return (
    <LuxuryScreen>
      <LuxuryHeader
        action={
          <Pressable onPress={carregar} style={styles.refreshSmall}>
            <Text style={styles.refreshSmallText}>↻</Text>
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        style={styles.categoriesScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categorias.map((item) => {
          const active = categoria === item;
          return (
            <Pressable key={item} onPress={() => setCategoria(item)} style={styles.categoryItem}>
              <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                <Text style={[styles.categoryGlyph, active && styles.categoryGlyphActive]}>
                  {item === "Para conhecer" ? "♡" : item === "Perto de você" ? "⌖" : item === "Mesmo objetivo" ? "◎" : item === "Outra cidade" ? "◉" : "●"}
                </Text>
              </View>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{item}</Text>
              {active ? <View style={styles.categoryLine} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stage}>
        {usuario.fotoPrincipal ? (
          <ImageBackground source={{ uri: usuario.fotoPrincipal }} resizeMode="cover" style={styles.photo}>
            <View style={styles.photoShadeTop} />
            <View style={styles.photoShadeBottom} />

            {usuario.boostAte ? (
              <View style={styles.boostBadge}>
                <Text style={styles.boostBadgeText}>DESTAQUE</Text>
              </View>
            ) : null}

            <View style={styles.profilePanel}>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online hoje</Text>
              </View>
              <Text style={styles.name}>{nome}{idade ? `, ${idade}` : ""}</Text>
              {!!(cidade || estado) && (
                <Text style={styles.location}>{cidade}{estado ? ` • ${estado}` : ""}</Text>
              )}
              {!!bio && <Text numberOfLines={2} style={styles.bio}>{bio}</Text>}
            </View>

            <View style={styles.actionsRail}>
              <Pressable style={[styles.actionButton, styles.likeButton]} onPress={curtir}>
                <Text style={styles.likeGlyph}>♥</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.goldButton]} onPress={denunciar}>
                <Text style={styles.goldGlyph}>✦</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.darkButton]} onPress={pular}>
                <Text style={styles.skipGlyph}>×</Text>
              </Pressable>
            </View>

            <Pressable onLongPress={bloquear} style={styles.longPressHint}>
              <Text style={styles.longPressText}>Segure para bloquear</Text>
            </Pressable>
          </ImageBackground>
        ) : (
          <View style={styles.noPhoto}>
            <View style={styles.noPhotoCircle}><Text style={styles.noPhotoInitial}>{inicial}</Text></View>
            <Text style={styles.noPhotoTitle}>{nome}</Text>
            <Text style={styles.noPhotoText}>Este perfil ainda não adicionou uma foto principal.</Text>
            <View style={styles.actionsNoPhoto}>
              <Pressable style={[styles.actionButton, styles.darkButton]} onPress={pular}><Text style={styles.skipGlyph}>×</Text></Pressable>
              <Pressable style={[styles.actionButton, styles.likeButton]} onPress={curtir}><Text style={styles.likeGlyph}>♥</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      <DPBottomNav />
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: "#9C9591", fontSize: 12 },
  refreshSmall: {
    width: 37,
    height: 37,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.58)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,7,7,0.78)",
  },
  refreshSmallText: { color: "#F2CD70", fontSize: 19 },
  categoriesScroll: { flexGrow: 0, height: 90, backgroundColor: "rgba(0,0,0,0.9)" },
  categories: { paddingHorizontal: 8, height: 90, alignItems: "stretch" },
  categoryItem: { width: 90, alignItems: "center", justifyContent: "center", position: "relative", paddingTop: 5 },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconActive: { backgroundColor: "rgba(110,0,14,0.24)", borderColor: DP.colors.primary },
  categoryGlyph: { color: "#E9C96F", fontSize: 20, fontWeight: "700" },
  categoryGlyphActive: { color: DP.colors.primary },
  categoryLabel: { color: "#777", fontSize: 9, marginTop: 6, fontWeight: "700", textAlign: "center" },
  categoryLabelActive: { color: "#F4F0ED" },
  categoryLine: { position: "absolute", bottom: 0, width: 48, height: 2, borderRadius: 2, backgroundColor: "#E9B949" },
  stage: { flex: 1, paddingBottom: 82, backgroundColor: "#000" },
  photo: { flex: 1, width: "100%", backgroundColor: "#111", overflow: "hidden" },
  photoShadeTop: { position: "absolute", left: 0, right: 0, top: 0, height: 130, backgroundColor: "rgba(0,0,0,0.18)" },
  photoShadeBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 280, backgroundColor: "rgba(0,0,0,0.64)" },
  boostBadge: {
    position: "absolute",
    top: 18,
    left: 18,
    borderRadius: 999,
    backgroundColor: "rgba(145,0,19,0.94)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#F2C95F",
  },
  boostBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  profilePanel: { position: "absolute", left: 20, right: 92, bottom: 32 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F2CD70" },
  onlineText: { color: "#F2CD70", fontSize: 12, fontWeight: "800" },
  name: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 34, lineHeight: 37, fontWeight: "700", textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12 },
  location: { color: "#EFE7E0", fontSize: 12, marginTop: 5, fontWeight: "700" },
  bio: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20, marginTop: 8, fontWeight: "500" },
  actionsRail: { position: "absolute", right: 18, bottom: 26, gap: 12 },
  actionButton: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1.2 },
  likeButton: { backgroundColor: DP.colors.primary, borderColor: "#FF3653", shadowColor: DP.colors.primary, shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
  goldButton: { backgroundColor: "#F6F1E7", borderColor: "#F2CD70" },
  darkButton: { backgroundColor: "rgba(7,7,7,0.9)", borderColor: "rgba(255,255,255,0.18)" },
  likeGlyph: { color: "#FFF", fontSize: 29 },
  goldGlyph: { color: "#9C6F16", fontSize: 27 },
  skipGlyph: { color: "#FFF", fontSize: 36, lineHeight: 38, fontWeight: "200" },
  longPressHint: { position: "absolute", top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 5 },
  longPressText: { color: "rgba(255,255,255,0.48)", fontSize: 9 },
  noPhoto: { flex: 1, backgroundColor: "rgba(9,8,7,0.94)", borderWidth: 1, borderColor: "rgba(233,185,73,0.48)", alignItems: "center", justifyContent: "center", padding: 30 },
  noPhotoCircle: { width: 98, height: 98, borderRadius: 49, borderWidth: 2, borderColor: "#F2CD70", alignItems: "center", justifyContent: "center", backgroundColor: "#171108" },
  noPhotoInitial: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 42, fontWeight: "800" },
  noPhotoTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 28, fontWeight: "700", marginTop: 18 },
  noPhotoText: { color: "#8F8986", textAlign: "center", marginTop: 7, lineHeight: 19 },
  actionsNoPhoto: { flexDirection: "row", gap: 18, marginTop: 26 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 26, paddingBottom: 105 },
  emptyGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(145,0,18,0.18)",
    top: "15%",
  },
  emptyLines: { flexDirection: "row", alignItems: "center", gap: 18 },
  emptyLine: { width: 74, height: 1, backgroundColor: "rgba(233,185,73,0.65)" },
  lockCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#F0C75C",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,7,7,0.85)",
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  emptyTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 32, lineHeight: 37, fontWeight: "700", textAlign: "center", marginTop: 40 },
  emptyText: { color: "#9C9591", fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 10 },
  emptyButton: { width: "100%", marginTop: 34 },
});
