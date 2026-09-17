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
import { EmptyState } from "../components/ui/dp-ui";
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
      <View style={styles.loading}>
        <View style={styles.loaderMark}><View style={styles.loaderDot} /></View>
        <ActivityIndicator size="small" color={DP.colors.gold} />
        <Text style={styles.loadingText}>Encontrando conexões para você...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.page}>
        <View style={styles.emptyWrap}>
          <EmptyState title="Você viu todos os perfis" text="Atualize para buscar novas conexões disponíveis." />
          <Pressable style={styles.reloadButton} onPress={carregar}>
            <Text style={styles.reloadText}>Buscar novamente</Text>
          </Pressable>
        </View>
        <DPBottomNav />
      </View>
    );
  }

  const nome = usuario?.perfil?.nome || "Perfil";
  const idade = usuario?.perfil?.idade || usuario?.idade || null;
  const cidade = usuario?.perfil?.cidade || "";
  const estado = usuario?.perfil?.estado || "";
  const bio = usuario?.perfil?.bio || "";
  const inicial = nome.charAt(0).toUpperCase();

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View style={styles.brandLock}>
          <Text style={styles.brandHeart}>♡</Text>
          <View style={styles.keyhole} />
        </View>
        <Text style={styles.brandText}>DESEJO PROIBIDO</Text>
        <Pressable style={styles.topAction} onPress={carregar}>
          <Text style={styles.topActionText}>↻</Text>
        </Pressable>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000" },
  loading: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 12 },
  loaderMark: { width: 66, height: 66, borderRadius: 22, borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center", backgroundColor: DP.colors.goldSoft },
  loaderDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: DP.colors.primary },
  loadingText: { color: DP.colors.muted, fontSize: 12 },
  topbar: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "rgba(233,185,73,0.14)" },
  brandLock: { width: 30, height: 30, borderRadius: 11, borderWidth: 1.4, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center", marginRight: 8 },
  brandHeart: { color: DP.colors.gold, fontSize: 19, fontWeight: "900", lineHeight: 22 },
  keyhole: { position: "absolute", width: 6, height: 8, borderRadius: 4, backgroundColor: DP.colors.primary },
  brandText: { color: DP.colors.gold, fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
  topAction: { position: "absolute", right: 14, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: DP.colors.borderGold },
  topActionText: { color: DP.colors.gold, fontSize: 18 },

  categoriesScroll: { flexGrow: 0, height: 92, backgroundColor: "#000" },
  categories: { paddingHorizontal: 10, height: 92, alignItems: "stretch" },
  categoryItem: { width: 92, alignItems: "center", justifyContent: "center", position: "relative", paddingTop: 8 },
  categoryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#121212", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  categoryIconActive: { backgroundColor: "rgba(229,29,50,0.16)", borderColor: DP.colors.primary },
  categoryGlyph: { color: DP.colors.gold, fontSize: 20, fontWeight: "800" },
  categoryGlyphActive: { color: DP.colors.primary },
  categoryLabel: { color: "#777", fontSize: 10, marginTop: 6, fontWeight: "700", textAlign: "center" },
  categoryLabelActive: { color: DP.colors.textSoft },
  categoryLine: { position: "absolute", bottom: 0, width: 48, height: 2, borderRadius: 2, backgroundColor: DP.colors.gold },

  stage: { flex: 1, paddingBottom: 78, backgroundColor: "#000" },
  photo: { flex: 1, width: "100%", backgroundColor: "#111", overflow: "hidden" },
  photoShadeTop: { position: "absolute", left: 0, right: 0, top: 0, height: 120, backgroundColor: "rgba(0,0,0,0.16)" },
  photoShadeBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 250, backgroundColor: "rgba(0,0,0,0.62)" },
  boostBadge: { position: "absolute", top: 16, left: 16, borderRadius: 999, backgroundColor: "rgba(229,29,50,0.92)", paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  boostBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  profilePanel: { position: "absolute", left: 18, right: 92, bottom: 28 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DP.colors.gold },
  onlineText: { color: DP.colors.gold, fontSize: 12, fontWeight: "800" },
  name: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -0.8, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  location: { color: "#E3DBD7", fontSize: 12, marginTop: 4, fontWeight: "700" },
  bio: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20, marginTop: 7, fontWeight: "600" },
  actionsRail: { position: "absolute", right: 18, bottom: 24, gap: 12 },
  actionButton: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", borderWidth: 1.2 },
  likeButton: { backgroundColor: DP.colors.primary, borderColor: "rgba(255,255,255,0.16)", ...DP.shadow.primary },
  goldButton: { backgroundColor: "rgba(255,255,255,0.92)", borderColor: DP.colors.gold },
  darkButton: { backgroundColor: "rgba(10,10,10,0.86)", borderColor: "rgba(255,255,255,0.14)" },
  likeGlyph: { color: "#fff", fontSize: 28 },
  goldGlyph: { color: DP.colors.goldDark, fontSize: 25 },
  skipGlyph: { color: "#fff", fontSize: 34, lineHeight: 36, fontWeight: "200" },
  longPressHint: { position: "absolute", top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 5 },
  longPressText: { color: "rgba(255,255,255,0.45)", fontSize: 9 },
  noPhoto: { flex: 1, backgroundColor: "#0B0B0B", borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center", padding: 30 },
  noPhotoCircle: { width: 92, height: 92, borderRadius: 46, backgroundColor: DP.colors.goldSoft, borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center" },
  noPhotoInitial: { color: DP.colors.gold, fontSize: 34, fontWeight: "900" },
  noPhotoTitle: { color: "#fff", fontSize: 27, fontWeight: "900", marginTop: 16 },
  noPhotoText: { color: DP.colors.muted, textAlign: "center", marginTop: 7, lineHeight: 19 },
  actionsNoPhoto: { flexDirection: "row", gap: 18, marginTop: 26 },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 18, paddingBottom: 80 },
  reloadButton: { height: 54, borderRadius: 16, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", marginTop: 12, ...DP.shadow.primary },
  reloadText: { color: "#fff", fontWeight: "900" },
});
