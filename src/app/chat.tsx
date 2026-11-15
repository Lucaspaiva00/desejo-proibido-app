import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAvoidingView as NativeKeyboardAvoidingView,
} from "react-native-keyboard-controller";
import { buscarUsuarioLogado } from "../services/auth";
import { api } from "../services/api";
import { presentearCreditos } from "../services/carteira";
import {
  apagarMensagem,
  buscarMensagens,
  desbloquearMidia,
  editarMensagem,
  enviarAudio,
  enviarFoto,
  enviarMensagemTexto,
  liberarConversa,
  listarConversas,
  statusConversa,
} from "../services/chat";
import { enviarPresente, listarPresentes } from "../services/presentes";
import { uploadAudioCloudinary, uploadFotoCloudinary } from "../services/upload";
import { obterToken } from "../storage/auth";

const ChatKeyboardAvoidingView =
  Platform.OS === "android" ? NativeKeyboardAvoidingView : KeyboardAvoidingView;

const GOLD = "#E8BE5A";
const RED = "#C70A27";
const RED_BRIGHT = "#F21F42";

function absoluteAsset(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `https://desejoproibido.app${path.startsWith("/") ? path : `/${path}`}`;
}

function formatTime(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chat() {
  const params = useLocalSearchParams<{ conversaId?: string }>();
  const conversaIdParam = params.conversaId ? String(params.conversaId) : "";
  const gravador = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const gravadorOcupado = useRef(false);
  const conversaEmFoco = useRef(false);
  const gravacaoAtiva = useRef(false);
  const envioCreditosOcupado = useRef(false);
  const [gravando, setGravando] = useState(false);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [dialogo, setDialogo] = useState<"opcoes" | "creditos" | null>(null);
  const [quantidadeCreditos, setQuantidadeCreditos] = useState("");
  const [transferindoCreditos, setTransferindoCreditos] = useState(false);

  useFocusEffect(useCallback(() => {
    conversaEmFoco.current = true;
    return () => {
      conversaEmFoco.current = false;
      if (!gravacaoAtiva.current) return;
      gravacaoAtiva.current = false;
      setGravando(false);
      gravador.stop().catch(() => {}).finally(() => {
        setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      });
    };
  }, [gravador]));

  const [meuId, setMeuId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [conversaAtual, setConversaAtual] = useState<any>(null);
  const [outroDetalhes, setOutroDetalhes] = useState<any>(null);
  const [texto, setTexto] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [presentes, setPresentes] = useState<any[]>([]);
  const [chatLiberado, setChatLiberado] = useState(false);
  const [saldoCreditos, setSaldoCreditos] = useState(0);
  const [custoCreditos, setCustoCreditos] = useState(10);
  const [enviando, setEnviando] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [presenteEmEnvio, setPresenteEmEnvio] = useState<string | null>(null);

  useEffect(() => {
    iniciar();
  }, [conversaIdParam]);

  useEffect(() => {
    if (!conversaIdParam) return;

    const interval = setInterval(() => {
      carregarMensagens(conversaIdParam, true);
      carregarStatus(conversaIdParam);
    }, 2500);

    return () => clearInterval(interval);
  }, [conversaIdParam]);

  async function authHeader() {
    const token = await obterToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function iniciar() {
    if (!conversaIdParam) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [usuario, lista, listaPresentes] = await Promise.all([
        buscarUsuarioLogado(),
        listarConversas(),
        listarPresentes(),
      ]);

      setMeuId(usuario?.id || "");
      setPresentes(Array.isArray(listaPresentes) ? listaPresentes : []);

      const conversa = (lista || []).find(
        (item: any) => String(item.id) === String(conversaIdParam)
      );

      setConversaAtual(conversa || null);

      if (conversa) {
        carregarOutroUsuario(conversa);
      }

      await Promise.all([
        carregarStatus(conversaIdParam),
        carregarMensagens(conversaIdParam),
      ]);
    } catch (error) {
      console.log("Erro ao iniciar chat:", error);
      Alert.alert("Erro", "Não foi possível carregar a conversa.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarOutroUsuario(conversa: any) {
    const outroId = conversa?.outroUsuarioId || conversa?.outro?.id;
    if (!outroId) return;

    try {
      const headers = await authHeader();
      const { data } = await api.get(`/usuarios/${outroId}`, { headers });
      setOutroDetalhes(data || null);
    } catch (error) {
      console.log("Não foi possível carregar detalhes do usuário:", error);
    }
  }

  async function carregarMensagens(conversaId: string, silent = false) {
    try {
      const data = await buscarMensagens(conversaId);
      const novas = Array.isArray(data?.mensagens) ? data.mensagens : [];
      setMensagens(novas);

    } catch (error) {
      if (!silent) console.log("Erro ao carregar mensagens:", error);
    }
  }

  async function carregarStatus(conversaId: string) {
    try {
      const data = await statusConversa(conversaId);
      setChatLiberado(!!data.chatLiberado);
      setSaldoCreditos(Number(data.saldoCreditos || 0));
      setCustoCreditos(Number(data.custoCreditos || 10));
    } catch (error) {
      console.log("Erro ao carregar status:", error);
    }
  }

  async function liberar() {
    try {
      if (!conversaIdParam) return;

      const data = await liberarConversa(conversaIdParam);
      setChatLiberado(!!data.chatLiberado);
      setSaldoCreditos(Number(data.saldoCreditos || 0));

      await carregarMensagens(conversaIdParam);
      Alert.alert("Chat liberado", "Agora você pode conversar normalmente.");
    } catch (error: any) {
      Alert.alert(
        "Não foi possível liberar",
        error?.response?.data?.erro || "Confira seu saldo de créditos."
      );
    }
  }

  async function enviarAsset(uri: string) {
    if (!conversaIdParam || !chatLiberado) return;

    try {
      setEnviandoMidia(true);
      const cloud = await uploadFotoCloudinary(uri);
      const mediaPath = `${cloud.public_id}.${cloud.format}`;

      await enviarFoto(conversaIdParam, mediaPath, mediaPath);
      await carregarMensagens(conversaIdParam);
    } catch (error: any) {
      console.log("Erro ao enviar foto:", error?.response?.data || error?.message);
      Alert.alert("Erro", "Não foi possível enviar a foto.");
    } finally {
      setEnviandoMidia(false);
    }
  }

  async function tirarFoto() {
    if (!chatLiberado) return;

    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert("Permissão necessária", "Permita o acesso à câmera.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.82,
        allowsEditing: false,
      });

      if (!result.canceled) {
        await enviarAsset(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Câmera indisponível", "Não foi possível abrir a câmera.");
    }
  }

  async function selecionarFoto() {
    if (!chatLiberado) return;

    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert("Permissão necessária", "Permita o acesso à galeria.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.82,
      });

      if (!result.canceled) {
        await enviarAsset(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Galeria indisponível", "Não foi possível abrir a galeria.");
    }
  }

  async function desbloquearAnexo(item: any) {
    if (!item?.id) return;

    try {
      await desbloquearMidia(item.id);
      await carregarMensagens(conversaIdParam);
      await carregarStatus(conversaIdParam);
    } catch (error: any) {
      Alert.alert(
        "Não foi possível desbloquear",
        error?.response?.data?.erro || "Confira seu saldo de créditos."
      );
    }
  }

  async function enviarPresenteChat(presenteId: string) {
    try {
      setPresenteEmEnvio(presenteId);
      await enviarPresente(conversaIdParam, presenteId);

      await Promise.all([
        carregarMensagens(conversaIdParam),
        carregarStatus(conversaIdParam),
      ]);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.erro || "Não foi possível enviar o presente."
      );
    } finally {
      setPresenteEmEnvio(null);
    }
  }

  async function enviarCreditos() {
    const destinatarioId = conversaAtual?.outroUsuarioId || conversaAtual?.outro?.id;
    const quantidade = Number(quantidadeCreditos);
    if (!destinatarioId || !Number.isSafeInteger(quantidade) || quantidade < 1 || envioCreditosOcupado.current) return;

    envioCreditosOcupado.current = true;
    setTransferindoCreditos(true);
    try {
      await presentearCreditos(destinatarioId, quantidade, "Presente enviado pelo chat");
      setDialogo(null);
      setQuantidadeCreditos("");
      await carregarStatus(conversaIdParam);
      Alert.alert("Créditos enviados", `${quantidade} créditos enviados.`);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || error?.response?.data?.error || "Falha ao enviar créditos.");
    } finally {
      envioCreditosOcupado.current = false;
      setTransferindoCreditos(false);
    }
  }

  function abrirMenuMensagem(item: any) {
    const minha = String(item.autorId) === String(meuId);
    if (!minha || item.tipo !== "TEXTO") return;

    Alert.alert("Mensagem", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Editar",
        onPress: () => {
          setTexto(item.texto || "");
          setEditandoId(item.id);
        },
      },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          try {
            await apagarMensagem(item.id);
            await carregarMensagens(conversaIdParam);
          } catch {
            Alert.alert("Erro", "Não foi possível apagar a mensagem.");
          }
        },
      },
    ]);
  }

  async function enviar() {
    if (!conversaIdParam || !texto.trim() || !chatLiberado || enviando) return;

    const mensagem = texto.trim();
    try {
      setEnviando(true);

      if (editandoId) {
        await editarMensagem(editandoId, mensagem);
        setEditandoId(null);
      } else {
        await enviarMensagemTexto(conversaIdParam, mensagem);
      }

      setTexto((atual) => atual === texto ? "" : atual);

      await Promise.all([
        carregarMensagens(conversaIdParam),
        carregarStatus(conversaIdParam),
      ]);
    } catch (error: any) {
      if (error?.response?.status === 402) {
        Alert.alert(
          "Créditos insuficientes",
          error?.response?.data?.erro ||
            "Você precisa de créditos para enviar esta mensagem."
        );
      } else {
        Alert.alert(
          "Erro",
          error?.response?.data?.erro || "Não foi possível enviar a mensagem."
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  function nomeConversa() {
    return (
      outroDetalhes?.perfil?.nome ||
      conversaAtual?.outro?.perfil?.nome ||
      conversaAtual?.outro?.nome ||
      conversaAtual?.outro?.email ||
      "Usuário"
    );
  }

  function fotoConversa() {
    return (
      outroDetalhes?.fotos?.find((f: any) => f.principal)?.url ||
      outroDetalhes?.fotos?.[0]?.url ||
      conversaAtual?.outro?.fotos?.find((f: any) => f.principal)?.url ||
      conversaAtual?.outro?.fotos?.[0]?.url ||
      null
    );
  }

  function abrirPerfil() {
    const id = conversaAtual?.outroUsuarioId || conversaAtual?.outro?.id;
    if (id) router.push(`/usuario?id=${id}`);
  }

  async function alternarAudio() {
    if (!conversaIdParam || !chatLiberado || gravadorOcupado.current) return;

    gravadorOcupado.current = true;
    let continuaGravando = false;
    try {
      if (!gravando) {
        const permissao = await AudioModule.requestRecordingPermissionsAsync();
        if (!permissao.granted) {
          Alert.alert("Permissão necessária", "Permita o acesso ao microfone para gravar.");
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        if (!conversaEmFoco.current) return;
        await gravador.prepareToRecordAsync();
        if (!conversaEmFoco.current) {
          await gravador.stop().catch(() => {});
          return;
        }
        gravador.record();
        gravacaoAtiva.current = true;
        setGravando(true);
        continuaGravando = true;
        return;
      }

      gravacaoAtiva.current = false;
      setEnviandoAudio(true);
      const duracao = gravador.getStatus().durationMillis;
      await gravador.stop();
      if (!gravador.uri || duracao < 500) {
        Alert.alert("Áudio muito curto", "Grave pelo menos meio segundo e tente novamente.");
        return;
      }

      const mediaPath = await uploadAudioCloudinary(gravador.uri);
      await enviarAudio(conversaIdParam, mediaPath, Math.round(duracao / 1000));
      await Promise.all([carregarMensagens(conversaIdParam), carregarStatus(conversaIdParam)]);
    } catch (error: any) {
      Alert.alert("Não foi possível gravar ou enviar", error?.response?.data?.erro || error?.message);
    } finally {
      if (!continuaGravando) {
        setGravando(false);
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }
      setEnviandoAudio(false);
      gravadorOcupado.current = false;
    }
  }

  function abrirVideochamada() {
    router.push(`/videochamada?conversaId=${conversaIdParam}`);
  }

  const avatar = fotoConversa();
  const nome = nomeConversa();
  const isPremium = !!outroDetalhes?.isPremium;
  const verificado = !!outroDetalhes?.perfil?.verificado;

  const mensagensRecentes = useMemo(() => [...mensagens].reverse(), [mensagens]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={GOLD} />
        <Text style={styles.loadingText}>Abrindo conversa...</Text>
      </View>
    );
  }

  if (!conversaIdParam) {
    return (
      <View style={styles.emptyConversation}>
        <Text style={styles.emptyConversationTitle}>Nenhuma conversa selecionada</Text>
        <Pressable
          onPress={() => router.replace("/conversas")}
          style={styles.emptyConversationButton}
        >
          <Text style={styles.emptyConversationButtonText}>Ver conversas</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ChatKeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ android: "height", ios: "padding" })}
      {...(Platform.OS === "android" ? { automaticOffset: true } : {})}
    >
      <View style={styles.chatHeader}>
        <Pressable
          onPress={() => router.replace("/conversas")}
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerBack,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" } as any}
            size={27}
            tintColor={GOLD}
            style={styles.headerBackIcon}
          />
        </Pressable>

        <Pressable onPress={abrirPerfil} style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {nome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {chatLiberado ? <View style={styles.onlineDot} /> : null}
        </Pressable>

        <View style={styles.headerIdentity}>
          <Text numberOfLines={1} style={styles.headerName}>
            {nome}
          </Text>
          <Text style={styles.headerStatus}>
            {chatLiberado ? "Conversa liberada" : "Acesso restrito"}
          </Text>

          <View style={styles.badges}>
            {verificado ? (
              <View style={styles.badgeDiamond}>
                <SymbolView
                  name={{ ios: "checkmark.seal.fill", android: "verified", web: "verified" } as any}
                  size={16}
                  tintColor="#61C8FF"
                  style={styles.badgeIcon}
                />
              </View>
            ) : null}

            {isPremium ? (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Chamada de áudio",
                "Chamadas de áudio ainda não estão disponíveis nesta versão."
              )
            }
            style={({ pressed }) => [
              styles.headerRound,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: "phone.fill", android: "call", web: "call" } as any}
              size={23}
              tintColor={GOLD}
              style={styles.headerRoundIcon}
            />
          </Pressable>

          <Pressable
            onPress={abrirVideochamada}
            style={({ pressed }) => [
              styles.headerRound,
              styles.headerRoundVideo,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: "video.fill", android: "videocam", web: "videocam" } as any}
              size={24}
              tintColor="#FFF"
              style={styles.headerRoundIcon}
            />
          </Pressable>

          <Pressable
            onPress={() => setDialogo("opcoes")}
            style={({ pressed }) => [
              styles.moreRound,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.moreRoundText}>•••</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.creditStrip}>
        <View style={styles.creditBadge}>
          <SymbolView
            name={{ ios: "diamond.fill", android: "diamond", web: "diamond" } as any}
            size={18}
            tintColor="#4EC7FF"
            style={styles.creditDiamondIcon}
          />
          <Text style={styles.creditBalance}>
            {saldoCreditos.toLocaleString("pt-BR")}
          </Text>
          <Pressable
            onPress={() => router.push("/creditos")}
            style={styles.creditPlus}
          >
            <Text style={styles.creditPlusText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.dateWrap}>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>Hoje</Text>
        </View>
      </View>

      <FlatList
        inverted
        style={styles.messageList}
        keyboardShouldPersistTaps="handled"
        data={mensagensRecentes}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const minha = String(item.autorId) === String(meuId);
          const time = formatTime(item.criadoEm);

          if (item.tipo === "PRESENTE") {
            const imageUrl = absoluteAsset(item?.metaJson?.imagemUrl);

            return (
              <View
                style={[
                  styles.giftMessage,
                  minha ? styles.alignMine : styles.alignOther,
                ]}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="contain"
                    style={styles.giftMessageImage}
                  />
                ) : null}
                <View style={styles.mediaMetaRow}>
                  <Text style={styles.messageTime}>{time}</Text>
                  {minha ? <Text style={styles.checks}>✓✓</Text> : null}
                </View>
              </View>
            );
          }

          if (item.tipo === "AUDIO") {
            return (
              <View style={[styles.bubble, minha ? styles.bubbleMine : styles.bubbleOther]}>
                {item.locked ? (
                  <Pressable onPress={() => desbloquearAnexo(item)}>
                    <Text style={styles.bubbleText}>Desbloquear áudio · {Number(item.custoMoedas || 0)} créditos</Text>
                  </Pressable>
                ) : item.audioUrl ? (
                  <AudioMessage uri={item.audioUrl} />
                ) : (
                  <Text style={styles.bubbleText}>Áudio indisponível</Text>
                )}
                <Text style={styles.messageTime}>{time}</Text>
              </View>
            );
          }

          if (item.tipo === "FOTO") {
            const photoUri = item.mediaUrl || item.thumbUrl;

            return (
              <Pressable
                onPress={() => item.locked && desbloquearAnexo(item)}
                style={[
                  styles.photoMessage,
                  minha ? styles.alignMine : styles.alignOther,
                ]}
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    resizeMode="cover"
                    style={[
                      styles.photoMessageImage,
                      item.locked && styles.photoLocked,
                    ]}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <SymbolView
                      name={{ ios: "photo", android: "image", web: "image" } as any}
                      size={34}
                      tintColor={GOLD}
                      style={styles.photoPlaceholderIcon}
                    />
                  </View>
                )}

                {item.locked ? (
                  <View style={styles.lockedOverlay}>
                    <SymbolView
                      name={{ ios: "lock.fill", android: "lock", web: "lock" } as any}
                      size={24}
                      tintColor="#FFF"
                      style={styles.lockedIcon}
                    />
                    <Text style={styles.lockedTitle}>Desbloquear foto</Text>
                    <Text style={styles.lockedCost}>
                      ♦ {Number(item.custoMoedas || 0)} créditos
                    </Text>
                  </View>
                ) : null}

                <View style={styles.photoTime}>
                  <Text style={styles.messageTime}>{time}</Text>
                  {minha ? <Text style={styles.checks}>✓✓</Text> : null}
                </View>
              </Pressable>
            );
          }

          const sistema = item.tipo === "SISTEMA";

          return (
            <Pressable
              onLongPress={() => abrirMenuMensagem(item)}
              style={[
                styles.bubble,
                minha ? styles.bubbleMine : styles.bubbleOther,
                sistema && styles.systemBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  sistema && styles.systemBubbleText,
                ]}
              >
                {item.textoExibido || item.texto || ""}
              </Text>

              <View style={styles.bubbleMeta}>
                <Text style={styles.messageTime}>{time}</Text>
                {minha ? <Text style={styles.checks}>✓✓</Text> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.noMessagesWrap}>
            <Text style={styles.noMessages}>Comece a conversa.</Text>
          </View>
        }
      />

      {!chatLiberado ? (
        <View style={styles.paywall}>
          <View style={styles.paywallCopy}>
            <Text style={styles.paywallTitle}>Conversa privada</Text>
            <Text style={styles.paywallText}>
              Libere o chat para enviar mensagens, fotos e presentes.
            </Text>
          </View>

          <Pressable
            onPress={liberar}
            style={({ pressed }) => [
              styles.unlockButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.unlockText}>
              Liberar por {custoCreditos}
            </Text>
            <SymbolView
              name={{ ios: "diamond.fill", android: "diamond", web: "diamond" } as any}
              size={16}
              tintColor="#7CE1FF"
              style={styles.unlockDiamond}
            />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.chatControls}>
        {presentes.length > 0 ? (
          <View style={styles.giftsStrip}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.giftsContent}
            >
              {presentes.map((item: any) => {
                const imageUrl = absoluteAsset(item.imagemUrl);
                const enviandoEste = presenteEmEnvio === String(item.id);

                return (
                  <Pressable
                    key={String(item.id)}
                    disabled={!chatLiberado || !!presenteEmEnvio}
                    onPress={() => enviarPresenteChat(String(item.id))}
                    style={[
                      styles.giftItem,
                      (!chatLiberado || enviandoEste) && styles.disabled,
                    ]}
                  >
                    <View style={styles.giftImageFrame}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          resizeMode="contain"
                          style={styles.giftImage}
                        />
                      ) : null}
                    </View>
                    <View style={styles.giftCostRow}>
                      <SymbolView
                        name={{ ios: "diamond.fill", android: "diamond", web: "diamond" } as any}
                        size={12}
                        tintColor="#42CBFF"
                        style={styles.giftDiamond}
                      />
                      <Text style={styles.giftCost}>
                        {Number(item.custoCreditos || 0)}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={styles.giftName}>
                      {item.nome || "Presente"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.toolsStrip}>
          <View style={styles.toolsContent}>
            <Tool
              toolbar
              label="Foto"
              color="#E51D43"
              icon={{ ios: "camera.fill", android: "photo_camera", web: "photo_camera" }}
              onPress={tirarFoto}
              disabled={!chatLiberado || enviandoMidia}
            />
            <Tool
              toolbar
              label="Galeria"
              color="#7C37E8"
              icon={{ ios: "photo.fill", android: "photo_library", web: "photo_library" }}
              onPress={selecionarFoto}
              disabled={!chatLiberado || enviandoMidia}
            />
            <Tool
              toolbar
              label={gravando ? "Enviar áudio" : "Áudio"}
              color="#156DDF"
              icon={{ ios: "mic.fill", android: "mic", web: "mic" }}
              onPress={alternarAudio}
              disabled={!chatLiberado || enviandoAudio}
            />
            <Tool
              toolbar
              label="Vídeo"
              color="#9A6A00"
              icon={{ ios: "video.fill", android: "videocam", web: "videocam" }}
              onPress={abrirVideochamada}
            />
            <Tool
              toolbar
              label="Presente"
              color="#A80724"
              icon={{ ios: "gift.fill", android: "redeem", web: "redeem" }}
              onPress={() => {
                if (!chatLiberado) {
                  Alert.alert("Conversa bloqueada", "Libere o chat antes de enviar presentes.");
                }
              }}
            />
            <Tool
              toolbar
              label="Comprar créditos"
              color="#087D52"
              icon={{ ios: "wallet.bifold.fill", android: "wallet", web: "wallet" }}
              onPress={() => router.push("/creditos")}
            />
            <Tool
              toolbar
              label="Mais"
              color="#34363C"
              icon={{ ios: "plus", android: "add", web: "add" }}
              onPress={() => setDialogo("opcoes")}
            />
          </View>
        </View>

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <SymbolView
              name={{ ios: "face.smiling", android: "sentiment_satisfied", web: "sentiment_satisfied" } as any}
              size={23}
              tintColor="#9C9794"
              style={styles.smileIcon}
            />
            <TextInput
              value={texto}
              onChangeText={setTexto}
              editable={chatLiberado}
              placeholder={
                editandoId ? "Editando mensagem..." : "Digite uma mensagem..."
              }
              placeholderTextColor="#77716D"
              style={styles.input}
              submitBehavior="submit"
              returnKeyType="send"
              onSubmitEditing={enviar}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={gravando ? "Parar e enviar áudio" : "Gravar áudio"}
            disabled={!chatLiberado || enviandoAudio}
            onPress={alternarAudio}
            style={[styles.audioButton, gravando && styles.sendButton, (!chatLiberado || enviandoAudio) && styles.disabled]}
          >
            <SymbolView
              name={(gravando
                ? { ios: "stop.fill", android: "stop", web: "stop" }
                : { ios: "mic.fill", android: "mic", web: "mic" }) as any}
              size={23}
              tintColor="#FFF"
              style={styles.sendIcon}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Enviar mensagem"
            disabled={!chatLiberado || enviando || !texto.trim()}
            onPress={enviar}
            style={({ pressed }) => [
              styles.sendButton,
              (!chatLiberado || enviando || !texto.trim()) &&
                styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: "paperplane.fill", android: "send", web: "send" } as any}
              size={25}
              tintColor="#FFF"
              style={styles.sendIcon}
            />
          </Pressable>
        </View>
      </View>

      <Modal visible={dialogo !== null} transparent animationType="fade"
        onRequestClose={() => { if (!transferindoCreditos) setDialogo(null); }}>
        <KeyboardAvoidingView style={styles.dialogBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {dialogo === "opcoes" ? <View style={styles.dialog}>
            <Text style={styles.bubbleText}>Opções da conversa</Text>
            <View style={[styles.dialogActions, styles.dialogTools]}>
              <Tool label="Enviar créditos" color="#087D52"
                icon={{ ios: "wallet.bifold.fill", android: "wallet", web: "wallet" }}
                onPress={() => { setDialogo("creditos"); }} />
              <Tool label="Ver perfil" color="#9A6A00"
                icon={{ ios: "person.crop.circle", android: "person", web: "person" }}
                onPress={() => { setDialogo(null); abrirPerfil(); }} />
              <Tool label="Cancelar" color="#34363C"
                icon={{ ios: "xmark", android: "close", web: "close" }}
                onPress={() => setDialogo(null)} />
            </View>
          </View> : dialogo === "creditos" ? <View style={styles.dialog}>
            <Text style={styles.bubbleText}>Enviar créditos</Text>
            <View style={styles.inputWrap}>
              <TextInput value={quantidadeCreditos} onChangeText={setQuantidadeCreditos}
                editable={!transferindoCreditos} placeholder="Quantidade de créditos" placeholderTextColor="#999"
                keyboardType="number-pad" accessibilityLabel="Quantidade de créditos" style={styles.input} />
            </View>
            <View style={styles.dialogActions}>
              <Pressable disabled={transferindoCreditos} onPress={() => setDialogo(null)} hitSlop={8}>
                <Text style={styles.bubbleText}>Cancelar</Text>
              </Pressable>
              <Pressable disabled={transferindoCreditos || !/^[1-9][0-9]*$/.test(quantidadeCreditos)}
                onPress={enviarCreditos} hitSlop={8}>
                <Text style={styles.bubbleText}>{transferindoCreditos ? "Enviando..." : "Enviar"}</Text>
              </Pressable>
            </View>
          </View> : null}
        </KeyboardAvoidingView>
      </Modal>
    </ChatKeyboardAvoidingView>
  );
}

function AudioMessage({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        if (status.playing) {
          player.pause();
        } else {
          if (status.duration > 0 && status.currentTime >= status.duration) await player.seekTo(0);
          player.play();
        }
      }}
    >
      <Text style={styles.bubbleText}>{status.playing ? "Pausar áudio" : "Reproduzir áudio"}</Text>
    </Pressable>
  );
}

function Tool({
  label,
  icon,
  color,
  onPress,
  disabled = false,
  toolbar = false,
}: {
  label: string;
  icon: { ios: string; android: string; web: string };
  color: string;
  onPress: () => void;
  disabled?: boolean;
  toolbar?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        toolbar && styles.toolbarTool,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.toolIcon, toolbar && styles.toolbarIcon, { borderColor: color, backgroundColor: `${color}33` }]}>
        <SymbolView
          name={icon as any}
          size={22}
          tintColor={color === "#9A6A00" ? "#F5D060" : "#FFF"}
        />
      </View>
      <Text style={styles.toolLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#8F8985",
    fontSize: 12,
  },

  emptyConversation: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyConversationTitle: {
    color: "#FFF",
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyConversationButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: RED,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    marginTop: 18,
  },
  emptyConversationButtonText: {
    color: "#FFF",
    fontWeight: "800",
  },

  chatHeader: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#030303",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.34)",
  },
  headerBack: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackIcon: {
    width: 28,
    height: 28,
  },

  avatarWrap: {
    width: 59,
    height: 59,
    borderRadius: 30,
    marginRight: 10,
  },
  headerAvatar: {
    width: 59,
    height: 59,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: GOLD,
  },
  avatarFallback: {
    backgroundColor: "#15110A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: GOLD,
    fontSize: 24,
    fontWeight: "900",
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#24D856",
    borderWidth: 2,
    borderColor: "#000",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    color: "#FFF",
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "800",
  },
  headerStatus: {
    color: "#A19A95",
    fontSize: 11,
    marginTop: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  badgeDiamond: {
    width: 30,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(79,192,255,0.55)",
    backgroundColor: "rgba(0,95,144,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIcon: {
    width: 17,
    height: 17,
  },
  vipBadge: {
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(232,190,90,0.08)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  vipBadgeText: {
    color: "#F3CF6A",
    fontSize: 10,
    fontWeight: "900",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 6,
  },
  headerRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: GOLD,
    backgroundColor: "rgba(27,21,10,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRoundVideo: {
    borderColor: "#EF2449",
    backgroundColor: "#99051F",
  },
  headerRoundIcon: {
    width: 25,
    height: 25,
  },
  moreRound: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  moreRoundText: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "900",
    marginTop: -5,
  },

  creditStrip: {
    minHeight: 37,
    backgroundColor: "#030303",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.24)",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  creditBadge: {
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(18,14,6,0.96)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 3,
    gap: 7,
  },
  creditDiamondIcon: {
    width: 19,
    height: 19,
  },
  creditBalance: {
    color: "#F5D46D",
    fontSize: 15,
    fontWeight: "900",
  },
  creditPlus: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#E4B64D",
    alignItems: "center",
    justifyContent: "center",
  },
  creditPlusText: {
    color: "#261700",
    fontSize: 23,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: -2,
  },

  dateWrap: {
    alignItems: "center",
    paddingVertical: 2,
    backgroundColor: "#000",
  },
  dateChip: {
    minWidth: 78,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    color: "#BEB8B4",
    fontSize: 11,
  },

  messageList: { flex: 1, minHeight: 0 },
  dialogBackdrop: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0009" },
  dialog: { width: "90%", maxWidth: 370, padding: 20, gap: 14, borderRadius: 18, borderWidth: 1, borderColor: GOLD, backgroundColor: "#110D0B" },
  dialogTools: { alignItems: "flex-start" },
  dialogActions: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  audioButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#24344D", alignItems: "center", justifyContent: "center" },
  messages: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  noMessagesWrap: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  noMessages: {
    color: "#716C68",
    fontSize: 12,
  },

  bubble: {
    maxWidth: "78%",
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#99051D",
    borderColor: "#E32846",
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#0E0B09",
    borderColor: "rgba(232,190,90,0.30)",
    borderBottomLeftRadius: 6,
  },
  systemBubble: {
    backgroundColor: "rgba(139,5,28,0.88)",
  },
  bubbleText: {
    color: "#FFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  systemBubbleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bubbleMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    color: "#B69CA1",
    fontSize: 8.5,
  },
  checks: {
    color: "#E93B59",
    fontSize: 10,
    fontWeight: "900",
  },

  giftMessage: {
    width: 154,
    minHeight: 145,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(232,190,90,0.28)",
    backgroundColor: "rgba(20,14,7,0.88)",
    padding: 8,
    marginBottom: 9,
  },
  giftMessageImage: {
    width: "100%",
    height: 116,
  },
  mediaMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  alignMine: {
    alignSelf: "flex-end",
  },
  alignOther: {
    alignSelf: "flex-start",
  },

  photoMessage: {
    width: 190,
    height: 215,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(232,190,90,0.42)",
    backgroundColor: "#111",
    marginBottom: 9,
  },
  photoMessageImage: {
    width: "100%",
    height: "100%",
  },
  photoLocked: {
    opacity: 0.34,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: {
    width: 36,
    height: 36,
  },
  lockedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  lockedIcon: {
    width: 25,
    height: 25,
  },
  lockedTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 7,
  },
  lockedCost: {
    color: "#F2C961",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },
  photoTime: {
    position: "absolute",
    right: 8,
    bottom: 7,
    minHeight: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.58)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
  },

  paywall: {
    minHeight: 79,
    borderTopWidth: 1,
    borderTopColor: "rgba(232,190,90,0.28)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.18)",
    backgroundColor: "#090705",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  paywallCopy: {
    flex: 1,
  },
  paywallTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  paywallText: {
    color: "#918A85",
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 2,
  },
  unlockButton: {
    minWidth: 105,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A8071C",
    borderWidth: 1,
    borderColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 11,
  },
  unlockText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  unlockDiamond: {
    width: 17,
    height: 17,
  },

  chatControls: { flexShrink: 0 },

  giftsStrip: {
    backgroundColor: "#050302",
    borderTopWidth: 1,
    borderTopColor: "rgba(232,190,90,0.42)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.24)",
  },
  giftsContent: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 7,
  },
  giftItem: {
    width: 71,
    alignItems: "center",
  },
  giftImageFrame: {
    width: 65,
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,190,90,0.48)",
    backgroundColor: "#100C08",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  giftImage: {
    width: 58,
    height: 58,
  },
  giftCostRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  giftDiamond: {
    width: 12,
    height: 12,
  },
  giftCost: {
    color: "#F2C961",
    fontSize: 9.5,
    fontWeight: "900",
  },
  giftName: {
    width: 68,
    color: "#C9C2BD",
    fontSize: 8.5,
    textAlign: "center",
    marginTop: 2,
  },

  toolsStrip: {
    backgroundColor: "#030303",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.20)",
  },
  toolsContent: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
  },
  tool: {
    width: 53,
    alignItems: "center",
  },
  toolbarTool: { flex: 1, minWidth: 0, width: undefined },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.3,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarIcon: { width: 34, height: 34 },
  toolLabel: {
    color: "#D8D0CB",
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: "center",
    marginTop: 5,
  },

  composer: {
    flexShrink: 0,
    minHeight: 72,
    backgroundColor: "#030303",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 51,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(232,190,90,0.30)",
    backgroundColor: "#0D0C0B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  smileIcon: {
    width: 24,
    height: 24,
    marginRight: 7,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  sendButton: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: "#D00A2C",
    borderWidth: 1,
    borderColor: "#FF3152",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.40,
  },
  sendIcon: {
    width: 27,
    height: 27,
  },

  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
