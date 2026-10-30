import { SymbolView } from "expo-symbols";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DP_SERIF, LockHeart, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { buscarMatches } from "../services/matches";

type MatchItem = {
  id: string | number;
  conversaId?: string;
  outro?: {
    id?: string;
    idade?: number;
    perfilVerificado?: boolean;
    perfil?: {
      nome?: string;
      cidade?: string;
      estado?: string;
      idade?: number;
      nascimento?: string | Date;
      verificado?: boolean;
    };
    fotos?: Array<{
      id?: string | number;
      url?: string;
      principal?: boolean;
    }>;
  };
};

const BOTTOM_ITEMS = [
  {
    label: "Descobrir",
    route: "/feed",
    symbol: { ios: "safari", android: "explore", web: "explore" },
  },
  {
    label: "Matches",
    route: "/matches",
    symbol: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  },
  {
    label: "Conversas",
    route: "/conversas",
    symbol: { ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  },
  {
    label: "Carteira",
    route: "/carteira",
    symbol: { ios: "wallet.bifold", android: "wallet", web: "wallet" },
  },
  {
    label: "Perfil",
    route: "/perfil",
    symbol: { ios: "person", android: "person_outline", web: "person_outline" },
  },
] as const;

function calcularIdade(nascimento?: string | Date) {
  if (!nascimento) return null;

  const data = new Date(nascimento);
  if (Number.isNaN(data.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const mes = hoje.getMonth() - data.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) {
    idade -= 1;
  }

  return idade;
}

function localizacao(perfil: MatchItem["outro"] extends { perfil?: infer P } ? P : any) {
  const cidade = perfil?.cidade?.trim();
  const estado = perfil?.estado?.trim();

  if (cidade && estado) return `${cidade} • ${estado}`;
  if (cidade) return cidade;
  if (estado) return estado;
  return "Localização não informada";
}

export default function Matches() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      const data = await buscarMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erro ao carregar matches:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  const matchesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return matches;

    return matches.filter((item) => {
      const perfil = item.outro?.perfil;
      const texto = [
        perfil?.nome,
        perfil?.cidade,
        perfil?.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [matches, busca]);

  function abrirMenu() {
    if (navigation?.openDrawer) navigation.openDrawer();
    else navigation?.getParent?.()?.openDrawer?.();
  }

  function abrirConversa(item: MatchItem) {
    if (!item.conversaId) return;
    router.push(`/chat?conversaId=${item.conversaId}`);
  }

  function abrirPerfil(item: MatchItem) {
    if (!item.outro?.id) return;
    router.push(`/usuario?id=${item.outro.id}`);
  }

  return (
    <LuxuryScreen style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable
          onPress={abrirMenu}
          hitSlop={12}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>

        <View style={styles.brand}>
          <LockHeart size={54} />
          <Text style={styles.brandText}>Desejo Proibido</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>CONEXÕES</Text>
          <View style={styles.eyebrowLine} />
        </View>

        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Seus Matches</Text>
            <Text style={styles.subtitle}>Pessoas que também escolheram você.</Text>
          </View>

          <View style={styles.countGlow}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{matches.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" } as any}
            size={23}
            tintColor="#E8C165"
            style={styles.searchSymbol}
          />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome ou cidade"
            placeholderTextColor="#7E7772"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={DP.colors.gold} />
            <Text style={styles.loadingText}>Carregando seus matches...</Text>
          </View>
        ) : (
          <FlatList
            data={matchesFiltrados}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              matchesFiltrados.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => {
              const perfil = item.outro?.perfil || {};
              const fotos = Array.isArray(item.outro?.fotos) ? item.outro?.fotos || [] : [];
              const principal =
                fotos.find((foto) => foto?.principal)?.url ||
                fotos[0]?.url ||
                "";

              const nome = perfil.nome?.trim() || "Usuário";
              const idade =
                perfil.idade ||
                item.outro?.idade ||
                calcularIdade(perfil.nascimento);

              const verificado =
                !!item.outro?.perfilVerificado ||
                !!perfil.verificado;

              return (
                <View style={styles.card}>
                  <View style={styles.photoShell}>
                    {principal ? (
                      <Image
                        source={{ uri: principal }}
                        resizeMode="cover"
                        style={styles.photo}
                      />
                    ) : (
                      <View style={styles.photoFallback}>
                        <Text style={styles.fallbackInitial}>
                          {nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text numberOfLines={1} style={styles.name}>
                        {nome}{idade ? `, ${idade}` : ""}
                      </Text>
                      {verificado ? (
                        <SymbolView
                          name={{ ios: "checkmark.seal.fill", android: "verified", web: "verified" } as any}
                          size={17}
                          tintColor="#E9B949"
                          style={styles.verified}
                        />
                      ) : null}
                    </View>

                    <Text numberOfLines={1} style={styles.location}>
                      {localizacao(perfil)}
                    </Text>

                    <View style={styles.actions}>
                      <Pressable
                        disabled={!item.conversaId}
                        onPress={() => abrirConversa(item)}
                        style={({ pressed }) => [
                          styles.chatButton,
                          !item.conversaId && styles.buttonDisabled,
                          pressed && item.conversaId && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.chatButtonText}>Conversar</Text>
                      </Pressable>

                      <Pressable
                        disabled={!item.outro?.id}
                        onPress={() => abrirPerfil(item)}
                        style={({ pressed }) => [
                          styles.profileButton,
                          !item.outro?.id && styles.buttonDisabled,
                          pressed && item.outro?.id && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.profileButtonText}>Ver perfil</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyHeart}>
                  <SymbolView
                    name={{ ios: "heart.fill", android: "favorite", web: "favorite" } as any}
                    size={36}
                    tintColor="#E33A50"
                    style={styles.emptyHeartIcon}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {busca ? "Nenhum match encontrado" : "Seus novos matches aparecerão aqui"}
                </Text>
                <Text style={styles.emptyText}>
                  {busca
                    ? "Tente buscar por outro nome ou cidade."
                    : "Quando o interesse acontecer dos dois lados, a conexão ficará disponível nesta tela."}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomTopLine} />
        <View style={styles.bottomItems}>
          {BOTTOM_ITEMS.map((item) => {
            const active = item.route === "/matches";

            return (
              <Pressable
                key={item.route}
                onPress={() => router.replace(item.route)}
                style={({ pressed }) => [
                  styles.bottomItem,
                  pressed && styles.bottomPressed,
                ]}
              >
                {active ? <View style={styles.activeLine} /> : null}

                <View style={styles.bottomIconStage}>
                  <SymbolView
                    name={item.symbol as any}
                    size={active ? 33 : 31}
                    tintColor={active ? "#F11E3A" : "#EADFCF"}
                    style={styles.bottomIcon}
                  />
                </View>

                <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#020202",
  },

  topBar: {
    minHeight: 92,
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 5,
  },
  menuLine: {
    width: 29,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#F2D071",
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginRight: 4,
  },
  brandText: {
    color: "#F4D07A",
    fontFamily: DP_SERIF,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "700",
    textShadowColor: "rgba(234,184,67,0.18)",
    textShadowRadius: 6,
  },
  headerSpacer: {
    width: 44,
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  eyebrow: {
    color: "#F0D28B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 3.8,
  },
  eyebrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(233,185,73,0.43)",
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 17,
  },
  headingCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -0.9,
  },
  subtitle: {
    color: "#8F8883",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 5,
  },

  countGlow: {
    width: 57,
    height: 57,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(141,0,20,0.07)",
    shadowColor: "#F01436",
    shadowOpacity: 0.74,
    shadowRadius: 18,
    elevation: 8,
  },
  countBadge: {
    width: 47,
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#9F1328",
    backgroundColor: "rgba(86,0,13,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: "#F52D47",
    fontFamily: DP_SERIF,
    fontSize: 20,
    fontWeight: "700",
  },

  searchWrap: {
    height: 61,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(235,191,91,0.68)",
    backgroundColor: "rgba(8,7,6,0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    marginBottom: 20,
  },
  searchSymbol: {
    width: 25,
    height: 25,
    marginRight: 11,
  },
  search: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
    paddingVertical: 0,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
    gap: 12,
  },
  loadingText: {
    color: "#948D88",
    fontSize: 12,
  },

  list: {
    paddingBottom: 125,
  },
  listEmpty: {
    flexGrow: 1,
  },

  card: {
    minHeight: 200,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(213,163,68,0.62)",
    backgroundColor: "rgba(7,6,5,0.93)",
    flexDirection: "row",
    padding: 12,
    marginBottom: 13,
    overflow: "hidden",
    shadowColor: "#7B260E",
    shadowOpacity: 0.12,
    shadowRadius: 9,
    elevation: 3,
  },
  photoShell: {
    width: 139,
    minHeight: 175,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  photo: {
    width: "100%",
    height: "100%",
    minHeight: 175,
  },
  photoFallback: {
    flex: 1,
    minHeight: 175,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(231,176,75,0.75)",
    borderRadius: 15,
    backgroundColor: "#14100C",
    shadowColor: "#B90C25",
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 5,
  },
  fallbackInitial: {
    color: "#F2BD4F",
    fontFamily: DP_SERIF,
    fontSize: 54,
    fontWeight: "700",
  },

  cardInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
    paddingTop: 4,
    paddingBottom: 2,
  },
  nameRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    flexShrink: 1,
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "700",
  },
  verified: {
    width: 18,
    height: 18,
  },
  location: {
    color: "#8F8985",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },

  actions: {
    marginTop: "auto",
    gap: 9,
  },
  chatButton: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FF3150",
    backgroundColor: "#A8071C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F01436",
    shadowOpacity: 0.46,
    shadowRadius: 11,
    elevation: 6,
  },
  chatButtonText: {
    color: "#FFF9F3",
    fontFamily: DP_SERIF,
    fontSize: 16,
    fontWeight: "700",
  },
  profileButton: {
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EAC153",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonText: {
    color: "#F0D182",
    fontFamily: DP_SERIF,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },

  emptyState: {
    flex: 1,
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 50,
  },
  emptyHeart: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: "rgba(234,193,83,0.63)",
    backgroundColor: "rgba(81,0,12,0.24)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 6,
  },
  emptyHeartIcon: {
    width: 38,
    height: 38,
  },
  emptyTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 19,
  },
  emptyText: {
    color: "#918A85",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(2,2,2,0.995)",
    zIndex: 80,
  },
  bottomTopLine: {
    height: 1,
    backgroundColor: "rgba(217,169,54,0.50)",
  },
  bottomItems: {
    height: 94,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  bottomItem: {
    flex: 1,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: 5,
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 38,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#F21F3B",
    shadowColor: "#F21F3B",
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomIconStage: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: {
    width: 34,
    height: 34,
  },
  bottomLabel: {
    color: "#D8D0C8",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  bottomLabelActive: {
    color: "#F21F3B",
    fontWeight: "800",
  },
  bottomPressed: {
    opacity: 0.66,
    transform: [{ scale: 0.96 }],
  },

  pressed: {
    opacity: 0.72,
  },
});
