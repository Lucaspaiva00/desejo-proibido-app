import { SymbolView } from "expo-symbols";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
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
  consumirRetornoFeed,
} from "../services/feed";
import { getRealtimeSocket } from "../services/liveSocket";
import { obterToken } from "../storage/auth";

type GenderFilter = "FEMININO" | "MASCULINO" | "Qualquer";
type LocationFilter = "cidade" | "estado" | "qualquer";
type SortFilter = "recent" | "boost" | "random";

type FeedFilterState = {
  genero: GenderFilter;
  idadeMin: number;
  idadeMax: number;
  local: LocationFilter;
  somenteComFoto: boolean;
  somenteVerificados: boolean;
  ordenarPor: SortFilter;
};

type SymbolNames = {
  ios: string;
  android: string;
  web: string;
};

const ICONS: Record<string, SymbolNames> = {
  vip: { ios: "crown.fill", android: "workspace_premium", web: "workspace_premium" },
  coin: { ios: "creditcard.fill", android: "paid", web: "paid" },
  plus: { ios: "plus", android: "add", web: "add" },
  discover: { ios: "safari.fill", android: "explore", web: "explore" },
  online: { ios: "circle.fill", android: "circle", web: "circle" },
  nearby: { ios: "location.fill", android: "near_me", web: "near_me" },
  new: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  filters: { ios: "slider.horizontal.3", android: "tune", web: "tune" },
  all: { ios: "line.3.horizontal.decrease.circle", android: "filter_list", web: "filter_list" },
  gender: { ios: "person.2.fill", android: "group", web: "group" },
  age: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  photo: { ios: "photo.stack.fill", android: "photo_library", web: "photo_library" },
  more: { ios: "ellipsis", android: "more_vert", web: "more_vert" },
  verified: { ios: "checkmark.seal.fill", android: "verified", web: "verified" },
  rewind: { ios: "arrow.uturn.backward", android: "undo", web: "undo" },
  close: { ios: "xmark", android: "close", web: "close" },
  star: { ios: "star.fill", android: "star", web: "star" },
  heart: { ios: "heart.fill", android: "favorite", web: "favorite" },
  bolt: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  chevron: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  reset: { ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" },
  check: { ios: "checkmark", android: "check", web: "check" },
};

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

const AGE_OPTIONS = [
  { label: "18–25", min: 18, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36–45", min: 36, max: 45 },
  { label: "46–60", min: 46, max: 60 },
  { label: "Todas", min: 18, max: 99 },
] as const;

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

function Icon({
  name,
  size = 22,
  color = "#DDB059",
  style,
}: {
  name: SymbolNames;
  size?: number;
  color?: string;
  style?: any;
}) {
  return <SymbolView name={name as any} size={size} tintColor={color} style={style} />;
}

function defaultFiltersForProfile(perfil: any): FeedFilterState {
  const genero = String(perfil?.genero || "").toUpperCase();
  const generoPreferido: GenderFilter = genero.includes("MASC")
    ? "FEMININO"
    : genero.includes("FEM")
      ? "MASCULINO"
      : "Qualquer";

  return {
    genero: generoPreferido,
    idadeMin: 18,
    idadeMax: 45,
    local: "qualquer",
    somenteComFoto: false,
    somenteVerificados: false,
    ordenarPor: "recent",
  };
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
  const [modo, setModo] = useState<"Descobrir" | "Online" | "Perto de você" | "Novos">("Descobrir");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const [filtros, setFiltros] = useState<FeedFilterState>({
    genero: "Qualquer",
    idadeMin: 18,
    idadeMax: 45,
    local: "qualquer",
    somenteComFoto: false,
    somenteVerificados: false,
    ordenarPor: "recent",
  });
  const [filtrosDraft, setFiltrosDraft] = useState<FeedFilterState>(filtros);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  useEffect(() => {
    inicializar();
  }, [previewAtivo]);

  async function inicializar() {
    const perfil = await carregarResumo();
    const iniciais = defaultFiltersForProfile(perfil);
    setFiltros(iniciais);
    setFiltrosDraft(iniciais);
    await carregar(iniciais, perfil, "Descobrir");
  }

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
      const perfilPreview = { cidade: "Salvador", estado: "BA", genero: "MASCULINO" };
      setSaldo(250);
      setVip(true);
      setMeuPerfil(perfilPreview);
      return perfilPreview;
    }

    try {
      const headers = await authHeader();
      const [usuarioRes, perfilRes] = await Promise.all([
        api.get("/usuarios/me", { headers }),
        api.get("/perfil/me", { headers }),
      ]);
      setSaldo(Number(usuarioRes.data?.saldoCreditos || 0));
      setVip(!!(usuarioRes.data?.premiumAtivo || usuarioRes.data?.isPremium));
      const perfil = perfilRes.data || null;
      setMeuPerfil(perfil);
      return perfil;
    } catch {
      return null;
    }
  }

  function montarParams(estado: FeedFilterState, perfilBase: any = meuPerfil) {
    return {
      ordenarPor: estado.ordenarPor,
      take: 100,
      genero: estado.genero,
      idadeMin: estado.idadeMin,
      idadeMax: estado.idadeMax,
      somenteComFoto: estado.somenteComFoto,
      somenteVerificados: estado.somenteVerificados,
      ...(estado.local === "cidade" && perfilBase?.cidade
        ? { cidade: perfilBase.cidade, estado: perfilBase?.estado || "" }
        : {}),
      ...(estado.local === "estado" && perfilBase?.estado
        ? { estado: perfilBase.estado }
        : {}),
    };
  }

  async function obterPresenca(rows: any[]) {
    if (previewAtivo) {
      setOnlineIds(new Set(["__preview__"]));
      return new Set(["__preview__"]);
    }

    const ids = rows.map((item) => String(item?.id || "")).filter(Boolean);
    if (!ids.length) {
      setOnlineIds(new Set());
      return new Set<string>();
    }

    try {
      const socket = await getRealtimeSocket();

      const result = await new Promise<Set<string>>((resolve) => {
        let resolved = false;

        const finish = (set: Set<string>) => {
          if (resolved) return;
          resolved = true;
          socket.off("presence:list", onPresence);
          resolve(set);
        };

        const onPresence = (payload: any) => {
          const lista = Array.isArray(payload) ? payload : payload?.items || [];
          const set = new Set<string>(
            lista
              .filter((item: any) => item?.online)
              .map((item: any) => String(item.userId))
          );
          finish(set);
        };

        socket.on("presence:list", onPresence);
        socket.emit("presence:watch", { userIds: ids });
        setTimeout(() => finish(new Set()), 1800);
      });

      setOnlineIds(result);
      return result;
    } catch {
      setOnlineIds(new Set());
      return new Set<string>();
    }
  }

  async function carregar(
    estado: FeedFilterState = filtros,
    perfilBase: any = meuPerfil,
    modoAlvo: typeof modo = modo
  ) {
    try {
      setLoading(true);

      if (previewAtivo) {
        const previewRows = [PREVIEW_USER, { ...PREVIEW_USER, id: "__preview2__" }, { ...PREVIEW_USER, id: "__preview3__" }];
        setUsuarios(modoAlvo === "Online" ? previewRows.slice(0, 2) : previewRows);
        setOnlineIds(new Set(previewRows.map((item) => item.id)));
        setIndice(0);
        return;
      }

      const dados = await buscarFeed(montarParams(estado, perfilBase));
      const rows = Array.isArray(dados) ? dados : [];
      const presenca = await obterPresenca(rows);
      const finais = modoAlvo === "Online"
        ? rows.filter((item: any) => presenca.has(String(item.id)))
        : rows;

      setUsuarios(finais);
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

  async function voltarPerfil() {
    if (indice <= 0) return;

    if (previewAtivo) {
      setIndice((old) => Math.max(0, old - 1));
      return;
    }

    const perfilAnterior = usuarios[indice - 1];

    if (saldo < 10) {
      Alert.alert(
        "Créditos insuficientes",
        "Voltar para o perfil anterior custa 10 créditos. Adicione créditos para usar este recurso.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Comprar créditos", onPress: () => navigation.navigate("creditos") },
        ]
      );
      return;
    }

    try {
      const resultado = await consumirRetornoFeed(perfilAnterior?.id);
      setSaldo(Number(resultado?.saldoCreditos ?? Math.max(0, saldo - 10)));
      setIndice((old) => Math.max(0, old - 1));
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      const saldoServidor = error?.response?.data?.saldoCreditos;

      if (typeof saldoServidor === "number") {
        setSaldo(saldoServidor);
      }

      if (status === 402) {
        Alert.alert(
          "Créditos insuficientes",
          "Voltar para o perfil anterior custa 10 créditos.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Comprar créditos", onPress: () => navigation.navigate("creditos") },
          ]
        );
        return;
      }

      Alert.alert(
        "Não foi possível voltar",
        error?.response?.data?.erro || "Tente novamente em instantes."
      );
    }
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

  async function mudarModo(novoModo: typeof modo) {
    let next = { ...filtros };

    if (novoModo === "Descobrir") {
      next = defaultFiltersForProfile(meuPerfil);
      setFiltros(next);
      setFiltrosDraft(next);
    } else if (novoModo === "Perto de você") {
      next = { ...next, local: "cidade" };
      setFiltros(next);
      setFiltrosDraft(next);
    } else if (novoModo === "Novos") {
      next = { ...next, ordenarPor: "recent" };
      setFiltros(next);
      setFiltrosDraft(next);
    }

    setModo(novoModo);
    await carregar(next, meuPerfil, novoModo);
  }

  function abrirFiltros() {
    setFiltrosDraft({ ...filtros });
    setFiltrosAbertos(true);
  }

  async function aplicarFiltros() {
    const next = { ...filtrosDraft };
    setFiltros(next);
    setFiltrosAbertos(false);
    await carregar(next, meuPerfil, modo);
  }

  async function limparFiltros() {
    const next = defaultFiltersForProfile(meuPerfil);
    setFiltros(next);
    setFiltrosDraft(next);
    setModo("Descobrir");
    setFiltrosAbertos(false);
    await carregar(next, meuPerfil, "Descobrir");
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

  const filtroCount = useMemo(() => {
    const padrao = defaultFiltersForProfile(meuPerfil);
    let count = 0;
    if (filtros.genero !== padrao.genero) count += 1;
    if (filtros.idadeMin !== padrao.idadeMin || filtros.idadeMax !== padrao.idadeMax) count += 1;
    if (filtros.local !== padrao.local) count += 1;
    if (filtros.somenteComFoto) count += 1;
    if (filtros.somenteVerificados) count += 1;
    if (filtros.ordenarPor !== padrao.ordenarPor) count += 1;
    return count;
  }, [filtros, meuPerfil]);

  const localLabel = meuPerfil?.cidade && meuPerfil?.estado
    ? `${meuPerfil.cidade}, ${meuPerfil.estado}`
    : "Sua região";

  const generoLabel = filtros.genero === "FEMININO"
    ? "Mulheres"
    : filtros.genero === "MASCULINO"
      ? "Homens"
      : "Todos";

  const idadeLabel = filtros.idadeMax === 99
    ? "18+ anos"
    : `${filtros.idadeMin}–${filtros.idadeMax} anos`;

  const localFiltroLabel = filtros.local === "cidade"
    ? localLabel
    : filtros.local === "estado"
      ? meuPerfil?.estado || "Seu estado"
      : "Qualquer lugar";

  const cardOnline = !!usuario && (previewAtivo || onlineIds.has(String(usuario.id)));

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
            <Icon name={ICONS.vip} size={19} color="#E9B949" />
            <Text style={styles.vipPillText}>VIP</Text>
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
            <View style={styles.creditPill}>
              <Icon name={ICONS.coin} size={18} color="#E9B949" />
              <Text style={styles.creditValue}>{saldo.toLocaleString("pt-BR")}</Text>
              <View style={styles.plus}>
                <Icon name={ICONS.plus} size={20} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>
          {[
            { label: "Descobrir" as const, icon: ICONS.discover },
            { label: "Online" as const, icon: ICONS.online },
            { label: "Perto de você" as const, icon: ICONS.nearby },
            { label: "Novos" as const, icon: ICONS.new },
          ].map((item) => {
            const active = modo === item.label;
            return (
              <Pressable
                key={item.label}
                onPress={() => mudarModo(item.label)}
                style={({ pressed }) => [
                  styles.modeChip,
                  active && styles.modeChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  color={item.label === "Online" ? "#23DE63" : active ? "#FFF4D3" : "#E9B949"}
                />
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={abrirFiltros}
            style={({ pressed }) => [
              styles.modeChip,
              filtroCount > 0 && styles.modeChipFiltered,
              pressed && styles.pressed,
            ]}
          >
            <Icon name={ICONS.filters} size={18} color="#E9B949" />
            <Text style={styles.modeText}>Filtros{filtroCount ? ` (${filtroCount})` : ""}</Text>
          </Pressable>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable style={styles.filterChip} onPress={abrirFiltros}>
            <Icon name={ICONS.all} size={17} color="#E9B949" />
            <Text style={styles.filterText}>Todos</Text>
          </Pressable>

          <Pressable style={[styles.filterChip, filtros.local !== "qualquer" && styles.filterChipActive]} onPress={abrirFiltros}>
            <Icon name={ICONS.nearby} size={17} color="#E9B949" />
            <Text style={styles.filterText}>{localFiltroLabel}</Text>
            <Icon name={ICONS.chevron} size={14} color="#9F7A35" />
          </Pressable>

          <Pressable style={[styles.filterChip, filtros.genero !== "Qualquer" && styles.filterChipActive]} onPress={abrirFiltros}>
            <Icon name={ICONS.gender} size={17} color="#E34A85" />
            <Text style={styles.filterText}>{generoLabel}</Text>
            <Icon name={ICONS.chevron} size={14} color="#9F7A35" />
          </Pressable>

          <Pressable style={styles.filterChip} onPress={abrirFiltros}>
            <Icon name={ICONS.age} size={17} color="#E9B949" />
            <Text style={styles.filterText}>{idadeLabel}</Text>
            <Icon name={ICONS.chevron} size={14} color="#9F7A35" />
          </Pressable>
        </ScrollView>
      </View>

      {!usuario ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyGlow} />
          <View style={styles.emptyLock}><LockHeart size={102} /></View>
          <Text style={styles.emptyTitle}>
            {modo === "Online" ? "Ninguém online agora" : "Você já viu todos os perfis"}
          </Text>
          <Text style={styles.emptyText}>
            {modo === "Online"
              ? "Assim que alguém ficar online, aparecerá aqui para você."
              : "Ajuste seus filtros ou atualize para descobrir novas conexões."}
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => carregar(filtros, meuPerfil, modo)}>
            <Text style={styles.emptyButtonText}>Buscar novamente</Text>
            <Icon name={ICONS.chevron} size={24} color="#F1C95F" style={styles.emptyArrowIcon} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.deckStage}>
          {proximo2?.fotoPrincipal ? (
            <ImageBackground source={{ uri: proximo2.fotoPrincipal }} style={[styles.backCard, styles.backCard2]} imageStyle={styles.cardImageRadius}>
              <View style={styles.backCount}>
                <Icon name={ICONS.photo} size={15} color="#FFF" />
                <Text style={styles.backCountText}>6</Text>
              </View>
            </ImageBackground>
          ) : null}

          {proximo1?.fotoPrincipal ? (
            <ImageBackground source={{ uri: proximo1.fotoPrincipal }} style={[styles.backCard, styles.backCard1]} imageStyle={styles.cardImageRadius}>
              <View style={styles.backCount}>
                <Icon name={ICONS.photo} size={15} color="#FFF" />
                <Text style={styles.backCountText}>8</Text>
              </View>
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

            {cardOnline ? (
              <View style={styles.onlineBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.onlineBadgeText}>Online</Text>
              </View>
            ) : null}

            <View style={styles.cardMenuArea}>
              <View style={styles.photoCount}>
                <Icon name={ICONS.photo} size={15} color="#FFF" />
                <Text style={styles.photoCountText}>{previewAtivo ? 12 : fotoCount}</Text>
              </View>
              <Pressable onPress={abrirMaisAcoes} style={styles.moreButton}>
                <Icon name={ICONS.more} size={24} color="#FFF" />
              </Pressable>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {usuario?.perfil?.nome || "Perfil"}{idadeDe(usuario?.perfil?.nascimento) ? `, ${idadeDe(usuario?.perfil?.nascimento)}` : ""}
                </Text>
                {usuario?.perfil?.verificado || previewAtivo ? (
                  <Icon name={ICONS.verified} size={23} color="#2389F7" />
                ) : null}
              </View>

              <View style={styles.locationRow}>
                <Icon name={ICONS.nearby} size={16} color="#E9B949" />
                <Text style={styles.location}>
                  {usuario?.perfil?.cidade || "Salvador"}, {usuario?.perfil?.estado || "BA"}
                  {usuario?.perfil?.cidade && meuPerfil?.cidade && usuario.perfil.cidade === meuPerfil.cidade ? " • perto de você" : ""}
                </Text>
              </View>

              <Text numberOfLines={2} style={styles.bio}>
                {usuario?.perfil?.bio || "Gosto de boas conversas, viagens, vinhos e aproveitar o lado bom da vida... ❤️"}
              </Text>

              <View style={styles.tags}>
                {["Viagens", "Vinho", "Música", "Fitness", "+3"].map((tag) => (
                  <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
              </View>

              <View style={styles.actions}>
                <Pressable
                  disabled={indice === 0}
                  style={[styles.actionCircle, styles.rewindCircle, indice === 0 && styles.rewindCircleDisabled]}
                  onPress={voltarPerfil}
                >
                  <Icon name={ICONS.rewind} size={27} color="#F4B947" />
                  {indice > 0 ? (
                    <View style={styles.rewindCostBadge}>
                      <Text style={styles.rewindCostText}>10</Text>
                    </View>
                  ) : null}
                </Pressable>

                <Pressable style={[styles.actionCircle, styles.nopeCircle]} onPress={pular}>
                  <Icon name={ICONS.close} size={31} color="#F0294B" />
                </Pressable>

                <Pressable style={[styles.actionCircle, styles.starCircle]} onPress={curtir}>
                  <Icon name={ICONS.star} size={27} color="#F0B64A" />
                </Pressable>

                <Pressable style={[styles.actionCircle, styles.heartCircle]} onPress={curtir}>
                  <Icon name={ICONS.heart} size={28} color="#FF6985" />
                </Pressable>

                <Pressable style={[styles.actionCircle, styles.boltCircle]} onPress={curtir}>
                  <Icon name={ICONS.bolt} size={28} color="#DD4DF4" />
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>
      )}

      <Modal
        visible={filtrosAbertos}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltrosAbertos(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltrosAbertos(false)}>
          <Pressable style={styles.filterSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.filterSheetEyebrow}>DESCOBRIR</Text>
                <Text style={styles.filterSheetTitle}>Filtros</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setFiltrosAbertos(false)}>
                <Icon name={ICONS.close} size={21} color="#D8D0CB" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              <Text style={styles.filterGroupLabel}>LOCALIZAÇÃO</Text>
              <View style={styles.optionRow}>
                {[
                  ["cidade", "Minha cidade"],
                  ["estado", "Meu estado"],
                  ["qualquer", "Qualquer lugar"],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setFiltrosDraft((old) => ({ ...old, local: value as LocationFilter }))}
                    style={[styles.optionChip, filtrosDraft.local === value && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, filtrosDraft.local === value && styles.optionChipTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.filterGroupLabel}>QUEM VOCÊ QUER VER</Text>
              <View style={styles.optionRow}>
                {[
                  ["FEMININO", "Mulheres"],
                  ["MASCULINO", "Homens"],
                  ["Qualquer", "Todos"],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setFiltrosDraft((old) => ({ ...old, genero: value as GenderFilter }))}
                    style={[styles.optionChip, filtrosDraft.genero === value && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, filtrosDraft.genero === value && styles.optionChipTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.filterGroupLabel}>IDADE</Text>
              <View style={styles.optionRow}>
                {AGE_OPTIONS.map((item) => {
                  const active = filtrosDraft.idadeMin === item.min && filtrosDraft.idadeMax === item.max;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => setFiltrosDraft((old) => ({ ...old, idadeMin: item.min, idadeMax: item.max }))}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                    >
                      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.filterGroupLabel}>PREFERÊNCIAS</Text>
              <Pressable
                style={[styles.filterToggle, filtrosDraft.somenteComFoto && styles.filterToggleActive]}
                onPress={() => setFiltrosDraft((old) => ({ ...old, somenteComFoto: !old.somenteComFoto }))}
              >
                <View style={styles.toggleLeft}>
                  <View style={styles.toggleIcon}>
                    <Icon name={ICONS.photo} size={20} color="#E9B949" />
                  </View>
                  <Text style={styles.filterToggleText}>Somente perfis com foto</Text>
                </View>
                <View style={[styles.switchTrack, filtrosDraft.somenteComFoto && styles.switchTrackOn]}>
                  <View style={[styles.switchKnob, filtrosDraft.somenteComFoto && styles.switchKnobOn]} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.filterToggle, filtrosDraft.somenteVerificados && styles.filterToggleActive]}
                onPress={() => setFiltrosDraft((old) => ({ ...old, somenteVerificados: !old.somenteVerificados }))}
              >
                <View style={styles.toggleLeft}>
                  <View style={styles.toggleIcon}>
                    <Icon name={ICONS.verified} size={20} color="#E9B949" />
                  </View>
                  <Text style={styles.filterToggleText}>Somente verificados</Text>
                </View>
                <View style={[styles.switchTrack, filtrosDraft.somenteVerificados && styles.switchTrackOn]}>
                  <View style={[styles.switchKnob, filtrosDraft.somenteVerificados && styles.switchKnobOn]} />
                </View>
              </Pressable>

              <Text style={styles.filterGroupLabel}>ORDENAÇÃO</Text>
              <View style={styles.optionRow}>
                {[
                  ["recent", "Mais novos"],
                  ["boost", "Destaques"],
                  ["random", "Aleatório"],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setFiltrosDraft((old) => ({ ...old, ordenarPor: value as SortFilter }))}
                    style={[styles.optionChip, filtrosDraft.ordenarPor === value && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, filtrosDraft.ordenarPor === value && styles.optionChipTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable style={styles.resetButton} onPress={limparFiltros}>
                <Icon name={ICONS.reset} size={20} color="#DDB059" />
                <Text style={styles.resetButtonText}>Limpar</Text>
              </Pressable>
              <Pressable style={styles.applyFiltersButton} onPress={aplicarFiltros}>
                <Text style={styles.applyFiltersText}>Aplicar filtros</Text>
                <Icon name={ICONS.check} size={20} color="#FFF" />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    backgroundColor: "rgba(0,0,0,0.985)",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(221,176,89,0.12)",
  },
  brandRow: {
    minHeight: 72,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  vipPill: {
    height: 42,
    minWidth: 72,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(221,176,89,0.48)",
    backgroundColor: "#080604",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  vipPillText: { color: "#E9B949", fontSize: 14, fontWeight: "800" },
  brand: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  brandTextWrap: { marginLeft: 4, alignItems: "center" },
  brandTitleRow: { flexDirection: "row", alignItems: "baseline" },
  brandGold: { color: "#E9B949", fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  brandRed: { color: "#E51D32", fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  brandTagline: { color: "#D6B35A", fontSize: 6.5, fontWeight: "800", letterSpacing: 1.8, marginTop: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  creditPill: {
    height: 42, borderRadius: 21, borderWidth: 1, borderColor: "rgba(221,176,89,0.48)",
    backgroundColor: "#080604", flexDirection: "row", alignItems: "center",
    paddingLeft: 10, paddingRight: 3, gap: 7,
  },
  creditValue: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  plus: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#C9252C",
    borderWidth: 1, borderColor: "#E3B65C", alignItems: "center", justifyContent: "center",
  },

  modeRow: { paddingHorizontal: 12, gap: 7, paddingVertical: 4 },
  modeChip: {
    height: 43, borderRadius: 22, borderWidth: 1, borderColor: "rgba(221,176,89,0.38)",
    backgroundColor: "#060606", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7, paddingHorizontal: 14,
  },
  modeChipActive: {
    backgroundColor: "#9A071C", borderColor: "#FF5364",
    shadowColor: "#E51D32", shadowOpacity: 0.44, shadowRadius: 9, elevation: 6,
  },
  modeChipFiltered: {
    borderColor: "#DDB059",
    backgroundColor: "rgba(221,176,89,0.07)",
  },
  modeText: { color: "#E8E3DF", fontSize: 12, fontWeight: "600" },
  modeTextActive: { color: "#FFF", fontWeight: "800" },

  filterRow: { paddingHorizontal: 12, gap: 7, paddingTop: 5, paddingBottom: 8 },
  filterChip: {
    height: 40, borderRadius: 20, borderWidth: 1, borderColor: "rgba(221,176,89,0.28)",
    backgroundColor: "#050505", flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 12,
  },
  filterChipActive: {
    borderColor: "rgba(221,176,89,0.62)",
    backgroundColor: "rgba(221,176,89,0.055)",
  },
  filterText: { color: "#EEEAE7", fontSize: 11, fontWeight: "600" },

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
    backgroundColor: "rgba(0,0,0,0.74)", paddingHorizontal: 10, paddingVertical: 7,
    flexDirection: "row", alignItems: "center", gap: 5,
  },
  backCountText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
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
    position: "absolute", top: 14, left: 14, height: 36, borderRadius: 18,
    backgroundColor: "rgba(16,16,16,0.82)", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, gap: 7,
  },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22E760" },
  onlineBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  cardMenuArea: { position: "absolute", top: 12, right: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  photoCount: {
    height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.74)",
    paddingHorizontal: 10, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 5,
  },
  photoCountText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  moreButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },

  profileInfo: { position: "absolute", left: 15, right: 15, bottom: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: {
    color: "#FFF", fontSize: 29, lineHeight: 34, fontWeight: "800", maxWidth: "84%",
    textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  location: { color: "#F5EEE9", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  bio: { color: "#F5F0EC", fontSize: 14, lineHeight: 20, marginTop: 7, fontWeight: "400" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    minHeight: 30, borderRadius: 15, borderWidth: 1, borderColor: "#D29A45",
    paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)",
  },
  tagText: { color: "#FFF", fontSize: 11, fontWeight: "600" },

  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 13 },
  actionCircle: {
    width: 55, height: 55, borderRadius: 28, borderWidth: 1.3,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,5,5,0.90)",
  },
  rewindCircle: {
    borderColor: "#DDAE43", backgroundColor: "rgba(11,8,3,0.96)",
    shadowColor: "#DDAE43", shadowOpacity: 0.18, shadowRadius: 7,
  },
  rewindCircleDisabled: { opacity: 0.34, shadowOpacity: 0 },
  rewindCostBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: "#161009",
    borderWidth: 1,
    borderColor: "#E9B949",
    alignItems: "center",
    justifyContent: "center",
  },
  rewindCostText: {
    color: "#F4C95E",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
  },
  nopeCircle: { borderColor: "#D82D45" },
  starCircle: { borderColor: "#D39A3D" },
  heartCircle: {
    borderColor: "#FF5068", backgroundColor: "rgba(145,0,24,0.76)",
    shadowColor: "#FF183B", shadowOpacity: 0.56, shadowRadius: 10, elevation: 7,
  },
  boltCircle: { borderColor: "#B947D5" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.80)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  filterSheet: {
    width: "100%",
    maxHeight: "82%",
    backgroundColor: "#070707",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(221,176,89,0.30)",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(221,176,89,0.38)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetClose: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#101010",
    borderWidth: 1, borderColor: "rgba(221,176,89,0.18)", alignItems: "center", justifyContent: "center",
  },
  sheetScroll: { maxHeight: 470 },
  filterSheetEyebrow: { color: "#DDB059", fontSize: 9, fontWeight: "800", letterSpacing: 2.8 },
  filterSheetTitle: { color: "#FFF", fontSize: 26, fontWeight: "800", marginTop: 4 },
  filterGroupLabel: {
    color: "#A49C96", fontSize: 9, fontWeight: "900", letterSpacing: 2,
    marginTop: 17, marginBottom: 9,
  },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  optionChip: {
    minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: "rgba(221,176,89,0.24)",
    backgroundColor: "#0B0B0B", paddingHorizontal: 13, alignItems: "center", justifyContent: "center",
  },
  optionChipActive: {
    backgroundColor: "rgba(145,0,24,0.72)", borderColor: "#E8BC58",
    shadowColor: "#E51D32", shadowOpacity: 0.22, shadowRadius: 5,
  },
  optionChipText: { color: "#BEB7B2", fontSize: 11, fontWeight: "600" },
  optionChipTextActive: { color: "#FFF", fontWeight: "800" },

  filterToggle: {
    minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: "rgba(221,176,89,0.18)",
    backgroundColor: "#0B0B0B", paddingHorizontal: 13, marginBottom: 9,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  filterToggleActive: { borderColor: "rgba(221,176,89,0.48)", backgroundColor: "rgba(98,0,13,0.25)" },
  toggleLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  toggleIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(221,176,89,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  filterToggleText: { color: "#F3EFEC", fontSize: 13, fontWeight: "700" },
  switchTrack: {
    width: 45, height: 25, borderRadius: 13, backgroundColor: "#292929",
    padding: 3, justifyContent: "center",
  },
  switchTrackOn: { backgroundColor: "#8F0719" },
  switchKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: "#777" },
  switchKnobOn: { backgroundColor: "#F1C258", alignSelf: "flex-end" },

  sheetActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  resetButton: {
    height: 52, borderRadius: 26, minWidth: 110, borderWidth: 1, borderColor: "rgba(221,176,89,0.32)",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#0B0B0B",
  },
  resetButtonText: { color: "#DDB059", fontSize: 13, fontWeight: "800" },
  applyFiltersButton: {
    flex: 1, height: 52, borderRadius: 26, backgroundColor: "#9D061B",
    borderWidth: 1, borderColor: "#F0C75D", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  applyFiltersText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

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
  emptyArrowIcon: { position: "absolute", right: 22 },

  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
