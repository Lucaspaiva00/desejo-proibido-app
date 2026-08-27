import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CriadoraStatus,
  financeiroCriadora,
  solicitarCriadora,
  solicitarSaqueCriadora,
  statusCriadora,
} from "../services/criadora";
import { apiErrorMessage } from "../services/http";
import { getRealtimeSocket } from "../services/liveSocket";

const pixTypes = ["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATORIA"] as const;

function moneyFromCentavos(value: number) {
  return (Number(value || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusColor(status: string) {
  if (status === "APROVADA" || status === "PAGO") return "#27C281";
  if (status === "PENDENTE" || status === "APROVADO") return "#F0A52B";
  if (status === "BLOQUEADA" || status === "REPROVADA" || status === "RECUSADO") return "#E14A60";
  return "#7D7277";
}

export default function CriadoraScreen() {
  const [status, setStatus] = useState<CriadoraStatus | null>(null);
  const [financeiro, setFinanceiro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState(false);
  const [valor, setValor] = useState("");
  const [pix, setPix] = useState("");
  const [pixType, setPixType] = useState<(typeof pixTypes)[number]>("CPF");

  const carregar = useCallback(async () => {
    try {
      const s = await statusCriadora();
      setStatus(s);
      if (s.creatorStatus !== "NAO_SOLICITADO" || s.elegivelParaSolicitar) {
        try {
          setFinanceiro(await financeiroCriadora());
        } catch {
          setFinanceiro(null);
        }
      }
    } catch (e: any) {
      Alert.alert("Erro", apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    let socket: any;
    const reload = () => carregar();
    (async () => {
      try {
        socket = await getRealtimeSocket();
        socket.on("creator:status", reload);
        socket.on("creator:payout:update", reload);
        socket.on("wallet:update", reload);
      } catch {}
    })();
    return () => {
      socket?.off("creator:status", reload);
      socket?.off("creator:payout:update", reload);
      socket?.off("wallet:update", reload);
    };
  }, [carregar]);

  const config = financeiro?.configuracao || status?.configuracaoFinanceira || {};
  const estimado = useMemo(() => {
    const creditos = Number(valor || 0);
    const centsPerCredit = Number(config?.creditoValorCentavos || config?.centavosPorCredito || 1);
    return moneyFromCentavos(creditos * centsPerCredit);
  }, [valor, config]);

  async function solicitarAprovacao() {
    try {
      setAcao(true);
      await solicitarCriadora();
      await carregar();
      Alert.alert("Solicitação enviada", "Sua conta entrou na fila de análise.");
    } catch (e: any) {
      Alert.alert("Não foi possível solicitar", apiErrorMessage(e));
    } finally {
      setAcao(false);
    }
  }

  async function pedirSaque() {
    const valorCreditos = Math.trunc(Number(valor));
    if (!valorCreditos || !pix.trim()) {
      return Alert.alert("Dados incompletos", "Informe o valor em créditos e sua chave PIX.");
    }

    Alert.alert("Confirmar saque", `Solicitar ${valorCreditos} créditos (${estimado}) para ${pixType}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Solicitar",
        onPress: async () => {
          try {
            setAcao(true);
            await solicitarSaqueCriadora({ valorCreditos, chavePix: pix.trim(), tipoChavePix: pixType });
            setValor("");
            setPix("");
            await carregar();
            Alert.alert("Saque solicitado", "O valor foi reservado e enviado para análise.");
          } catch (e: any) {
            Alert.alert("Saque não realizado", apiErrorMessage(e));
          } finally {
            setAcao(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#E21D3D" /></View>;
  }

  if (!status) return null;

  const ganhoCentavos = Number(financeiro?.ganhos?.valorCentavosEstimado || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CREATOR CENTER</Text>
      <Text style={styles.title}>Área da Criadora</Text>
      <Text style={styles.subtitle}>Transmita, acompanhe seus ganhos e solicite saques.</Text>

      <View style={styles.statusCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>Status da conta</Text>
          <Text style={[styles.statusText, { color: statusColor(status.creatorStatus) }]}>{status.creatorStatus.replaceAll("_", " ")}</Text>
          <Text style={styles.smallText}>{status.nome || "Seu perfil"} · {status.idade ?? "-"} anos</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor(status.creatorStatus) }]} />
      </View>

      {status.creatorMotivo ? <Text style={styles.warning}>{status.creatorMotivo}</Text> : null}

      {!status.elegivelParaSolicitar && status.creatorStatus === "NAO_SOLICITADO" ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Conta não elegível</Text>
          <Text style={styles.smallText}>Para solicitar uma conta de criadora, o perfil precisa ser feminino, estar ativo e ter 18 anos ou mais.</Text>
        </View>
      ) : null}

      {status.elegivelParaSolicitar && !status.podeTransmitir && status.creatorStatus !== "PENDENTE" ? (
        <TouchableOpacity disabled={acao} style={styles.primaryButton} onPress={solicitarAprovacao}>
          <Text style={styles.primaryButtonText}>{acao ? "Enviando..." : "Solicitar aprovação"}</Text>
        </TouchableOpacity>
      ) : null}

      {status.creatorStatus === "PENDENTE" ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Em análise</Text>
          <Text style={styles.smallText}>O administrador precisa aprovar sua conta antes da primeira transmissão.</Text>
        </View>
      ) : null}

      {status.podeTransmitir ? (
        <>
          <TouchableOpacity style={styles.liveButton} onPress={() => router.push("/transmitir")}>
            <Text style={styles.liveButtonTop}>🔴</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveButtonTitle}>Abrir uma live</Text>
              <Text style={styles.liveButtonText}>Câmera, chat, presentes e meta em tempo real</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Financeiro</Text>
          <View style={styles.grid}>
            <View style={styles.metric}><Text style={styles.metricLabel}>Disponível</Text><Text style={styles.metricValue}>{financeiro?.carteira?.disponivel ?? status.carteira.disponivel}</Text><Text style={styles.metricUnit}>créditos</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>Bloqueado</Text><Text style={styles.metricValue}>{financeiro?.carteira?.bloqueado ?? status.carteira.bloqueado}</Text><Text style={styles.metricUnit}>créditos</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>Ganhos</Text><Text style={styles.metricValue}>{financeiro?.ganhos?.creditos ?? 0}</Text><Text style={styles.metricUnit}>{moneyFromCentavos(ganhoCentavos)}</Text></View>
            <View style={styles.metric}><Text style={styles.metricLabel}>Lives</Text><Text style={styles.metricValue}>{financeiro?.lives?.length ?? 0}</Text><Text style={styles.metricUnit}>recentes</Text></View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Solicitar saque PIX</Text>
            <Text style={styles.smallText}>Os créditos ficam bloqueados enquanto o saque estiver em análise.</Text>

            <TextInput
              value={valor}
              onChangeText={setValor}
              keyboardType="number-pad"
              placeholder="Valor em créditos"
              placeholderTextColor="#756A6E"
              style={styles.input}
            />

            <View style={styles.chips}>
              {pixTypes.map((type) => (
                <TouchableOpacity key={type} onPress={() => setPixType(type)} style={[styles.chip, pixType === type && styles.chipActive]}>
                  <Text style={[styles.chipText, pixType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={pix}
              onChangeText={setPix}
              placeholder="Chave PIX"
              autoCapitalize="none"
              placeholderTextColor="#756A6E"
              style={styles.input}
            />

            {!!valor && <Text style={styles.estimate}>Estimativa: {estimado}</Text>}
            <TouchableOpacity disabled={acao} onPress={pedirSaque} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{acao ? "Processando..." : "Solicitar saque"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Últimos saques</Text>
          {(financeiro?.saques || []).length ? (financeiro.saques || []).slice(0, 8).map((s: any) => (
            <View key={s.id} style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{s.valorCreditos} créditos</Text>
                <Text style={styles.smallText}>{moneyFromCentavos(s.valorCentavos)} · {s.tipoChavePix}</Text>
              </View>
              <Text style={[styles.rowStatus, { color: statusColor(s.status) }]}>{s.status}</Text>
            </View>
          )) : <Text style={styles.smallText}>Nenhum saque solicitado.</Text>}

          <Text style={styles.sectionTitle}>Top apoiadores</Text>
          {(financeiro?.topApoiadores || []).length ? financeiro.topApoiadores.map((a: any, index: number) => (
            <View key={a.userId} style={styles.supporter}>
              <Text style={styles.supporterPosition}>{index + 1}</Text>
              <Text style={styles.supporterName}>{a.nome}</Text>
              <Text style={styles.supporterCredits}>{a.creditos} cr.</Text>
            </View>
          )) : <Text style={styles.smallText}>Seu ranking aparecerá depois dos primeiros presentes.</Text>}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050205" },
  content: { padding: 18, paddingBottom: 50 },
  center: { flex: 1, backgroundColor: "#050205", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#E21D3D", fontWeight: "900", letterSpacing: 1.7, fontSize: 12 },
  title: { color: "#fff", fontSize: 31, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#94888D", fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
  statusCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#10070A", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#291017" },
  cardLabel: { color: "#83777B", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  statusText: { fontSize: 21, fontWeight: "900", marginTop: 4 },
  smallText: { color: "#8F8388", fontSize: 13, lineHeight: 19, marginTop: 4 },
  statusDot: { width: 13, height: 13, borderRadius: 7 },
  warning: { backgroundColor: "#321018", color: "#FF94A5", padding: 12, borderRadius: 12, marginTop: 10 },
  infoBox: { backgroundColor: "#10080B", borderRadius: 16, padding: 15, marginTop: 12, borderWidth: 1, borderColor: "#241116" },
  infoTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  primaryButton: { backgroundColor: "#E21D3D", borderRadius: 14, padding: 15, alignItems: "center", marginTop: 14 },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  liveButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1D080D", borderColor: "#79172A", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
  liveButtonTop: { fontSize: 25 },
  liveButtonTitle: { color: "#fff", fontWeight: "900", fontSize: 17 },
  liveButtonText: { color: "#B89DA5", fontSize: 12, marginTop: 3 },
  sectionTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 24, marginBottom: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "48%", backgroundColor: "#0F0709", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#241116" },
  metricLabel: { color: "#867A7F", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  metricValue: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 5 },
  metricUnit: { color: "#B19FA5", marginTop: 2, fontSize: 12 },
  panel: { backgroundColor: "#0E0709", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#241116", marginTop: 12 },
  panelTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  input: { backgroundColor: "#170C0F", color: "#fff", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, borderWidth: 1, borderColor: "#30151C", marginTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#160B0E", borderWidth: 1, borderColor: "#2B161C" },
  chipActive: { backgroundColor: "#E21D3D", borderColor: "#E21D3D" },
  chipText: { color: "#A89BA0", fontWeight: "800", fontSize: 11 },
  chipTextActive: { color: "#fff" },
  estimate: { color: "#D8C7CC", marginTop: 10, fontWeight: "700" },
  rowCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E0709", borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: "#211015" },
  rowTitle: { color: "#fff", fontWeight: "900" },
  rowStatus: { fontSize: 12, fontWeight: "900" },
  supporter: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E0709", borderRadius: 14, padding: 13, marginBottom: 8 },
  supporterPosition: { color: "#E21D3D", fontWeight: "900", width: 28 },
  supporterName: { color: "#fff", fontWeight: "800", flex: 1 },
  supporterCredits: { color: "#D1C2C7", fontWeight: "900" },
});
