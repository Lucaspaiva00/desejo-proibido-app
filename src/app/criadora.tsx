import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { Kicker, Pill, PrimaryButton, SectionHeader, StatCard } from "../components/ui/dp-ui";
import { DP, dpNumber } from "../constants/dp-theme";
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

function statusTone(status: string): "neutral" | "primary" | "success" | "gold" {
  if (status === "APROVADA" || status === "PAGO") return "success";
  if (status === "PENDENTE" || status === "APROVADO") return "gold";
  if (status === "BLOQUEADA" || status === "REPROVADA" || status === "RECUSADO") return "primary";
  return "neutral";
}

function statusLabel(value: string) {
  return String(value || "").replace(/_/g, " ");
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
    return <View style={styles.center}><ActivityIndicator size="large" color={DP.colors.primary} /></View>;
  }

  if (!status) return null;

  const ganhoCentavos = Number(financeiro?.ganhos?.valorCentavosEstimado || 0);
  const disponivel = financeiro?.carteira?.disponivel ?? status.carteira.disponivel;
  const bloqueado = financeiro?.carteira?.bloqueado ?? status.carteira.bloqueado;
  const ganhos = financeiro?.ganhos?.creditos ?? 0;
  const lives = financeiro?.lives?.length ?? 0;

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Kicker>CREATOR CENTER</Kicker>
        <Text style={styles.title}>Sua operação de criadora em um só lugar.</Text>
        <Text style={styles.subtitle}>Transmita, acompanhe seus ganhos e solicite seus saques com clareza.</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusGlow} />
          <View style={styles.statusTop}>
            <Pill tone={statusTone(status.creatorStatus)}>{statusLabel(status.creatorStatus)}</Pill>
            <Text style={styles.statusAge}>{status.idade ?? "-"} anos</Text>
          </View>
          <Text style={styles.creatorName}>{status.nome || "Seu perfil"}</Text>
          <Text style={styles.statusText}>
            {status.podeTransmitir
              ? "Sua conta está pronta para transmitir e receber ganhos."
              : status.creatorStatus === "PENDENTE"
                ? "Sua solicitação está em análise."
                : "Conclua a aprovação para liberar transmissões e monetização."}
          </Text>
        </View>

        {status.creatorMotivo ? <Text style={styles.warning}>{status.creatorMotivo}</Text> : null}

        {!status.elegivelParaSolicitar && status.creatorStatus === "NAO_SOLICITADO" ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Conta ainda não elegível</Text>
            <Text style={styles.infoText}>O perfil precisa ser feminino, estar ativo e ter 18 anos ou mais.</Text>
          </View>
        ) : null}

        {status.elegivelParaSolicitar && !status.podeTransmitir && status.creatorStatus !== "PENDENTE" ? (
          <PrimaryButton title={acao ? "Enviando..." : "Solicitar aprovação"} subtitle="Enviar perfil para análise" onPress={solicitarAprovacao} disabled={acao} />
        ) : null}

        {status.creatorStatus === "PENDENTE" ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Em análise</Text>
            <Text style={styles.infoText}>O administrador precisa aprovar sua conta antes da primeira transmissão.</Text>
          </View>
        ) : null}

        {status.podeTransmitir ? (
          <>
            <View style={styles.liveCard}>
              <View style={styles.liveIndicator}><View style={styles.liveDot} /><Text style={styles.liveIndicatorText}>AO VIVO</Text></View>
              <Text style={styles.liveTitle}>Pronta para começar?</Text>
              <Text style={styles.liveText}>Abra a câmera, defina sua meta e acompanhe chat e presentes em tempo real.</Text>
              <PrimaryButton title="Abrir uma live" subtitle="Transmitir agora" onPress={() => router.push("/transmitir")} />
            </View>

            <SectionHeader title="Visão financeira" />
            <View style={styles.grid}>
              <StatCard label="Disponível" value={dpNumber(disponivel)} helper="créditos" accent />
              <StatCard label="Bloqueado" value={dpNumber(bloqueado)} helper="em análise" />
            </View>
            <View style={styles.gridSecondary}>
              <StatCard label="Ganhos" value={dpNumber(ganhos)} helper={moneyFromCentavos(ganhoCentavos)} />
              <StatCard label="Lives" value={dpNumber(lives)} helper="recentes" />
            </View>

            <View style={styles.payoutCard}>
              <Text style={styles.payoutKicker}>SAQUE PIX</Text>
              <Text style={styles.payoutTitle}>Retirar seus ganhos</Text>
              <Text style={styles.payoutText}>Os créditos ficam bloqueados enquanto o saque estiver em análise.</Text>

              <TextInput
                value={valor}
                onChangeText={setValor}
                keyboardType="number-pad"
                placeholder="Valor em créditos"
                placeholderTextColor={DP.colors.dim}
                style={styles.input}
              />

              <View style={styles.chips}>
                {pixTypes.map((type) => (
                  <Pressable key={type} onPress={() => setPixType(type)} style={[styles.chip, pixType === type && styles.chipActive]}>
                    <Text style={[styles.chipText, pixType === type && styles.chipTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={pix}
                onChangeText={setPix}
                placeholder="Chave PIX"
                autoCapitalize="none"
                placeholderTextColor={DP.colors.dim}
                style={styles.input}
              />

              {!!valor ? <Text style={styles.estimate}>Estimativa: {estimado}</Text> : null}
              <PrimaryButton title={acao ? "Processando..." : "Solicitar saque"} subtitle="Enviar solicitação para análise" onPress={pedirSaque} disabled={acao} />
            </View>

            <SectionHeader title="Últimos saques" />
            {(financeiro?.saques || []).length ? (financeiro.saques || []).slice(0, 8).map((s: any) => (
              <View key={s.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{dpNumber(s.valorCreditos)} créditos</Text>
                  <Text style={styles.rowSub}>{moneyFromCentavos(s.valorCentavos)} • {s.tipoChavePix}</Text>
                </View>
                <Pill tone={statusTone(s.status)}>{statusLabel(s.status)}</Pill>
              </View>
            )) : <Text style={styles.emptyText}>Nenhum saque solicitado até agora.</Text>}

            <SectionHeader title="Top apoiadores" />
            {(financeiro?.topApoiadores || []).length ? financeiro.topApoiadores.map((a: any, index: number) => (
              <View key={a.userId} style={styles.supporter}>
                <View style={styles.position}><Text style={styles.positionText}>{index + 1}</Text></View>
                <Text style={styles.supporterName}>{a.nome}</Text>
                <Text style={styles.supporterCredits}>{dpNumber(a.creditos)} cr.</Text>
              </View>
            )) : <Text style={styles.emptyText}>Seu ranking aparecerá depois dos primeiros presentes.</Text>}
          </>
        ) : null}
      </ScrollView>
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DP.colors.background },
  content: { padding: 18, paddingTop: 22, paddingBottom: 112 },
  center: { flex: 1, backgroundColor: DP.colors.background, alignItems: "center", justifyContent: "center" },
  title: { color: DP.colors.text, fontSize: 31, lineHeight: 35, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  subtitle: { color: DP.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18, maxWidth: 370 },
  statusCard: {
    overflow: "hidden",
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: DP.colors.border,
    marginBottom: 14,
    ...DP.shadow.card,
  },
  statusGlow: { position: "absolute", width: 150, height: 150, borderRadius: 75, right: -50, top: -60, backgroundColor: "rgba(255,45,85,0.08)" },
  statusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusAge: { color: DP.colors.dim, fontSize: 11, fontWeight: "800" },
  creatorName: { color: DP.colors.text, fontSize: 24, fontWeight: "900", marginTop: 14, letterSpacing: -0.5 },
  statusText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  warning: { backgroundColor: "rgba(255,99,122,0.08)", color: DP.colors.danger, padding: 12, borderRadius: DP.radius.md, borderWidth: 1, borderColor: "rgba(255,99,122,0.22)", marginBottom: 12 },
  infoBox: { backgroundColor: DP.colors.surface, borderRadius: DP.radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: DP.colors.border },
  infoTitle: { color: DP.colors.text, fontWeight: "900", fontSize: 16 },
  infoText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  liveCard: {
    backgroundColor: "#1A0C11",
    borderRadius: DP.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    marginBottom: 24,
    ...DP.shadow.card,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DP.colors.primary },
  liveIndicatorText: { color: DP.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  liveTitle: { color: DP.colors.text, fontSize: 23, fontWeight: "900", marginTop: 10, letterSpacing: -0.5 },
  liveText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 15 },
  grid: { flexDirection: "row", gap: 10 },
  gridSecondary: { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 22 },
  payoutCard: { backgroundColor: DP.colors.surface, borderRadius: DP.radius.xl, padding: 17, borderWidth: 1, borderColor: DP.colors.border, marginBottom: 24 },
  payoutKicker: { color: DP.colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  payoutTitle: { color: DP.colors.text, fontSize: 20, fontWeight: "900", marginTop: 7 },
  payoutText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  input: { backgroundColor: DP.colors.surface2, color: DP.colors.text, paddingHorizontal: 14, minHeight: 52, borderRadius: DP.radius.md, borderWidth: 1, borderColor: DP.colors.border, marginTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: DP.radius.pill, backgroundColor: DP.colors.surface2, borderWidth: 1, borderColor: DP.colors.border },
  chipActive: { backgroundColor: DP.colors.primarySoft, borderColor: DP.colors.borderStrong },
  chipText: { color: DP.colors.muted, fontSize: 10, fontWeight: "900" },
  chipTextActive: { color: "#FF91A7" },
  estimate: { color: DP.colors.gold, fontSize: 12, fontWeight: "800", marginTop: 10, marginBottom: 2 },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: DP.colors.surface, borderRadius: DP.radius.lg, padding: 14, borderWidth: 1, borderColor: DP.colors.border, marginBottom: 9 },
  rowTitle: { color: DP.colors.text, fontWeight: "900", fontSize: 14 },
  rowSub: { color: DP.colors.muted, fontSize: 11, marginTop: 4 },
  supporter: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: DP.colors.surface, borderRadius: DP.radius.md, padding: 13, borderWidth: 1, borderColor: DP.colors.border, marginBottom: 8 },
  position: { width: 30, height: 30, borderRadius: 11, backgroundColor: DP.colors.primarySoft, alignItems: "center", justifyContent: "center" },
  positionText: { color: DP.colors.primary, fontWeight: "900" },
  supporterName: { flex: 1, color: DP.colors.textSoft, fontWeight: "800" },
  supporterCredits: { color: DP.colors.gold, fontWeight: "900", fontSize: 12 },
  emptyText: { color: DP.colors.muted, fontSize: 12, marginBottom: 22 },
});
