import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MediaStream, RTCPeerConnection, RTCView } from "react-native-webrtc";
import { apiErrorMessage } from "../services/http";
import { addIce, addStreamTracks, createPeer, fecharStream, obterMidiaLocal, setRemoteSdp } from "../services/liveWebrtc";
import { getRealtimeSocket } from "../services/liveSocket";
import {
  atualizarMetaLive,
  encerrarLive,
  iniciarLive,
  LiveRanking,
  rankingLive,
  statusLives,
} from "../services/lives";

export default function TransmitirScreen() {
  const [titulo, setTitulo] = useState("");
  const [meta, setMeta] = useState("");
  const [liveId, setLiveId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [viewers, setViewers] = useState(0);
  const [ganhos, setGanhos] = useState(0);
  const [ranking, setRanking] = useState<LiveRanking | null>(null);
  const [chat, setChat] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [giftFlash, setGiftFlash] = useState("");
  const [micAtivo, setMicAtivo] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const socketRef = useRef<any>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, any[]>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const liveIdRef = useRef<string | null>(null);
  const endedRef = useRef(false);

  async function atualizarRanking(id = liveIdRef.current) {
    if (!id) return;
    try {
      setRanking(await rankingLive(id));
    } catch {}
  }

  function closePeer(id: string) {
    const peer = peersRef.current.get(id);
    if (peer) {
      peer.close();
      peersRef.current.delete(id);
    }
    pendingIceRef.current.delete(id);
  }

  function closeAllPeers() {
    for (const [, peer] of peersRef.current) peer.close();
    peersRef.current.clear();
  }

  async function createOfferForViewer(viewerSocketId: string) {
    const localStream = streamRef.current;
    const id = liveIdRef.current;
    const socket = socketRef.current;
    if (!localStream || !id || !socket || peersRef.current.has(viewerSocketId)) return;

    const peer = createPeer();
    peersRef.current.set(viewerSocketId, peer);
    addStreamTracks(peer, localStream);

    (peer as any).addEventListener("icecandidate", (event: any) => {
      if (event.candidate) {
        socket.emit("live:ice", {
          liveId: id,
          targetSocketId: viewerSocketId,
          candidate: event.candidate,
        });
      }
    });

    (peer as any).addEventListener("connectionstatechange", () => {
      const state = String(peer.connectionState || "");
      if (["failed", "closed", "disconnected"].includes(state)) closePeer(viewerSocketId);
    });

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("live:offer", { liveId: id, viewerSocketId, sdp: offer });
  }

  async function conectarSocket(id: string) {
    const socket = await getRealtimeSocket();
    socketRef.current = socket;

    const onViewerJoined = ({ viewerSocketId }: any) => {
      if (viewerSocketId) createOfferForViewer(String(viewerSocketId)).catch(console.log);
    };
    const onViewerLeft = ({ viewerSocketId }: any) => viewerSocketId && closePeer(String(viewerSocketId));
    const onAnswer = async ({ viewerSocketId, sdp }: any) => {
      const key = String(viewerSocketId);
      const peer = peersRef.current.get(key);
      if (!peer || !sdp) return;
      await setRemoteSdp(peer, sdp);
      const queued = pendingIceRef.current.get(key) || [];
      pendingIceRef.current.delete(key);
      for (const candidate of queued) await addIce(peer, candidate).catch(console.log);
    };
    const onIce = async ({ fromSocketId, candidate }: any) => {
      const key = String(fromSocketId);
      const peer = peersRef.current.get(key);
      if (!candidate) return;
      if (peer && (peer as any).remoteDescription) {
        await addIce(peer, candidate).catch(console.log);
      } else {
        const queued = pendingIceRef.current.get(key) || [];
        queued.push(candidate);
        pendingIceRef.current.set(key, queued);
      }
    };
    const onViewers = ({ viewersOnline }: any) => setViewers(Number(viewersOnline || 0));
    const onChat = (payload: any) => setChat((prev) => [...prev.slice(-79), payload]);
    const onGift = (payload: any) => {
      const nome = payload?.de?.nome || "Alguém";
      const presente = payload?.presente?.nome || `${payload?.valorCreditos || 0} créditos`;
      setGiftFlash(`🎁 ${nome} enviou ${presente}`);
      setTimeout(() => setGiftFlash(""), 3500);
      atualizarRanking(id);
    };
    const onEarning = (payload: any) => {
      if (payload?.hostSaldoCreditos != null) setGanhos(Number(payload.hostSaldoCreditos || 0));
    };
    const onMeta = () => atualizarRanking(id);

    socket.on("live:viewer:joined", onViewerJoined);
    socket.on("live:viewer:left", onViewerLeft);
    socket.on("live:answer", onAnswer);
    socket.on("live:ice", onIce);
    socket.on("live:viewers:update", onViewers);
    socket.on("live:chat", onChat);
    socket.on("live:gift", onGift);
    socket.on("live:earning", onEarning);
    socket.on("live:meta:update", onMeta);

    const ack: any = await new Promise((resolve) => {
      socket.emit("live:host:join", { liveId: id }, (response: any) => resolve(response));
    });
    if (!ack?.ok) throw new Error(ack?.error || "Não foi possível conectar a transmissão");
    for (const viewerSocketId of ack?.viewersSockets || []) {
      await createOfferForViewer(String(viewerSocketId));
    }

    return () => {
      socket.off("live:viewer:joined", onViewerJoined);
      socket.off("live:viewer:left", onViewerLeft);
      socket.off("live:answer", onAnswer);
      socket.off("live:ice", onIce);
      socket.off("live:viewers:update", onViewers);
      socket.off("live:chat", onChat);
      socket.off("live:gift", onGift);
      socket.off("live:earning", onEarning);
      socket.off("live:meta:update", onMeta);
    };
  }

  const socketCleanupRef = useRef<null | (() => void)>(null);

  async function iniciar() {
    try {
      setStarting(true);
      const status = await statusLives();
      setGanhos(Number(status.saldoCreditos || 0));
      if (!status.podeTransmitir) throw new Error("Sua conta de criadora ainda não está aprovada para transmitir.");

      let id = status.liveAtiva?.id || null;
      if (!id) {
        const metaNum = meta.trim() ? Math.trunc(Number(meta)) : null;
        const created = await iniciarLive(titulo, metaNum);
        id = created.liveId;
      }
      if (!id) throw new Error("Live não criada");

      liveIdRef.current = id;
      setLiveId(id);

      const localStream = await obterMidiaLocal();
      streamRef.current = localStream;
      setStream(localStream);

      socketCleanupRef.current = await conectarSocket(id);
      await atualizarRanking(id);
    } catch (e: any) {
      const id = liveIdRef.current;
      if (id) {
        await encerrarLive(id).catch(() => {});
        endedRef.current = true;
      }
      await cleanup(true);
      liveIdRef.current = null;
      setLiveId(null);
      Alert.alert("Não foi possível iniciar", apiErrorMessage(e));
    } finally {
      setStarting(false);
    }
  }

  async function cleanup(leaveRoom = true) {
    const id = liveIdRef.current;
    try {
      if (leaveRoom && id) socketRef.current?.emit("live:leave", { liveId: id });
    } catch {}
    socketCleanupRef.current?.();
    socketCleanupRef.current = null;
    closeAllPeers();
    fecharStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }

  async function finalizar() {
    const id = liveIdRef.current;
    if (!id || ending) return;
    try {
      setEnding(true);
      await encerrarLive(id);
      endedRef.current = true;
      await cleanup(true);
      Alert.alert("Live encerrada", "A transmissão foi finalizada.", [
        { text: "OK", onPress: () => router.replace("/criadora") },
      ]);
    } catch (e: any) {
      Alert.alert("Erro ao encerrar", apiErrorMessage(e));
    } finally {
      setEnding(false);
    }
  }

  async function salvarMeta() {
    if (!liveIdRef.current) return;
    try {
      const n = meta.trim() ? Math.trunc(Number(meta)) : null;
      await atualizarMetaLive(liveIdRef.current, n);
      await atualizarRanking();
      Alert.alert("Meta atualizada");
    } catch (e: any) {
      Alert.alert("Meta inválida", apiErrorMessage(e));
    }
  }

  function toggleMic() {
    const next = !micAtivo;
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMicAtivo(next);
  }

  function enviarChat() {
    const texto = mensagem.trim();
    const id = liveIdRef.current;
    if (!texto || !id || !socketRef.current) return;
    socketRef.current.emit("live:chat", { liveId: id, texto }, (ack: any) => {
      if (!ack?.ok) Alert.alert("Chat", ack?.error || "Mensagem não enviada");
    });
    setMensagem("");
  }

  useEffect(() => {
    return () => {
      const id = liveIdRef.current;
      cleanup(true);
      if (id && !endedRef.current) encerrarLive(id).catch(() => {});
    };
  }, []);

  if (!liveId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.startContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>TRANSMISSÃO</Text>
        <Text style={styles.title}>Abrir uma live</Text>
        <Text style={styles.subtitle}>Sua câmera e microfone serão ativados quando você iniciar.</Text>

        <View style={styles.panel}>
          <Text style={styles.label}>Título</Text>
          <TextInput value={titulo} onChangeText={setTitulo} placeholder="Ex: Conversando com vocês ❤️" placeholderTextColor="#786B70" style={styles.input} maxLength={80} />
          <Text style={styles.label}>Meta de créditos (opcional)</Text>
          <TextInput value={meta} onChangeText={setMeta} placeholder="Ex: 10000" placeholderTextColor="#786B70" style={styles.input} keyboardType="number-pad" />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Antes de começar</Text>
          <Text style={styles.noteText}>• Use uma conexão Wi‑Fi/5G estável.</Text>
          <Text style={styles.noteText}>• O app precisa de permissão de câmera e microfone.</Text>
          <Text style={styles.noteText}>• A transmissão encerra se você sair desta tela.</Text>
        </View>

        <TouchableOpacity disabled={starting} style={styles.startButton} onPress={iniciar}>
          <Text style={styles.startButtonText}>{starting ? "Preparando câmera..." : "🔴 Iniciar live"}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const progresso = ranking?.metaCreditos
    ? Math.min(100, Math.round((Number(ranking.arrecadadoBrutoCreditos || 0) / ranking.metaCreditos) * 100))
    : 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.liveContent} keyboardShouldPersistTaps="handled">
        <View style={styles.videoWrap}>
          {stream ? <RTCView streamURL={stream.toURL()} objectFit="cover" mirror style={styles.video} /> : null}
          <View style={styles.liveBadge}><View style={styles.redDot} /><Text style={styles.liveBadgeText}>AO VIVO</Text></View>
          <View style={styles.viewerBadge}><Text style={styles.viewerText}>👁 {viewers}</Text></View>
          {!!giftFlash && <View style={styles.giftFlash}><Text style={styles.giftFlashText}>{giftFlash}</Text></View>}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleMic}><Text style={styles.controlText}>{micAtivo ? "🎙 Mic on" : "🔇 Mic off"}</Text></TouchableOpacity>
          <TouchableOpacity disabled={ending} style={[styles.controlButton, styles.endButton]} onPress={() => Alert.alert("Encerrar live?", "Todos os espectadores serão desconectados.", [{ text: "Cancelar", style: "cancel" }, { text: "Encerrar", style: "destructive", onPress: finalizar }])}><Text style={styles.controlText}>{ending ? "Encerrando..." : "Encerrar"}</Text></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statLabel}>Espectadores</Text><Text style={styles.statValue}>{viewers}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Arrecadado</Text><Text style={styles.statValue}>{ranking?.arrecadadoBrutoCreditos || 0}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Saldo</Text><Text style={styles.statValue}>{ganhos}</Text></View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Meta da live</Text>
          <View style={styles.metaRow}>
            <TextInput value={meta} onChangeText={setMeta} keyboardType="number-pad" placeholder="Créditos" placeholderTextColor="#786B70" style={[styles.input, { flex: 1, marginTop: 0 }]} />
            <TouchableOpacity style={styles.smallButton} onPress={salvarMeta}><Text style={styles.smallButtonText}>Salvar</Text></TouchableOpacity>
          </View>
          {ranking?.metaCreditos ? (
            <>
              <Text style={styles.metaInfo}>{ranking.arrecadadoBrutoCreditos} / {ranking.metaCreditos} créditos · {progresso}%</Text>
              <View style={styles.progress}><View style={[styles.progressFill, { width: `${progresso}%` }]} /></View>
            </>
          ) : <Text style={styles.noteText}>Sem meta definida.</Text>}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Top apoiadores</Text>
          {(ranking?.ranking || []).slice(0, 5).map((item) => (
            <View key={item.userId} style={styles.rankRow}><Text style={styles.rankPosition}>{item.posicao}</Text><Text style={styles.rankName}>{item.nome}</Text><Text style={styles.rankCredits}>{item.creditos} cr.</Text></View>
          ))}
          {!ranking?.ranking?.length ? <Text style={styles.noteText}>O ranking aparecerá após o primeiro presente.</Text> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Chat ao vivo</Text>
          <View style={styles.chatBox}>
            {chat.slice(-10).map((m, i) => <Text key={`${m.criadoEm || i}-${i}`} style={styles.chatLine}><Text style={styles.chatName}>{m.nome}: </Text>{m.texto}</Text>)}
            {!chat.length ? <Text style={styles.noteText}>Aguardando mensagens...</Text> : null}
          </View>
          <View style={styles.metaRow}>
            <TextInput value={mensagem} onChangeText={setMensagem} placeholder="Escreva no chat" placeholderTextColor="#786B70" style={[styles.input, { flex: 1, marginTop: 0 }]} maxLength={500} />
            <TouchableOpacity style={styles.smallButton} onPress={enviarChat}><Text style={styles.smallButtonText}>Enviar</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020202" },
  startContent: { padding: 20, paddingBottom: 42 },
  liveContent: { paddingBottom: 46 },
  eyebrow: { color: "#F1CD70", fontSize: 10, fontWeight: "900", letterSpacing: 2.4 },
  title: { color: "#FFFDFC", fontFamily: "serif", fontSize: 34, lineHeight: 38, fontWeight: "700", marginTop: 7 },
  subtitle: { color: "#928A85", marginTop: 7, lineHeight: 19, marginBottom: 18, fontSize: 13 },
  panel: {
    backgroundColor: "rgba(9,7,6,0.96)",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.38)",
    padding: 16,
    margin: 14,
    marginBottom: 0,
  },
  label: { color: "#D7C691", fontSize: 11, fontWeight: "800", marginTop: 10 },
  input: {
    backgroundColor: "#0E0C0A",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.28)",
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: "#fff",
    marginTop: 7,
  },
  note: {
    backgroundColor: "rgba(85,0,13,0.18)",
    borderRadius: 16,
    padding: 15,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.28)",
  },
  noteTitle: { color: "#FFF", fontFamily: "serif", fontWeight: "700", fontSize: 17, marginBottom: 6 },
  noteText: { color: "#9A918C", fontSize: 12, lineHeight: 19, marginTop: 3 },
  startButton: {
    backgroundColor: "#A9071C",
    borderWidth: 1,
    borderColor: "#F2CD70",
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
    marginTop: 17,
    shadowColor: "#E51D32",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  startButtonText: { color: "#FFF", fontFamily: "serif", fontSize: 17, fontWeight: "700" },
  videoWrap: { height: 520, backgroundColor: "#000", position: "relative", borderBottomWidth: 1, borderBottomColor: "rgba(233,185,73,0.26)" },
  video: { ...StyleSheet.absoluteFill },
  liveBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(65,0,9,0.84)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.58)",
  },
  redDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF254A", shadowColor: "#FF254A", shadowOpacity: 0.7, shadowRadius: 7 },
  liveBadgeText: { color: "#FFF", fontWeight: "900", fontSize: 10, letterSpacing: 0.8 },
  viewerBadge: { position: "absolute", top: 16, right: 16, backgroundColor: "rgba(0,0,0,.72)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(233,185,73,0.28)" },
  viewerText: { color: "#FFF", fontWeight: "800", fontSize: 10 },
  giftFlash: { position: "absolute", left: 20, right: 20, bottom: 24, backgroundColor: "rgba(111,4,27,.92)", borderRadius: 14, padding: 13, borderWidth: 1, borderColor: "rgba(233,185,73,0.42)" },
  giftFlashText: { color: "#FFF", fontWeight: "900", textAlign: "center" },
  controls: { flexDirection: "row", gap: 10, padding: 14 },
  controlButton: { flex: 1, backgroundColor: "#0E0B09", padding: 13, borderRadius: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(233,185,73,0.3)" },
  endButton: { backgroundColor: "#730A1A", borderColor: "#FF3150" },
  controlText: { color: "#FFF", fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14 },
  stat: { flex: 1, backgroundColor: "rgba(9,7,6,0.96)", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(233,185,73,0.22)" },
  statLabel: { color: "#8F8782", fontSize: 9, textTransform: "uppercase", fontWeight: "900", letterSpacing: 1 },
  statValue: { color: "#FFF", fontFamily: "serif", fontSize: 21, fontWeight: "700", marginTop: 4 },
  panelTitle: { color: "#FFF", fontFamily: "serif", fontWeight: "700", fontSize: 18, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallButton: { backgroundColor: "#A9071C", borderRadius: 12, borderWidth: 1, borderColor: "#FF3150", paddingHorizontal: 14, paddingVertical: 12 },
  smallButtonText: { color: "#FFF", fontWeight: "900" },
  metaInfo: { color: "#C9BFB8", marginTop: 10, fontWeight: "800" },
  progress: { height: 8, borderRadius: 5, backgroundColor: "#17110B", overflow: "hidden", marginTop: 8, borderWidth: 1, borderColor: "rgba(233,185,73,0.16)" },
  progressFill: { height: "100%", backgroundColor: "#E4B74E" },
  rankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(233,185,73,0.14)" },
  rankPosition: { color: "#F1CD70", width: 28, fontWeight: "900" },
  rankName: { color: "#FFF", flex: 1, fontWeight: "800" },
  rankCredits: { color: "#E7C975", fontWeight: "900" },
  chatBox: { maxHeight: 220, marginBottom: 10 },
  chatLine: { color: "#D6CEC9", lineHeight: 21, marginBottom: 3 },
  chatName: { color: "#F1CD70", fontWeight: "900" },
});
