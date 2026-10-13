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
import { DP_SERIF, GoldButton, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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

function statusLabel(value: string) {
  return String(value || "").replace(/_/g, " ");
}

export default function CriadoraScreen() {
  const [status, setStatus] = useState<CriadoraStatus | null>(null);
  const [financeiro, setFinanceiro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState(false);
  const [erro, setErro] = useState("");
  const [valor, setValor] = useState("");
  const [pix, setPix] = useState("");
  const [pixType, setPixType] = useState<(typeof pixTypes)[number]>("CPF");
  const [mostrarSaque, setMostrarSaque] = useState(false);
  const [aba, setAba] = useState<"PENDENTES" | "DISPONIVEIS" | "SAQUES">("DISPONIVEIS");

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const s = await statusCriadora();
      setStatus(s);
      if (s.creatorStatus !== "NAO_SOLICITADO" || s.elegivelParaSolicitar) {
        try {
          setFinanceiro(await financeiroCriadora());
        } catch (e: any) {
          setFinanceiro(null);
          setErro(apiErrorMessage(e, "Não foi possível carregar o financeiro da criadora."));
        }
      }
    } catch (e: any) {
      setStatus(null);
      setErro(apiErrorMessage(e, "Não foi possível carregar a Área da Criadora."));
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
  const centsPerCredit = Number(config?.creditoValorCentavos || config?.centavosPorCredito || 1);

  const estimado = useMemo(() => {
    const creditos = Number(valor || 0);
    return moneyFromCentavos(creditos * centsPerCredit);
  }, [valor, centsPerCredit]);

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
            setMostrarSaque(false);
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
    return (
      <LuxuryScreen>
        <View style={styles.center}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  if (!status) {
    return (
      <LuxuryScreen>
        <LuxuryHeader />
        <View style={styles.errorState}>
          <Text style={styles.errorStateIcon}>!</Text>
          <Text style={styles.errorStateTitle}>Área da Criadora indisponível</Text>
          <Text style={styles.errorStateText}>{erro || "Não foi possível carregar os dados agora."}</Text>
          <View style={{ width: "100%", marginTop: 22 }}>
            <GoldButton title="Tentar novamente" onPress={carregar} red />
          </View>
        </View>
        <DPBottomNav />
      </LuxuryScreen>
    );
  }

  const disponivel = Number(financeiro?.carteira?.disponivel ?? status.carteira.disponivel ?? 0);
  const bloqueado = Number(financeiro?.carteira?.bloqueado ?? status.carteira.bloqueado ?? 0);
  const ganhoCentavos = Number(financeiro?.ganhos?.valorCentavosEstimado || 0);
  const ganhos = Number(financeiro?.ganhos?.creditos ?? 0);
  const lives = financeiro?.lives || [];
  const saques = financeiro?.saques || [];
  const topApoiadores = financeiro?.topApoiadores || [];

  const pendingMoney = moneyFromCentavos(bloqueado * centsPerCredit);
  const availableMoney = moneyFromCentavos(disponivel * centsPerCredit);

  const chartValues = Array.from({ length: 7 }).map((_, index) => {
    const item = lives[Math.max(0, lives.length - 7) + index];
    return Number(item?.creditosGanhos ?? item?.ganhosCreditos ?? item?.creditos ?? 0);
  });
  const chartMax = Math.max(...chartValues, 1);

  return (
    <LuxuryScreen>
      <LuxuryHeader action={<Text style={styles.bell}>♧</Text>} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {!status.podeTransmitir ? (
          <>
            <Text style={styles.preTitle}>CREATOR CENTER</Text>
            <Text style={styles.title}>Área da Criadora</Text>
            <Text style={styles.subtitle}>Transmita, acompanhe seus ganhos e solicite saques.</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusTop}>
                <Text style={styles.statusLabel}>STATUS DA CONTA</Text>
                <Text style={styles.statusAge}>{status.idade ?? "-"} anos</Text>
              </View>
              <Text style={styles.statusValue}>{statusLabel(status.creatorStatus)}</Text>
              <Text style={styles.creatorName}>{status.nome || "Seu perfil"}</Text>
            </View>

            {status.creatorMotivo ? <Text style={styles.warning}>{status.creatorMotivo}</Text> : null}
            {!!erro ? <Text style={styles.warning}>{erro}</Text> : null}

            {!status.elegivelParaSolicitar && status.creatorStatus === "NAO_SOLICITADO" ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Conta ainda não elegível</Text>
                <Text style={styles.infoText}>O perfil precisa ser feminino, estar ativo e ter 18 anos ou mais.</Text>
              </View>
            ) : null}

            {status.elegivelParaSolicitar && status.creatorStatus !== "PENDENTE" ? (
              <GoldButton title={acao ? "Enviando..." : "Solicitar aprovação"} onPress={solicitarAprovacao} disabled={acao} red />
            ) : null}

            {status.creatorStatus === "PENDENTE" ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Em análise</Text>
                <Text style={styles.infoText}>O administrador precisa aprovar sua conta antes da primeira transmissão.</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.gainsTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Meus Ganhos</Text>
                <Text style={styles.subtitle}>Seu talento vale mais aqui</Text>
              </View>
              <Text style={styles.heart}>♡</Text>
            </View>

            {!!erro ? <Text style={styles.warning}>{erro}</Text> : null}

            <View style={styles.moneyGrid}>
              <View style={[styles.moneyCard, styles.pendingCard]}>
                <Text style={styles.moneyIcon}>◷</Text>
                <Text style={styles.moneyLabel}>Saldo pendente</Text>
                <Text style={styles.moneyValue}>{pendingMoney}</Text>
                <Text style={styles.moneyHelper}>{bloqueado > 0 ? "Aguardando liberação" : "Nada pendente"}</Text>
              </View>
              <View style={[styles.moneyCard, styles.availableCard]}>
                <Text style={styles.moneyIcon}>▱</Text>
                <Text style={styles.moneyLabel}>Saldo disponível</Text>
                <Text style={styles.moneyValue}>{availableMoney}</Text>
                <Pressable style={styles.withdrawMini} onPress={() => setMostrarSaque((old) => !old)}>
                  <Text style={styles.withdrawMiniText}>Solicitar saque</Text>
                  <Text style={styles.withdrawMiniArrow}>›</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.tabs}>
              {(["PENDENTES", "DISPONIVEIS", "SAQUES"] as const).map((item) => (
                <Pressable key={item} style={[styles.tab, aba === item && styles.tabActive]} onPress={() => setAba(item)}>
                  <Text style={[styles.tabText, aba === item && styles.tabTextActive]}>
                    {item === "PENDENTES" ? "Pendentes" : item === "DISPONIVEIS" ? "Disponíveis" : "Saques"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mostrarSaque ? (
              <View style={styles.payoutCard}>
                <Text style={styles.sectionTitle}>Solicitar saque PIX</Text>
                <Text style={styles.sectionSub}>Os créditos ficam bloqueados enquanto o saque estiver em análise.</Text>

                <TextInput
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="number-pad"
                  placeholder="Valor em créditos"
                  placeholderTextColor="#726A66"
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
                  placeholderTextColor="#726A66"
                  style={styles.input}
                />

                {!!valor ? <Text style={styles.estimate}>Estimativa: {estimado}</Text> : null}
                <GoldButton title={acao ? "Processando..." : "Confirmar saque"} onPress={pedirSaque} disabled={acao} />
              </View>
            ) : null}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Resumo dos ganhos</Text>
              <Text style={styles.period}>Últimos 7 dias⌄</Text>
            </View>

            <View style={styles.chart}>
              <View style={styles.axisLine} />
              <View style={styles.bars}>
                {chartValues.map((value, index) => (
                  <View key={index} style={styles.barCol}>
                    <View style={[styles.bar, { height: 24 + Math.round((value / chartMax) * 72) }]} />
                    <Text style={styles.barLabel}>{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.revenueRows}>
              <RevenueRow icon="▣" label="Presentes e lives" value={moneyFromCentavos(ganhoCentavos)} />
              <RevenueRow icon="▤" label="Conteúdo exclusivo" value="Em breve" muted />
            </View>

            <View style={styles.liveButtonWrap}>
              <GoldButton title="Abrir uma live agora" onPress={() => router.push("/transmitir")} red />
            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Últimas movimentações</Text>
              <Text style={styles.period}>{dpNumber(ganhos)} créditos</Text>
            </View>

            {saques.length ? saques.slice(0, 5).map((s: any) => (
              <View key={s.id} style={styles.movement}>
                <View style={styles.movementIcon}><Text style={styles.movementIconText}>↓</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movementTitle}>Saque solicitado</Text>
                  <Text style={styles.movementSub}>{statusLabel(s.status)} • {s.tipoChavePix}</Text>
                </View>
                <Text style={styles.movementNegative}>- {moneyFromCentavos(Number(s.valorCentavos || 0))}</Text>
              </View>
            )) : (
              <View style={styles.emptyMovement}>
                <Text style={styles.emptyMovementText}>Suas movimentações aparecerão aqui.</Text>
              </View>
            )}

            {topApoiadores.length ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 10 }]}>Top apoiadores</Text>
                {topApoiadores.slice(0, 5).map((a: any, index: number) => (
                  <View key={a.userId} style={styles.supporter}>
                    <View style={styles.supporterPos}><Text style={styles.supporterPosText}>{index + 1}</Text></View>
                    <Text style={styles.supporterName}>{a.nome}</Text>
                    <Text style={styles.supporterCredits}>{dpNumber(a.creditos)} cr.</Text>
                  </View>
                ))}
              </>
            ) : null}

            <View style={styles.notice}>
              <Text style={styles.noticeIcon}>ⓘ</Text>
              <Text style={styles.noticeText}>Saques seguem a análise e o prazo definidos pela plataforma.</Text>
            </View>
          </>
        )}
      </ScrollView>
      <DPBottomNav />
    </LuxuryScreen>
  );
}

function RevenueRow({ icon, label, value, muted = false }: { icon: string; label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.revenueRow}>
      <View style={styles.revenueIcon}><Text style={styles.revenueIconText}>{icon}</Text></View>
      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={[styles.revenueValue, muted && styles.revenueMuted]}>{value}</Text>
      <Text style={styles.revenueArrow}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  bell: { color: "#F1CE75", fontSize: 24 },
  preTitle: { color: "#F1CE75", fontSize: 10, fontWeight: "900", letterSpacing: 2.6, marginTop: 10 },
  gainsTitleRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 4 },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 38, lineHeight: 42, fontWeight: "700" },
  subtitle: { color: "#9C9591", fontSize: 13, lineHeight: 18, marginTop: 3, marginBottom: 18 },
  heart: { color: "#F2CD70", fontSize: 34, marginTop: 1 },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.58)",
    backgroundColor: "rgba(9,7,6,0.94)",
    padding: 18,
    marginBottom: 14,
  },
  statusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLabel: { color: "#978B84", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  statusAge: { color: "#8F8986", fontSize: 11 },
  statusValue: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 24, fontWeight: "700", marginTop: 8 },
  creatorName: { color: "#FFF", fontSize: 13, marginTop: 4 },
  warning: {
    color: "#FFD1D7",
    backgroundColor: "rgba(130,0,17,0.26)",
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.35)",
    padding: 12,
    borderRadius: 13,
    marginBottom: 12,
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: "rgba(8,7,6,0.94)",
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.35)",
  },
  infoTitle: { color: "#FFF", fontFamily: DP_SERIF, fontWeight: "700", fontSize: 18 },
  infoText: { color: "#9C9591", fontSize: 12, lineHeight: 18, marginTop: 5 },
  moneyGrid: { flexDirection: "row", gap: 10 },
  moneyCard: {
    flex: 1,
    minHeight: 154,
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    justifyContent: "flex-start",
  },
  pendingCard: { backgroundColor: "rgba(96,0,14,0.32)", borderColor: "rgba(229,29,50,0.45)" },
  availableCard: { backgroundColor: "rgba(23,17,7,0.9)", borderColor: "rgba(233,185,73,0.68)" },
  moneyIcon: { color: "#F0D17D", fontSize: 22 },
  moneyLabel: { color: "#C9C0BA", fontSize: 11, marginTop: 6 },
  moneyValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 25, lineHeight: 29, fontWeight: "700", marginTop: 8 },
  moneyHelper: { color: "#A69D97", fontSize: 10, marginTop: 6 },
  withdrawMini: {
    height: 38,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#E2B44B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawMiniText: { color: "#1C1100", fontFamily: DP_SERIF, fontSize: 12, fontWeight: "800" },
  withdrawMiniArrow: { position: "absolute", right: 10, color: "#1C1100", fontSize: 20 },
  tabs: { flexDirection: "row", gap: 7, marginTop: 16, marginBottom: 18 },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(15,11,10,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "rgba(140,0,19,0.48)", borderColor: DP.colors.primary },
  tabText: { color: "#CBC2BC", fontSize: 10, fontWeight: "700" },
  tabTextActive: { color: "#FFF" },
  payoutCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.55)",
    backgroundColor: "rgba(8,7,6,0.96)",
    padding: 16,
    marginBottom: 18,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 12 },
  sectionTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 21, fontWeight: "700" },
  sectionSub: { color: "#8F8986", fontSize: 11, lineHeight: 17, marginTop: 4 },
  period: { color: "#B8AAA1", fontSize: 10 },
  input: {
    backgroundColor: "#0F0E0D",
    color: "#FFF",
    paddingHorizontal: 14,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.28)",
    marginTop: 11,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 11 },
  chip: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: "#11100F", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  chipActive: { backgroundColor: "rgba(145,0,18,0.35)", borderColor: DP.colors.primary },
  chipText: { color: "#948B86", fontSize: 9, fontWeight: "800" },
  chipTextActive: { color: "#FFF" },
  estimate: { color: "#F1CE75", fontSize: 11, fontWeight: "800", marginTop: 9, marginBottom: 10 },
  chart: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.12)",
    backgroundColor: "rgba(7,6,5,0.55)",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },
  axisLine: { position: "absolute", left: 12, right: 12, bottom: 31, height: 1, backgroundColor: "rgba(233,185,73,0.3)" },
  bars: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  bar: {
    width: 22,
    minHeight: 24,
    maxHeight: 96,
    borderRadius: 3,
    backgroundColor: "#E1B34A",
    borderWidth: 1,
    borderColor: "#F7D77A",
  },
  barLabel: { color: "#8D8580", fontSize: 8, marginTop: 5 },
  revenueRows: { marginTop: 14, gap: 7 },
  revenueRow: {
    minHeight: 62,
    borderRadius: 13,
    backgroundColor: "rgba(23,12,9,0.86)",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.14)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  revenueIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(145,0,18,0.42)", borderWidth: 1, borderColor: "rgba(229,29,50,0.5)", alignItems: "center", justifyContent: "center" },
  revenueIconText: { color: "#F2CF77", fontSize: 18 },
  revenueLabel: { flex: 1, color: "#FFF", fontSize: 13, marginLeft: 10 },
  revenueValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700" },
  revenueMuted: { color: "#8F8986", fontFamily: undefined, fontSize: 11 },
  revenueArrow: { color: "#B9AEA7", fontSize: 24, marginLeft: 8 },
  liveButtonWrap: { marginVertical: 18 },
  movement: {
    minHeight: 66,
    borderRadius: 13,
    backgroundColor: "rgba(20,12,9,0.84)",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 7,
  },
  movementIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(145,0,18,0.35)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(229,29,50,0.5)" },
  movementIconText: { color: "#FFF", fontSize: 20 },
  movementTitle: { color: "#FFF", fontSize: 12, fontWeight: "700", marginLeft: 10 },
  movementSub: { color: "#8F8986", fontSize: 9, marginLeft: 10, marginTop: 3 },
  movementNegative: { color: "#FF445E", fontSize: 12, fontWeight: "800" },
  emptyMovement: { paddingVertical: 18, alignItems: "center" },
  emptyMovementText: { color: "#8F8986", fontSize: 11 },
  supporter: { flexDirection: "row", alignItems: "center", minHeight: 54, borderRadius: 12, backgroundColor: "rgba(12,10,8,0.9)", borderWidth: 1, borderColor: "rgba(233,185,73,0.12)", paddingHorizontal: 12, marginBottom: 7 },
  supporterPos: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: "#F1C95D", alignItems: "center", justifyContent: "center" },
  supporterPosText: { color: "#F2CD70", fontWeight: "900" },
  supporterName: { flex: 1, color: "#FFF", fontSize: 12, fontWeight: "700", marginLeft: 10 },
  supporterCredits: { color: "#F2CD70", fontSize: 11, fontWeight: "800" },
  notice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18, marginBottom: 4 },
  noticeIcon: { color: "#BBAA9B", fontSize: 15 },
  noticeText: { color: "#7F7773", fontSize: 9, flex: 1 },
  errorState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 26, paddingBottom: 90 },
  errorStateIcon: { width: 70, height: 70, lineHeight: 70, borderRadius: 35, borderWidth: 1, borderColor: DP.colors.primary, color: DP.colors.primary, textAlign: "center", fontSize: 30, fontWeight: "800" },
  errorStateTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 26, fontWeight: "700", textAlign: "center", marginTop: 20 },
  errorStateText: { color: "#9C9591", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
});
