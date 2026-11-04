import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { buscarUsuarioLogado } from "../services/auth";
import { api } from "../services/api";
import { presentearCreditos } from "../services/carteira";
import {
  apagarMensagem,
  buscarMensagens,
  desbloquearMidia,
  editarMensagem,
  enviarFoto,
  enviarMensagemTexto,
  liberarConversa,
  listarConversas,
  statusConversa,
} from "../services/chat";
import { enviarPresente, listarPresentes } from "../services/presentes";
import { uploadFotoCloudinary } from "../services/upload";
import { obterToken } from "../storage/auth";

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
  const listaRef = useRef<FlatList>(null);

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

      if (!silent) {
        setTimeout(() => {
          listaRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
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

  async function desbloquearFoto(item: any) {
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

  function enviarCreditos() {
    const destinatarioId =
      conversaAtual?.outroUsuarioId ||
      conversaAtual?.outro?.id;

    if (!destinatarioId) {
      Alert.alert("Erro", "Destinatário não encontrado.");
      return;
    }

    if (Platform.OS !== "ios") {
      Alert.alert(
        "Enviar créditos",
        "No navegador, use a opção Presentes ou Comprar créditos. O envio manual de créditos fica disponível no aplicativo."
      );
      return;
    }

    Alert.prompt(
      "Enviar créditos",
      "Digite a quantidade",
      async (valor) => {
        try {
          const quantidade = Number(valor);
          if (!quantidade || quantidade <= 0) return;

          await presentearCreditos(
            destinatarioId,
            quantidade,
            "Presente enviado pelo chat"
          );

          await carregarStatus(conversaIdParam);
          Alert.alert("Créditos enviados", `${quantidade} créditos enviados.`);
        } catch (e: any) {
          Alert.alert(
            "Erro",
            e?.response?.data?.erro ||
              e?.response?.data?.error ||
              e?.message ||
              "Falha ao enviar créditos."
          );
        }
      },
      "plain-text"
    );
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
    if (!conversaIdParam || !texto.trim() || !chatLiberado) return;

    try {
      setEnviando(true);

      if (editandoId) {
        await editarMensagem(editandoId, texto.trim());
        setEditandoId(null);
      } else {
        await enviarMensagemTexto(conversaIdParam, texto.trim());
      }

      setTexto("");

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

  function menuConversa() {
    Alert.alert("Conversa", undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Ver perfil", onPress: abrirPerfil },
      {
        text: "Enviar créditos",
        onPress: enviarCreditos,
      },
    ]);
  }

  function audioIndisponivel() {
    Alert.alert(
      "Áudio",
      "A gravação de áudio ainda não está habilitada nesta versão."
    );
  }

  function videoIndisponivel() {
    Alert.alert(
      "Videochamada",
      "A interface de videochamada será conectada ao backend na próxima etapa. Nenhuma cobrança foi iniciada."
    );
  }

  const avatar = fotoConversa();
  const nome = nomeConversa();
  const isPremium = !!outroDetalhes?.isPremium;
  const verificado = !!outroDetalhes?.perfil?.verificado;

  const presentesVisiveis = useMemo(
    () => presentes.slice(0, 8),
    [presentes]
  );

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            onPress={videoIndisponivel}
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
            onPress={menuConversa}
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
        ref={listaRef}
        data={mensagens}
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

          if (item.tipo === "FOTO") {
            const photoUri = item.mediaUrl || item.thumbUrl;

            return (
              <Pressable
                onPress={() => item.locked && desbloquearFoto(item)}
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

      {presentesVisiveis.length ? (
        <View style={styles.giftsStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.giftsContent}
          >
            {presentesVisiveis.map((item: any) => {
              const imageUrl = absoluteAsset(item.imagemUrl);
              const enviandoEste = presenteEmEnvio === String(item.id);

              return (
                <Pressable
                  key={String(item.id)}
                  disabled={!chatLiberado || !!presenteEmEnvio}
                  onPress={() => enviarPresenteChat(String(item.id))}
                  style={({ pressed }) => [
                    styles.giftItem,
                    (!chatLiberado || enviandoEste) && styles.disabled,
                    pressed && styles.pressed,
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
                    <Text style={styles.giftDiamond}>♦</Text>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsContent}
        >
          <Tool
            label="Foto"
            color="#E51D43"
            icon={{ ios: "camera.fill", android: "photo_camera", web: "photo_camera" }}
            onPress={tirarFoto}
            disabled={!chatLiberado || enviandoMidia}
          />
          <Tool
            label="Galeria"
            color="#7C37E8"
            icon={{ ios: "photo.fill", android: "photo_library", web: "photo_library" }}
            onPress={selecionarFoto}
            disabled={!chatLiberado || enviandoMidia}
          />
          <Tool
            label="Áudio"
            color="#156DDF"
            icon={{ ios: "mic.fill", android: "mic", web: "mic" }}
            onPress={audioIndisponivel}
          />
          <Tool
            label="Vídeo"
            color="#9A6A00"
            icon={{ ios: "video.fill", android: "videocam", web: "videocam" }}
            onPress={videoIndisponivel}
          />
          <Tool
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
            label="Comprar créditos"
            color="#087D52"
            icon={{ ios: "wallet.bifold.fill", android: "wallet", web: "wallet" }}
            onPress={() => router.push("/creditos")}
          />
          <Tool
            label="Mais"
            color="#34363C"
            icon={{ ios: "plus", android: "add", web: "add" }}
            onPress={menuConversa}
          />
        </ScrollView>
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
            editable={chatLiberado && !enviando}
            placeholder={
              editandoId ? "Editando mensagem..." : "Digite uma mensagem..."
            }
            placeholderTextColor="#77716D"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
        </View>

        <Pressable
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
    </KeyboardAvoidingView>
  );
}

function Tool({
  label,
  icon,
  color,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: { ios: string; android: string; web: string };
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.toolIcon, { borderColor: color, backgroundColor: `${color}33` }]}>
        <SymbolView
          name={icon as any}
          size={27}
          tintColor={color === "#9A6A00" ? "#F5D060" : "#FFF"}
          style={styles.toolSymbol}
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
    minHeight: 104,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "web" ? 10 : 16,
    paddingBottom: 10,
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
    minHeight: 47,
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
    paddingVertical: 10,
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

  giftsStrip: {
    minHeight: 121,
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
    color: "#42CBFF",
    fontSize: 10,
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
    minHeight: 103,
    backgroundColor: "#030303",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,190,90,0.20)",
  },
  toolsContent: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    gap: 10,
  },
  tool: {
    width: 61,
    alignItems: "center",
  },
  toolIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.3,
    alignItems: "center",
    justifyContent: "center",
  },
  toolSymbol: {
    width: 29,
    height: 29,
  },
  toolLabel: {
    color: "#D8D0CB",
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: "center",
    marginTop: 5,
  },

  composer: {
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
