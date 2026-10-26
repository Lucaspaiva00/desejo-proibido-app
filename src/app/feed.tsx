import { useLocalSearchParams, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { LockHeart, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { api } from "../services/api";
import {
  bloquearUsuario,
  buscarFeed,
  curtirUsuario,
  denunciarUsuario,
  pularUsuario,
} from "../services/feed";
import { obterToken } from "../storage/auth";

const PREVIEW_USER = {
  id: "__preview__",
  fotoPrincipal: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=88",
  perfil: {
    nome: "Marina Costa",
    cidade: "Salvador",
    estado: "BA",
    genero: "FEMININO",
    nascimento: "1999-04-18T00:00:00.000Z",
    bio: "Gosto de boas conversas, viagens, vinhos e aproveitar o lado bom da vida... ❤️",
    verificado: true,
  },
};

function idadeDe(nascimento?: string | Date | null) {
  if (!nascimento) return null;
  const data = new Date(nascimento);
  if (Number.isNaN(data.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const mes = hoje.getMonth() - data.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) idade -= 1;
  return idade;
}

export default function Feed() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const previewAtivo = String(preview || "") === "1";

  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [indice, setIndice] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [vip, setVip] = useState(false);
  const [meuPerfil, setMeuPerfil] = useState<any>(null);
  const [fotoCount, setFotoCount] = useState(1);
  const [modo, setModo] = useState("Descobrir");

  useEffect(() => {
    carregarResumo();
    carregar();
  }, [previewAtivo]);

  const usuario = usuarios[indice];
  const proximo1 = usuarios[indice + 1];
  const proximo2 = usuarios[indice + 2];

  useEffect(() => {
    if (!usuario || previewAtivo || usuario?.id === "__preview__") {
      setFotoCount(1);
      return;
    }
    carregarContagemFotos(usuario.id);
  }, [usuario?.id, previewAtivo]);

  async function authHeader() {
    const token = await obterToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function carregarResumo() {
    if (previewAtivo) {
      setSaldo(250);
      setVip(true);
      setMeuPerfil({ cidade: "Salvador", estado: "BA", genero: "MASCULINO" });
      return;
    }

    try {
      const headers = await authHeader();
      const [usuarioRes, perfilRes] = await Promise.all([
        api.get("/usuarios/me", { headers }),
        api.get("/perfil/me", { headers }),
      ]);
      setSaldo(Number(usuarioRes.data?.saldoCreditos || 0));
      setVip(!!(usuarioRes.data?.premiumAtivo || usuarioRes.data?.isPremium));
      setMeuPerfil(perfilRes.data || null);
    } catch {
      // O feed continua carregando mesmo sem o resumo do topo.
    }
  }

  async function carregar() {
    try {
      setLoading(true);
      if (previewAtivo) {
        setUsuarios([PREVIEW_USER, PREVIEW_USER, PREVIEW_USER]);
        setIndice(0);
        return;
      }

      const dados = await buscarFeed({ ordenarPor: "recent", take: 50 });
      setUsuarios(dados || []);
      setIndice(0);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar o feed.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarContagemFotos(id: string) {
    try {
      const headers = await authHeader();
      const { data } = await api.get(`/perfil/publico/${id}`, { headers });
      setFotoCount(Array.isArray(data?.fotos) ? Math.max(1, data.fotos.length) : 1);
    } catch {
      setFotoCount(1);
    }
  }

  function proximo() {
    setIndice((old) => old + 1);
  }

  async function curtir() {
    if (!usuario) return;
    if (previewAtivo) {
      proximo();
      return;
    }
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
    if (previewAtivo) {
      proximo();
      return;
    }
    try {
      await pularUsuario(usuario.id);
      proximo();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao pular.");
    }
  }

  function voltarPerfil() {
    setIndice((old) => Math.max(0, old - 1));
  }

  async function bloquear() {
    if (!usuario || previewAtivo) return;
    try {
      await bloquearUsuario(usuario.id);
      proximo();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao bloquear.");
    }
  }

  async function denunciar() {
    if (!usuario || previewAtivo) return;
    try {
      await denunciarUsuario(usuario.id);
      Alert.alert("Denúncia enviada", "Obrigado pelo aviso.");
      proximo();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao denunciar.");
    }
  }

  function abrirMaisAcoes() {
    if (previewAtivo) {
      Alert.alert("Mais ações", "Prévia visual do feed.");
      return;
    }

    Alert.alert("Mais ações", "Escolha uma opção para este perfil.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Denunciar", onPress: denunciar },
      { text: "Bloquear", style: "destructive", onPress: bloquear },
    ]);
  }

  const generoDesejado = useMemo(() => {
    const genero = String(meuPerfil?.genero || "").toUpperCase();
    if (genero.includes("MASC")) return "Mulheres";
    if (genero.includes("FEM")) return "Homens";
    return "Mulheres";
  }, [meuPerfil?.genero]);

  const localLabel = meuPerfil?.cidade && meuPerfil?.estado
    ? `${meuPerfil.cidade}, ${meuPerfil.estado}`
    : "Salvador, BA";

  if (loading) {
    return (
      <LuxuryScreen>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <LockHeart size={80} />
          <ActivityIndicator size="small" color={DP.colors.gold} />
          <Text style={styles.loadingText}>Encontrando conexões para você...</Text>
        </View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.topArea, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.brandRow}>
          <Pressable style={styles.vipPill} onPress={() => navigation.openDrawer?.()}>
            <Text style={styles.vipCrown}>♕</Text>
            <Text style={styles.vipPillText}>{vip ? "VIP" : "VIP"}</Text>
          </Pressable>

          <Pressable style={styles.brand} onPress={() => navigation.openDrawer?.()}>
            <LockHeart size={50} />
            <View style={styles.brandTextWrap}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandGold}>DESEJO</Text>
                <Text style={styles.brandRed}> PROIBIDO</Text>
              </View>
              <Text style={styles.brandTagline}>CONEXÕES QUE VÃO ALÉM</Text>
            </View>
          </Pressable>

          <View style={styles.topActions}>
            <View style={styles.bellWrap}>
              <Text style={styles.bell}>♧</Text>
              <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>3</Text></View>
            </View>
            <View style={styles.creditPill}>
              <Text style={styles.coin}>◉</Text>
              <Text style={styles.creditValue}>{saldo.toLocaleString("pt-BR")}</Text>
              <View style={styles.plus}><Text style={styles.plusText}>+</Text></View>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>
          {[
            ["Descobrir", "●"],
            ["Online", "●"],
            ["Perto de você", "●"],
            ["Novos", "★"],
            ["Mais filtros", "☷"],
          ].map(([label, icon]) => {
            const active = modo === label;
            return (
              <Pressable key={label} onPress={() => setModo(label)} style={[styles.modeChip, active && styles.modeChipActive]}>
                <Text style={[styles.modeIcon, label === "Online" && styles.onlineGreen]}>{label === "Descobrir" ? "♦" : icon}</Text>
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <View style={styles.filterChip}><Text style={styles.filterIcon}>▽</Text><Text style={styles.filterText}>Todos</Text><Text style={styles.chevron}>⌄</Text></View>
          <View style={styles.filterChip}><Text style={styles.filterIcon}>●</Text><Text style={styles.filterText}>{localLabel}</Text><Text style={styles.chevron}>⌄</Text></View>
          <View style={[styles.filterChip, styles.genderChip]}><Text style={styles.genderIcon}>♀</Text><Text style={styles.filterText}>{generoDesejado}</Text><Text style={styles.chevron}>⌄</Text></View>
          <View style={styles.filterChip}><Text style={styles.filterIcon}>♔</Text><Text style={styles.filterText}>18 - 45 anos</Text><Text style={styles.chevron}>⌄</Text></View>
        </ScrollView>
      </View>

      {!usuario ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyGlow} />
          <View style={styles.emptyLock}><LockHeart size={102} /></View>
          <Text style={styles.emptyTitle}>Você já viu todos os perfis</Text>
          <Text style={styles.emptyText}>Atualize para descobrir novas conexões disponíveis.</Text>
          <Pressable style={styles.emptyButton} onPress={carregar}>
            <Text style={styles.emptyButtonText}>Buscar novamente</Text>
            <Text style={styles.emptyArrow}>›</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.deckStage}>
          {proximo2?.fotoPrincipal ? (
            <ImageBackground source={{ uri: proximo2.fotoPrincipal }} style={[styles.backCard, styles.backCard2]} imageStyle={styles.cardImageRadius}>
              <View style={styles.backCount}><Text style={styles.backCountText}>▧ 6</Text></View>
            </ImageBackground>
          ) : null}
          {proximo1?.fotoPrincipal ? (
            <ImageBackground source={{ uri: proximo1.fotoPrincipal }} style={[styles.backCard, styles.backCard1]} imageStyle={styles.cardImageRadius}>
              <View style={styles.backCount}><Text style={styles.backCountText}>▧ 8</Text></View>
            </ImageBackground>
          ) : null}

          <ImageBackground
            source={{ uri: usuario.fotoPrincipal || PREVIEW_USER.fotoPrincipal }}
            style={styles.frontCard}
            imageStyle={styles.cardImageRadius}
            resizeMode="cover"
          >
            <View style={styles.cardTopShade} />
            <View style={styles.cardBottomShade} />

            <View style={styles.onlineBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.onlineBadgeText}>Online</Text>
            </View>

            <View style={styles.cardMenuArea}>
              <View style={styles.photoCount}><Text style={styles.photoCountText}>▧ {previewAtivo ? 12 : fotoCount}</Text></View>
              <Pressable onPress={abrirMaisAcoes} style={styles.moreButton}>
                <Text style={styles.moreText}>⋮</Text>
              </Pressable>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {usuario?.perfil?.nome || "Perfil"}{idadeDe(usuario?.perfil?.nascimento) ? `, ${idadeDe(usuario?.perfil?.nascimento)}` : ""}
                </Text>
                {usuario?.perfil?.verificado || previewAtivo ? <View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View> : null}
              </View>

              <Text style={styles.location}>
                ● {usuario?.perfil?.cidade || "Salvador"}, {usuario?.perfil?.estado || "BA"}
                {usuario?.perfil?.cidade && meuPerfil?.cidade && usuario.perfil.cidade === meuPerfil.cidade ? " • 2 km de você" : ""}
              </Text>

              <Text numberOfLines={2} style={styles.bio}>
                {usuario?.perfil?.bio || "Gosto de boas conversas, viagens, vinhos e aproveitar o lado bom da vida... ❤️"}
              </Text>

              <View style={styles.tags}>
                {["Viagens", "Vinho", "Música", "Fitness", "+3"].map((tag) => (
                  <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
              </View>

              <View style={styles.actions}>
                <Pressable style={[styles.actionCircle, styles.rewindCircle]} onPress={voltarPerfil}>
                  <Text style={[styles.actionGlyph, styles.rewindGlyph]}>↶</Text>
                </Pressable>
                <Pressable style={[styles.actionCircle, styles.nopeCircle]} onPress={pular}>
                  <Text style={[styles.actionGlyph, styles.nopeGlyph]}>×</Text>
                </Pressable>
                <Pressable style={[styles.actionCircle, styles.starCircle]} onPress={curtir}>
                  <Text style={[styles.actionGlyph, styles.starGlyph]}>★</Text>
                </Pressable>
                <Pressable style={[styles.actionCircle, styles.heartCircle]} onPress={curtir}>
                  <Text style={[styles.actionGlyph, styles.heartGlyph]}>♥</Text>
                </Pressable>
                <Pressable style={[styles.actionCircle, styles.boltCircle]} onPress={curtir}>
                  <Text style={[styles.actionGlyph, styles.boltGlyph]}>ϟ</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>
      )}

      <DPBottomNav />
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#000" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: "#9C9591", fontSize: 12 },

  topArea: {
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.98)",
    paddingBottom: 8,
  },
  brandRow: {
    minHeight: 72,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  vipPill: {
    height: 44,
    minWidth: 74,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#A86C23",
    backgroundColor: "#080604",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  vipCrown: { color: "#E9B949", fontSize: 19 },
  vipPillText: { color: "#E9B949", fontSize: 15, fontWeight: "700" },
  brand: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  brandTextWrap: { marginLeft: 4, alignItems: "center" },
  brandTitleRow: { flexDirection: "row", alignItems: "baseline" },
  brandGold: { color: "#E9B949", fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  brandRed: { color: "#E51D32", fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  brandTagline: { color: "#D6B35A", fontSize: 6.5, fontWeight: "800", letterSpacing: 1.8, marginTop: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  bellWrap: { width: 33, height: 42, alignItems: "center", justifyContent: "center" },
  bell: { color: "#F7F4F1", fontSize: 26, transform: [{ rotate: "180deg" }] },
  bellBadge: {
    position: "absolute", top: 1, right: -1, width: 19, height: 19, borderRadius: 10,
    backgroundColor: "#E51D32", alignItems: "center", justifyContent: "center",
  },
  bellBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  creditPill: {
    height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#A86C23",
    backgroundColor: "#080604", flexDirection: "row", alignItems: "center",
    paddingLeft: 10, paddingRight: 3, gap: 7,
  },
  coin: { color: "#E9B949", fontSize: 18 },
  creditValue: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  plus: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#C9252C",
    borderWidth: 1, borderColor: "#E3B65C", alignItems: "center", justifyContent: "center",
  },
  plusText: { color: "#FFF", fontSize: 26, lineHeight: 28, fontWeight: "400" },

  modeRow: { paddingHorizontal: 12, gap: 7, paddingVertical: 4 },
  modeChip: {
    height: 46, borderRadius: 23, borderWidth: 1, borderColor: "#8E5C24",
    backgroundColor: "#050505", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingHorizontal: 15,
  },
  modeChipActive: {
    backgroundColor: "#A40B20", borderColor: "#FF5B66",
    shadowColor: "#E51D32", shadowOpacity: 0.55, shadowRadius: 10, elevation: 7,
  },
  modeIcon: { color: "#E9B949", fontSize: 17 },
  onlineGreen: { color: "#18E646" },
  modeText: { color: "#EFEDEB", fontSize: 13, fontWeight: "500" },
  modeTextActive: { color: "#FFF", fontWeight: "700" },

  filterRow: { paddingHorizontal: 12, gap: 7, paddingTop: 5, paddingBottom: 8 },
  filterChip: {
    height: 43, borderRadius: 22, borderWidth: 1, borderColor: "#A36F2D",
    backgroundColor: "#050505", flexDirection: "row", alignItems: "center",
    gap: 7, paddingHorizontal: 13,
  },
  genderChip: { borderColor: "#AB0E32" },
  filterIcon: { color: "#E9B949", fontSize: 17 },
  genderIcon: { color: "#F12686", fontSize: 20, fontWeight: "700" },
  filterText: { color: "#EEEAE7", fontSize: 12, fontWeight: "500" },
  chevron: { color: "#E9B949", fontSize: 15, marginLeft: 2 },

  deckStage: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 88,
    minHeight: 0,
    position: "relative",
  },
  backCard: {
    position: "absolute",
    top: 16,
    bottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#C58B38",
    overflow: "hidden",
  },
  backCard1: { left: 30, right: -16, opacity: 0.82 },
  backCard2: { left: 54, right: -29, top: 31, bottom: 27, opacity: 0.57 },
  backCount: {
    position: "absolute", top: 12, right: 9, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.72)", paddingHorizontal: 10, paddingVertical: 6,
  },
  backCountText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  frontCard: {
    flex: 1,
    marginRight: 26,
    borderRadius: 24,
    borderWidth: 1.3,
    borderColor: "#D29A45",
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#E1A949",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImageRadius: { borderRadius: 23 },
  cardTopShade: {
    position: "absolute", left: 0, right: 0, top: 0, height: 120,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  cardBottomShade: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 360,
    backgroundColor: "rgba(0,0,0,0.66)",
  },
  onlineBadge: {
    position: "absolute", top: 14, left: 14, height: 38, borderRadius: 19,
    backgroundColor: "rgba(27,22,18,0.78)", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, gap: 8,
  },
  greenDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: "#16E73F" },
  onlineBadgeText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  cardMenuArea: { position: "absolute", top: 12, right: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  photoCount: {
    height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10, alignItems: "center", justifyContent: "center",
  },
  photoCountText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  moreButton: { width: 30, height: 40, alignItems: "center", justifyContent: "center" },
  moreText: { color: "#FFF", fontSize: 29, lineHeight: 29, fontWeight: "700" },

  profileInfo: {
    position: "absolute", left: 15, right: 15, bottom: 16,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: {
    color: "#FFF", fontSize: 29, lineHeight: 34, fontWeight: "800", maxWidth: "84%",
    textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  verified: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#1687F5",
    alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }],
  },
  verifiedText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  location: { color: "#F5EEE9", fontSize: 15, lineHeight: 21, marginTop: 4, fontWeight: "500" },
  bio: { color: "#F5F0EC", fontSize: 14, lineHeight: 20, marginTop: 7, fontWeight: "400" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    minHeight: 30, borderRadius: 15, borderWidth: 1, borderColor: "#D29A45",
    paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)",
  },
  tagText: { color: "#FFF", fontSize: 11, fontWeight: "500" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 13 },
  actionCircle: {
    width: 55, height: 55, borderRadius: 28, borderWidth: 1.4,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,5,5,0.88)",
  },
  rewindCircle: { borderColor: "#D89B39" },
  nopeCircle: { borderColor: "#ED2444" },
  starCircle: { borderColor: "#D89B39" },
  heartCircle: {
    borderColor: "#FF4B66", backgroundColor: "rgba(161,0,26,0.70)",
    shadowColor: "#FF183B", shadowOpacity: 0.66, shadowRadius: 11, elevation: 7,
  },
  boltCircle: { borderColor: "#D843F1" },
  actionGlyph: { fontSize: 30, lineHeight: 32, fontWeight: "700" },
  rewindGlyph: { color: "#F1B449" },
  nopeGlyph: { color: "#F0294B", fontSize: 37 },
  starGlyph: { color: "#F0B64A" },
  heartGlyph: { color: "#FF6A85" },
  boltGlyph: { color: "#DD4DF4" },

  emptyWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 26, paddingBottom: 105,
  },
  emptyGlow: {
    position: "absolute", width: 330, height: 330, borderRadius: 165,
    backgroundColor: "rgba(145,0,18,0.18)", top: "10%",
  },
  emptyLock: {
    width: 145, height: 145, borderRadius: 73, borderWidth: 2,
    borderColor: "#E9B949", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(17,5,5,0.85)", shadowColor: "#E51D32",
    shadowOpacity: 0.45, shadowRadius: 24, elevation: 8,
  },
  emptyTitle: { color: "#FFF", fontSize: 29, lineHeight: 35, fontWeight: "800", textAlign: "center", marginTop: 40 },
  emptyText: { color: "#9F9995", fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 12 },
  emptyButton: {
    width: "100%", height: 66, borderRadius: 33, marginTop: 36,
    backgroundColor: "#9D061B", borderWidth: 1.2, borderColor: "#F0C75D",
    alignItems: "center", justifyContent: "center", shadowColor: "#E51D32",
    shadowOpacity: 0.38, shadowRadius: 15, elevation: 7,
  },
  emptyButtonText: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  emptyArrow: { position: "absolute", right: 24, color: "#F1C95F", fontSize: 34, fontWeight: "200" },
});
