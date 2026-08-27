import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MediaStream, RTCPeerConnection, RTCView } from "react-native-webrtc";
import { listarPresentes } from "../../services/presentes";
import { apiErrorMessage } from "../../services/http";
import { addIce, createPeer, setRemoteSdp } from "../../services/liveWebrtc";
import { getRealtimeSocket } from "../../services/liveSocket";
import {
  denunciarLive,
  detalharLive,
  entrarLive,
  LiveItem,
  LiveRanking,
  presentearLive,
  rankingLive,
  sairLive,
  tickLive,
  statusLives,
} from "../../services/lives";

export default function AssistirLiveScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const liveId = String(params.id || "");
  const [live, setLive] = useState<LiveItem | null>(null);
  const [ranking, setRanking] = useState<LiveRanking | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoState, setVideoState] = useState("Conectando vídeo...");
  const [saldoMinutos, setSaldoMinutos] = useState(0);
  const [saldoCreditos, setSaldoCreditos] = useState<number | null>(null);
  const [presentes, setPresentes] = useState<any[]>([]);
  const [chat, setChat] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [giftFlash, setGiftFlash] = useState("");
  const [tip, setTip] = useState("");
  const [sendingGift, setSendingGift] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMotivo, setReportMotivo] = useState("Conteúdo inadequado");
  const [reportDescricao, setReportDescricao] = useState("");

  const socketRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const hostSocketIdRef = useRef<string | null>(null);
  const pendingIceRef = useRef<Array<{ fromSocketId: string; candidate: any }>>([]);
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const cleanupSocketRef = useRef<null | (() => void)>(null);

  async function refreshRanking() {
    if (!liveId) return;
    try {
      setRanking(await rankingLive(liveId));
    } catch {}
  }

  function closePeer() {
    peerRef.current?.close();
    peerRef.current = null;
    hostSocketIdRef.current = null;
    setRemoteStream(null);
  }

  async function createViewerPeer(hostSocketId: string, sdp: any) {
    closePeer();
    const socket = socketRef.current;
    if (!socket) return;

    const peer = createPeer();
    peerRef.current = peer;
    hostSocketIdRef.current = hostSocketId;

    (peer as any).addEventListener("icecandidate", (event: any) => {
      if (!event.candidate || !hostSocketIdRef.current) return;
      socket.emit("live:ice", {
        liveId,
        targetSocketId: hostSocketIdRef.current,
        candidate: event.candidate,
      });
    });

    (peer as any).addEventListener("track", (event: any) => {
      const incoming = event?.streams?.[0];
      if (incoming) {
        setRemoteStream(incoming);
        setVideoState("Ao vivo");
      }
    });

    (peer as any).addEventListener("connectionstatechange", () => {
      const state = String(peer.connectionState || "");
      if (state === "connected") setVideoState("Ao vivo");
      if (state === "connecting") setVideoState("Conectando vídeo...");
      if (["failed", "disconnected"].includes(state)) setVideoState("Reconectando vídeo...");
    });

    await setRemoteSdp(peer, sdp);
    const queued = pendingIceRef.current.filter((item) => item.fromSocketId === hostSocketId);
    pendingIceRef.current = pendingIceRef.current.filter((item) => item.fromSocketId !== hostSocketId);
    for (const item of queued) await addIce(peer, item.candidate).catch(console.log);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("live:answer", { liveId, hostSocketId, sdp: answer });
  }

  async function conectarSocket() {
    const socket = await getRealtimeSocket();
    socketRef.current = socket;

    const onOffer = ({ liveId: incomingId, hostSocketId, sdp }: any) => {
      if (String(incomingId) !== liveId || !hostSocketId || !sdp) return;
      createViewerPeer(String(hostSocketId), sdp).catch((e) => setVideoState(apiErrorMessage(e, "Falha no vídeo")));
    };
    const onIce = ({ liveId: incomingId, fromSocketId, candidate }: any) => {
      if (String(incomingId) !== liveId || !candidate) return;
      const from = String(fromSocketId || "");
      if (peerRef.current && String(hostSocketIdRef.current) === from && (peerRef.current as any).remoteDescription) {
        addIce(peerRef.current, candidate).catch(console.log);
      } else {
        pendingIceRef.current.push({ fromSocketId: from, candidate });
      }
    };
    const onChat = (payload: any) => {
      if (String(payload?.liveId) !== liveId) return;
      setChat((prev) => [...prev.slice(-79), payload]);
    };
    const onGift = (payload: any) => {
      if (String(payload?.liveId) !== liveId) return;
      const nome = payload?.de?.nome || "Alguém";
      const item = payload?.presente?.nome || `${payload?.valorCreditos || 0} créditos`;
      setGiftFlash(`🎁 ${nome} enviou ${item}`);
      setTimeout(() => setGiftFlash(""), 3500);
      refreshRanking();
    };
    const onMeta = () => refreshRanking();
    const onViewers = ({ liveId: incomingId, viewersOnline }: any) => {
      if (String(incomingId) !== liveId) return;
      setLive((prev) => (prev ? { ...prev, viewersOnline: Number(viewersOnline || 0) } : prev));
    };
    const onEnded = ({ liveId: incomingId }: any) => {
      if (String(incomingId) !== liveId) return;
      Alert.alert("Live encerrada", "A criadora encerrou a transmissão.", [
        { text: "Voltar", onPress: () => router.replace("/lives") },
      ]);
    };
    const onHostOffline = ({ liveId: incomingId }: any) => {
      if (String(incomingId) === liveId) setVideoState("Criadora reconectando...");
    };
    const onWallet = ({ saldoCreditos: saldo }: any) => {
      if (saldo != null) setSaldoCreditos(Number(saldo));
    };

    socket.on("live:offer", onOffer);
    socket.on("live:ice", onIce);
    socket.on("live:chat", onChat);
    socket.on("live:gift", onGift);
    socket.on("live:meta:update", onMeta);
    socket.on("live:viewers:update", onViewers);
    socket.on("live:ended", onEnded);
    socket.on("live:host:offline", onHostOffline);
    socket.on("wallet:update", onWallet);

    const ack: any = await new Promise((resolve) => {
      socket.emit("live:viewer:join", { liveId }, (response: any) => resolve(response));
    });
    if (!ack?.ok) throw new Error(ack?.error || "Não foi possível conectar à live");
    if (!ack?.hostOnline) setVideoState("Aguardando a criadora reconectar...");

    cleanupSocketRef.current = () => {
      socket.off("live:offer", onOffer);
      socket.off("live:ice", onIce);
      socket.off("live:chat", onChat);
      socket.off("live:gift", onGift);
      socket.off("live:meta:update", onMeta);
      socket.off("live:viewers:update", onViewers);
      socket.off("live:ended", onEnded);
      socket.off("live:host:offline", onHostOffline);
      socket.off("wallet:update", onWallet);
    };
  }

  async function carregar() {
    if (!liveId) return;
    try {
      const [detail, rank, gifts, me] = await Promise.all([
        detalharLive(liveId),
        rankingLive(liveId),
        listarPresentes(),
        statusLives(),
      ]);
      setLive(detail);
      setRanking(rank);
      setSaldoCreditos(Number(me?.saldoCreditos || 0));
      setPresentes(Array.isArray(gifts) ? gifts.filter((x: any) => x?.ativo !== false && Number(x?.custoCreditos || 0) > 0) : []);

      const joined = await entrarLive(liveId);
      joinedRef.current = true;
      setSaldoMinutos(Number(joined?.saldoMinutos || 0));
      await conectarSocket();
    } catch (e: any) {
      const status = Number(e?.response?.status || 0);
      const msg = apiErrorMessage(e, "Não foi possível entrar na live");
      Alert.alert(status === 402 ? "Sem minutos" : "Live indisponível", msg, [
        status === 402 ? { text: "Comprar créditos", onPress: () => router.replace("/creditos") } : { text: "Voltar", onPress: () => router.replace("/lives") },
        ...(status === 402 ? [{ text: "Voltar", onPress: () => router.replace("/lives") }] : []),
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      if (joinedRef.current) {
        socketRef.current?.emit("live:leave", { liveId });
        await sairLive(liveId).catch(() => {});
      }
    } finally {
      joinedRef.current = false;
      cleanupSocketRef.current?.();
      cleanupSocketRef.current = null;
      closePeer();
    }
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(async () => {
      if (!joinedRef.current) return;
      try {
        const r = await tickLive(liveId);
        if (r?.saldoMinutos != null) setSaldoMinutos(Number(r.saldoMinutos));
      } catch (e: any) {
        if (Number(e?.response?.status) === 402) {
          await leave();
          Alert.alert("Seus minutos acabaram", "Adquira um novo pacote para continuar assistindo.", [
            { text: "Comprar", onPress: () => router.replace("/creditos") },
          ]);
        }
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      leave();
    };
  }, [liveId]);

  async function enviarPresente(presente: any) {
    if (sendingGift) return;
    try {
      setSendingGift(true);
      const r = await presentearLive(liveId, { presenteId: presente.id });
      if (r?.saldoCreditos != null) setSaldoCreditos(Number(r.saldoCreditos));
      await refreshRanking();
    } catch (e: any) {
      Alert.alert("Presente não enviado", apiErrorMessage(e));
    } finally {
      setSendingGift(false);
    }
  }

  async function enviarGorjeta() {
    const valorCreditos = Math.trunc(Number(tip));
    if (!valorCreditos || valorCreditos <= 0) return Alert.alert("Valor inválido", "Informe a quantidade de créditos.");
    try {
      setSendingGift(true);
      const r = await presentearLive(liveId, { valorCreditos });
      if (r?.saldoCreditos != null) setSaldoCreditos(Number(r.saldoCreditos));
      setTip("");
      await refreshRanking();
    } catch (e: any) {
      Alert.alert("Gorjeta não enviada", apiErrorMessage(e));
    } finally {
      setSendingGift(false);
    }
  }

  function enviarChat() {
    const texto = mensagem.trim();
    if (!texto || !socketRef.current) return;
    socketRef.current.emit("live:chat", { liveId, texto }, (ack: any) => {
      if (!ack?.ok) Alert.alert("Chat", ack?.error || "Mensagem não enviada");
    });
    setMensagem("");
  }

  async function enviarDenuncia() {
    if (reportMotivo.trim().length < 3) return Alert.alert("Motivo", "Informe o motivo da denúncia.");
    try {
      await denunciarLive(liveId, reportMotivo.trim(), reportDescricao.trim());
      setReportOpen(false);
      setReportDescricao("");
      Alert.alert("Denúncia enviada", "A moderação recebeu sua denúncia.");
    } catch (e: any) {
      Alert.alert("Erro", apiErrorMessage(e));
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E21D3D" /><Text style={styles.muted}>Entrando na live...</Text></View>;

  const progress = ranking?.metaCreditos
    ? Math.min(100, Math.round((ranking.arrecadadoBrutoCreditos / ranking.metaCreditos) * 100))
    : 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.videoWrap}>
          {remoteStream ? (
            <RTCView streamURL={remoteStream.toURL()} objectFit="cover" style={styles.video} />
          ) : (
            <View style={styles.videoPlaceholder}>
              {live?.host?.foto ? <Image source={{ uri: live.host.foto }} style={styles.placeholderAvatar} /> : null}
              <ActivityIndicator color="#E21D3D" />
              <Text style={styles.videoState}>{videoState}</Text>
            </View>
          )}
          <View style={styles.liveBadge}><View style={styles.redDot} /><Text style={styles.liveBadgeText}>AO VIVO</Text></View>
          <View style={styles.viewerBadge}><Text style={styles.viewerText}>👁 {live?.viewersOnline || 0}</Text></View>
          {!!giftFlash && <View style={styles.giftFlash}><Text style={styles.giftFlashText}>{giftFlash}</Text></View>}
        </View>

        <View style={styles.hostRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hostName}>{live?.host?.nome || "Criadora"} {live?.host?.verificada ? "✓" : ""}</Text>
            <Text style={styles.liveTitle}>{live?.titulo || "Ao vivo agora"}</Text>
          </View>
          <TouchableOpacity style={styles.reportButton} onPress={() => setReportOpen(true)}><Text style={styles.reportText}>Denunciar</Text></TouchableOpacity>
        </View>

        <View style={styles.balances}>
          <View style={styles.balance}><Text style={styles.balanceLabel}>Minutos</Text><Text style={styles.balanceValue}>{saldoMinutos}</Text></View>
          <View style={styles.balance}><Text style={styles.balanceLabel}>Créditos</Text><Text style={styles.balanceValue}>{saldoCreditos == null ? "—" : saldoCreditos}</Text></View>
          <TouchableOpacity style={styles.buyBalance} onPress={() => router.push("/creditos")}><Text style={styles.buyBalanceText}>Comprar</Text></TouchableOpacity>
        </View>

        {ranking?.metaCreditos ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}><Text style={styles.panelTitle}>🔥 Meta da live</Text><Text style={styles.panelAccent}>{progress}%</Text></View>
            <Text style={styles.metaInfo}>{ranking.arrecadadoBrutoCreditos} / {ranking.metaCreditos} créditos</Text>
            <View style={styles.progress}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🎁 Presentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.giftsRow}>
            {presentes.map((p) => (
              <TouchableOpacity disabled={sendingGift} key={p.id} style={styles.giftCard} onPress={() => enviarPresente(p)}>
                {p.imagemUrl ? <Image source={{ uri: p.imagemUrl }} style={styles.giftImage} /> : <Text style={styles.giftEmoji}>🎁</Text>}
                <Text numberOfLines={1} style={styles.giftName}>{p.nome}</Text>
                <Text style={styles.giftPrice}>{p.custoCreditos} cr.</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.tipRow}>
            <TextInput value={tip} onChangeText={setTip} keyboardType="number-pad" placeholder="Gorjeta em créditos" placeholderTextColor="#756A6E" style={[styles.input, { flex: 1 }]} />
            <TouchableOpacity disabled={sendingGift} style={styles.sendButton} onPress={enviarGorjeta}><Text style={styles.sendButtonText}>Enviar</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🏆 Top apoiadores</Text>
          {(ranking?.ranking || []).slice(0, 5).map((r) => (
            <View key={r.userId} style={styles.rankRow}><Text style={styles.rankPos}>{r.posicao}</Text><Text style={styles.rankName}>{r.nome}</Text><Text style={styles.rankCredits}>{r.creditos} cr.</Text></View>
          ))}
          {!ranking?.ranking?.length ? <Text style={styles.muted}>Seja o primeiro apoiador desta live.</Text> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>💬 Chat ao vivo</Text>
          <View style={styles.chatBox}>
            {chat.slice(-12).map((m, i) => <Text key={`${m.criadoEm || i}-${i}`} style={styles.chatLine}><Text style={styles.chatName}>{m.nome}: </Text>{m.texto}</Text>)}
            {!chat.length ? <Text style={styles.muted}>O chat ainda está tranquilo.</Text> : null}
          </View>
          <View style={styles.tipRow}>
            <TextInput value={mensagem} onChangeText={setMensagem} placeholder="Escreva uma mensagem" placeholderTextColor="#756A6E" style={[styles.input, { flex: 1 }]} maxLength={500} />
            <TouchableOpacity style={styles.sendButton} onPress={enviarChat}><Text style={styles.sendButtonText}>Enviar</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.leaveButton} onPress={async () => { await leave(); router.replace("/lives"); }}><Text style={styles.leaveText}>Sair da live</Text></TouchableOpacity>
      </ScrollView>

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Denunciar live</Text>
            <TextInput value={reportMotivo} onChangeText={setReportMotivo} placeholder="Motivo" placeholderTextColor="#756A6E" style={styles.input} maxLength={80} />
            <TextInput value={reportDescricao} onChangeText={setReportDescricao} placeholder="Descreva o problema (opcional)" placeholderTextColor="#756A6E" style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} multiline maxLength={2000} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReportOpen(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={enviarDenuncia}><Text style={styles.dangerText}>Enviar denúncia</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050205" },
  content: { paddingBottom: 45 },
  center: { flex: 1, backgroundColor: "#050205", alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#8C8085", fontSize: 13, marginTop: 5 },
  videoWrap: { height: 520, backgroundColor: "#000", position: "relative" },
  video: { ...StyleSheet.absoluteFill },
  videoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 11, backgroundColor: "#0D080A" },
  placeholderAvatar: { width: 84, height: 84, borderRadius: 42, opacity: 0.55 },
  videoState: { color: "#B5A7AC", fontWeight: "700" },
  liveBadge: { position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(0,0,0,.65)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  redDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF254A" },
  liveBadgeText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  viewerBadge: { position: "absolute", top: 16, right: 16, backgroundColor: "rgba(0,0,0,.65)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  viewerText: { color: "#fff", fontWeight: "800" },
  giftFlash: { position: "absolute", left: 18, right: 18, bottom: 22, backgroundColor: "rgba(120,9,36,.92)", padding: 13, borderRadius: 14 },
  giftFlashText: { color: "#fff", textAlign: "center", fontWeight: "900" },
  hostRow: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#211015" },
  hostName: { color: "#fff", fontSize: 19, fontWeight: "900" },
  liveTitle: { color: "#9C8F94", marginTop: 3 },
  reportButton: { backgroundColor: "#170C10", borderWidth: 1, borderColor: "#3B1921", paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11 },
  reportText: { color: "#E78494", fontSize: 11, fontWeight: "900" },
  balances: { flexDirection: "row", alignItems: "stretch", gap: 8, paddingHorizontal: 14, marginTop: 12 },
  balance: { flex: 1, backgroundColor: "#0F0709", borderRadius: 14, padding: 11, borderWidth: 1, borderColor: "#221015" },
  balanceLabel: { color: "#807479", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  balanceValue: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 3 },
  buyBalance: { alignItems: "center", justifyContent: "center", backgroundColor: "#E21D3D", borderRadius: 14, paddingHorizontal: 15 },
  buyBalanceText: { color: "#fff", fontWeight: "900" },
  panel: { backgroundColor: "#0E0709", borderRadius: 18, borderWidth: 1, borderColor: "#241116", padding: 15, marginHorizontal: 14, marginTop: 12 },
  panelHeader: { flexDirection: "row", alignItems: "center" },
  panelTitle: { color: "#fff", fontSize: 17, fontWeight: "900", flex: 1 },
  panelAccent: { color: "#E21D3D", fontWeight: "900" },
  metaInfo: { color: "#B7A8AD", marginTop: 8, fontWeight: "700" },
  progress: { height: 8, borderRadius: 5, backgroundColor: "#251117", overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", backgroundColor: "#E21D3D" },
  giftsRow: { gap: 9, paddingTop: 12, paddingBottom: 4 },
  giftCard: { width: 91, backgroundColor: "#150B0E", borderRadius: 15, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2D151C" },
  giftImage: { width: 42, height: 42, borderRadius: 10 },
  giftEmoji: { fontSize: 31 },
  giftName: { color: "#fff", fontSize: 11, fontWeight: "800", marginTop: 6, maxWidth: 74 },
  giftPrice: { color: "#E75B74", fontSize: 11, fontWeight: "900", marginTop: 3 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  input: { backgroundColor: "#170C0F", borderWidth: 1, borderColor: "#32151D", borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: "#fff" },
  sendButton: { backgroundColor: "#E21D3D", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  sendButtonText: { color: "#fff", fontWeight: "900" },
  rankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#26161B" },
  rankPos: { width: 28, color: "#E21D3D", fontWeight: "900" },
  rankName: { flex: 1, color: "#fff", fontWeight: "800" },
  rankCredits: { color: "#C9B8BE", fontWeight: "900" },
  chatBox: { maxHeight: 240, marginTop: 10 },
  chatLine: { color: "#D1C5C9", lineHeight: 21, marginBottom: 4 },
  chatName: { color: "#fff", fontWeight: "900" },
  leaveButton: { marginHorizontal: 14, marginTop: 16, backgroundColor: "#1B0D11", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#3C1922" },
  leaveText: { color: "#E88899", fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.75)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#10080A", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#36161F" },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 12 },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  cancelButton: { flex: 1, backgroundColor: "#21151A", padding: 13, borderRadius: 12, alignItems: "center" },
  cancelText: { color: "#C5B7BC", fontWeight: "900" },
  dangerButton: { flex: 1, backgroundColor: "#E21D3D", padding: 13, borderRadius: 12, alignItems: "center" },
  dangerText: { color: "#fff", fontWeight: "900" },
});
