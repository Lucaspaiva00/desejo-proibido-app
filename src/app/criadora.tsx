import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
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
import { AppHeader, DP_SERIF, GoldButton, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
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
const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function moneyFromCentavos(value: number) {
  return (Number(value || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
          setErro(
            apiErrorMessage(
              e,
              "Não foi possível carregar o financeiro da criadora."
            )
          );
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
  const centsPerCredit = Number(
    config?.creditoValorCentavos ||
    config?.centavosPorCredito ||
    1
  );

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
      return Alert.alert(
        "Dados incompletos",
        "Informe o valor em créditos e sua chave PIX."
      );
    }

    Alert.alert(
      "Confirmar saque",
      `Solicitar ${valorCreditos} créditos (${estimado}) para ${pixType}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            try {
              setAcao(true);
              await solicitarSaqueCriadora({
                valorCreditos,
                chavePix: pix.trim(),
                tipoChavePix: pixType,
              });
              setValor("");
              setPix("");
              setMostrarSaque(false);
              await carregar();
              Alert.alert(
                "Saque solicitado",
                "O valor foi reservado e enviado para análise."
              );
            } catch (e: any) {
              Alert.alert("Saque não realizado", apiErrorMessage(e));
            } finally {
              setAcao(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <LuxuryScreen style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <ActivityIndicator size="small" color={DP.colors.gold} />
          <Text style={styles.loadingText}>Carregando seus ganhos...</Text>
        </View>
      </LuxuryScreen>
    );
  }

  if (!status) {
    return (
      <LuxuryScreen style={styles.screen}>
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.errorState}>
          <View style={styles.errorStateIcon}>
            <Text style={styles.errorStateIconText}>!</Text>
          </View>
          <Text style={styles.errorStateTitle}>Área da Criadora indisponível</Text>
          <Text style={styles.errorStateText}>
            {erro || "Não foi possível carregar os dados agora."}
          </Text>
          <View style={styles.retryWrap}>
            <GoldButton title="Tentar novamente" onPress={carregar} red />
          </View>
        </View>
        <DPBottomNav />
      </LuxuryScreen>
    );
  }

  const disponivel = Number(
    financeiro?.carteira?.disponivel ??
    status.carteira.disponivel ??
    0
  );
  const bloqueado = Number(
    financeiro?.carteira?.bloqueado ??
    status.carteira.bloqueado ??
    0
  );
  const ganhoCentavos = Number(
    financeiro?.ganhos?.valorCentavosEstimado ||
    0
  );
  const saques = Array.isArray(financeiro?.saques)
    ? financeiro.saques
    : [];

  const pendingMoney = moneyFromCentavos(bloqueado * centsPerCredit);
  const availableMoney = moneyFromCentavos(disponivel * centsPerCredit);

  const resumo7Dias = Array.isArray(financeiro?.resumo7Dias)
    ? financeiro.resumo7Dias.slice(-7)
    : [];

  const chartValues = dias.map((_, index) =>
    Number(resumo7Dias[index]?.valorCentavos || 0)
  );
  const chartMax = Math.max(...chartValues, 1);

  return (
    <LuxuryScreen style={styles.screen}>
      <StatusBar style="light" />
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {!status.podeTransmitir ? (
          <PendingCreator
            status={status}
            erro={erro}
            acao={acao}
            onRequest={solicitarAprovacao}
          />
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Meus Ganhos</Text>

              <View style={styles.talentWrap}>
                <Text style={styles.talentText}>
                  Seu talento{"\n"}vale mais aqui
                </Text>
                <SymbolView
                  name={{ ios: "heart", android: "favorite_border", web: "favorite_border" } as any}
                  size={28}
                  tintColor="#EBCB79"
                  style={styles.talentHeart}
                />
              </View>
            </View>

            {!!erro ? <Text style={styles.warning}>{erro}</Text> : null}

            <View style={styles.moneyGrid}>
              <View style={[styles.moneyCard, styles.pendingCard]}>
                <View style={styles.moneyLabelRow}>
                  <View style={styles.moneyIconCircle}>
                    <SymbolView
                      name={{ ios: "clock", android: "schedule", web: "schedule" } as any}
                      size={23}
                      tintColor="#F1DFD6"
                      style={styles.moneyIcon}
                    />
                  </View>
                  <Text style={styles.moneyLabel}>Saldo pendente</Text>
                </View>

                <Text style={styles.moneyValue}>{pendingMoney}</Text>
                <Text style={styles.moneyHelper}>
                  {bloqueado > 0
                    ? "Disponível após aprovação"
                    : "Nada pendente"}
                </Text>
              </View>

              <View style={[styles.moneyCard, styles.availableCard]}>
                <View style={styles.moneyLabelRow}>
                  <View style={styles.moneyIconCircleGold}>
                    <SymbolView
                      name={{ ios: "wallet.bifold", android: "wallet", web: "wallet" } as any}
                      size={23}
                      tintColor="#F0CE77"
                      style={styles.moneyIcon}
                    />
                  </View>
                  <Text style={styles.moneyLabel}>Saldo disponível</Text>
                </View>

                <Text style={styles.moneyValue}>{availableMoney}</Text>

                <Pressable
                  onPress={() => setMostrarSaque((old) => !old)}
                  style={({ pressed }) => [
                    styles.withdrawButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.withdrawButtonText}>Solicitar saque</Text>
                  <SymbolView
                    name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
                    size={20}
                    tintColor="#281700"
                    style={styles.withdrawArrow}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.tabs}>
              {(["PENDENTES", "DISPONIVEIS", "SAQUES"] as const).map((item) => {
                const active = aba === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setAba(item)}
                    style={[
                      styles.tab,
                      active && styles.tabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        active && styles.tabTextActive,
                      ]}
                    >
                      {item === "PENDENTES"
                        ? "Pendentes"
                        : item === "DISPONIVEIS"
                          ? "Disponíveis"
                          : "Saques"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mostrarSaque ? (
              <View style={styles.payoutCard}>
                <Text style={styles.payoutTitle}>Solicitar saque PIX</Text>
                <Text style={styles.payoutText}>
                  Os créditos ficam bloqueados enquanto o saque estiver em análise.
                </Text>

                <TextInput
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="number-pad"
                  placeholder="Valor em créditos"
                  placeholderTextColor="#756D68"
                  style={styles.input}
                />

                <View style={styles.chips}>
                  {pixTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setPixType(type)}
                      style={[
                        styles.chip,
                        pixType === type && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          pixType === type && styles.chipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={pix}
                  onChangeText={setPix}
                  placeholder="Chave PIX"
                  autoCapitalize="none"
                  placeholderTextColor="#756D68"
                  style={styles.input}
                />

                {!!valor ? (
                  <Text style={styles.estimate}>Estimativa: {estimado}</Text>
                ) : null}

                <Pressable
                  disabled={acao}
                  onPress={pedirSaque}
                  style={({ pressed }) => [
                    styles.confirmPayout,
                    acao && styles.disabled,
                    pressed && !acao && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmPayoutText}>
                    {acao ? "Processando..." : "Confirmar saque"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumo dos ganhos</Text>

              <View style={styles.periodPill}>
                <Text style={styles.periodText}>Últimos 7 dias</Text>
                <SymbolView
                  name={{ ios: "chevron.down", android: "expand_more", web: "expand_more" } as any}
                  size={17}
                  tintColor="#C9BDB5"
                  style={styles.periodIcon}
                />
              </View>
            </View>

            <View style={styles.chart}>
              <View style={[styles.gridLine, { bottom: 34 }]} />
              <View style={[styles.gridLine, { bottom: 72 }]} />
              <View style={[styles.gridLine, { bottom: 110 }]} />

              <View style={styles.axisLabels}>
                <Text style={styles.axisText}>R$ 300</Text>
                <Text style={styles.axisText}>R$ 200</Text>
                <Text style={styles.axisText}>R$ 100</Text>
                <Text style={styles.axisText}>R$ 0</Text>
              </View>

              <View style={styles.bars}>
                {dias.map((dia, index) => {
                  const value = chartValues[index] || 0;
                  const height = value > 0
                    ? 12 + Math.round((value / chartMax) * 76)
                    : 8;

                  return (
                    <View key={dia} style={styles.barCol}>
                      <View
                        style={[
                          styles.bar,
                          value === 0 && styles.barEmpty,
                          { height },
                        ]}
                      />
                      <Text style={styles.barLabel}>{dia}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.revenueRows}>
              <RevenueRow
                symbol={{ ios: "video.fill", android: "videocam", web: "videocam" }}
                label="Presentes em videochamadas"
                value={moneyFromCentavos(ganhoCentavos)}
                accent="red"
              />

              <RevenueRow
                symbol={{ ios: "doc.text.fill", android: "description", web: "description" }}
                label="Venda de conteúdo"
                value={moneyFromCentavos(0)}
                accent="red"
              />
            </View>

            <View style={styles.movementsHeader}>
              <Text style={styles.sectionTitle}>Últimas movimentações</Text>
              <Text style={styles.viewAll}>Ver todas</Text>
            </View>

            <View style={styles.movementsCard}>
              {saques.length ? (
                saques.slice(0, 5).map((item: any, index: number) => (
                  <MovementRow
                    key={item.id}
                    title="Saque solicitado"
                    subtitle={`${statusLabel(item.status)} • ${item.tipoChavePix || "PIX"}`}
                    value={`- ${moneyFromCentavos(Number(item.valorCentavos || 0))}`}
                    negative
                    last={index === Math.min(saques.length, 5) - 1}
                  />
                ))
              ) : (
                <View style={styles.emptyMovements}>
                  <Text style={styles.emptyMovementsText}>
                    Nenhuma movimentação registrada ainda.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.notice}>
              <SymbolView
                name={{ ios: "info.circle", android: "info", web: "info" } as any}
                size={17}
                tintColor="#AFA49B"
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                Saques processados conforme o prazo definido pela plataforma.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <DPBottomNav />
    </LuxuryScreen>
  );
}

function PendingCreator({
  status,
  erro,
  acao,
  onRequest,
}: {
  status: CriadoraStatus;
  erro: string;
  acao: boolean;
  onRequest: () => void;
}) {
  return (
    <View style={styles.pendingWrap}>
      <Text style={styles.pendingKicker}>CREATOR CENTER</Text>
      <Text style={styles.pendingTitle}>Área da Criadora</Text>
      <Text style={styles.pendingSubtitle}>
        Transmita, acompanhe seus ganhos e solicite saques.
      </Text>

      <View style={styles.pendingStatusCard}>
        <Text style={styles.pendingStatusLabel}>STATUS DA CONTA</Text>
        <Text style={styles.pendingStatusValue}>
          {statusLabel(status.creatorStatus)}
        </Text>
        <Text style={styles.pendingName}>{status.nome || "Seu perfil"}</Text>
      </View>

      {status.creatorMotivo ? (
        <Text style={styles.warning}>{status.creatorMotivo}</Text>
      ) : null}

      {!!erro ? <Text style={styles.warning}>{erro}</Text> : null}

      {!status.elegivelParaSolicitar &&
      status.creatorStatus === "NAO_SOLICITADO" ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Conta ainda não elegível</Text>
          <Text style={styles.infoText}>
            O perfil precisa ser feminino, estar ativo e ter 18 anos ou mais.
          </Text>
        </View>
      ) : null}

      {status.elegivelParaSolicitar &&
      status.creatorStatus !== "PENDENTE" ? (
        <GoldButton
          title={acao ? "Enviando..." : "Solicitar aprovação"}
          onPress={onRequest}
          disabled={acao}
          red
        />
      ) : null}

      {status.creatorStatus === "PENDENTE" ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Em análise</Text>
          <Text style={styles.infoText}>
            O administrador precisa aprovar sua conta antes da primeira transmissão.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function RevenueRow({
  symbol,
  label,
  value,
}: {
  symbol: { ios: string; android: string; web: string };
  label: string;
  value: string;
  accent?: "red" | "gold";
}) {
  return (
    <View style={styles.revenueRow}>
      <View style={styles.revenueIcon}>
        <SymbolView
          name={symbol as any}
          size={22}
          tintColor="#F2D7C9"
          style={styles.revenueIconSymbol}
        />
      </View>

      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={styles.revenueValue}>{value}</Text>

      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
        size={18}
        tintColor="#B9AEA7"
        style={styles.revenueChevron}
      />
    </View>
  );
}

function MovementRow({
  title,
  subtitle,
  value,
  negative = false,
  last = false,
}: {
  title: string;
  subtitle: string;
  value: string;
  negative?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.movementRow, last && styles.movementRowLast]}>
      <View style={styles.movementIcon}>
        <SymbolView
          name={{ ios: "arrow.down.circle", android: "download", web: "download" } as any}
          size={22}
          tintColor="#F0D0C3"
          style={styles.movementSymbol}
        />
      </View>

      <View style={styles.movementCopy}>
        <Text style={styles.movementTitle}>{title}</Text>
        <Text style={styles.movementSubtitle}>{subtitle}</Text>
      </View>

      <Text
        style={[
          styles.movementValue,
          negative && styles.movementNegative,
        ]}
      >
        {value}
      </Text>

      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
        size={17}
        tintColor="#A99E96"
        style={styles.movementChevron}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#050201",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#9B918A",
    fontSize: 12,
  },

  topBar: {
    minHeight: 90,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    width: 27,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#EBCB79",
  },
  brand: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandCrown: {
    width: 26,
    height: 26,
    marginBottom: -1,
  },
  brandCopy: {
    alignItems: "center",
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandGold: {
    color: "#E6D1C4",
    fontFamily: DP_SERIF,
    fontSize: 20,
    fontWeight: "700",
  },
  brandRed: {
    color: "#DC2B47",
    fontFamily: DP_SERIF,
    fontSize: 20,
    fontWeight: "700",
  },
  brandTagline: {
    color: "#B7A79C",
    fontSize: 6.5,
    letterSpacing: 2.2,
    fontWeight: "800",
    marginTop: 1,
  },
  headerSpacer: {
    width: 44,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 16,
  },
  title: {
    color: "#FFF9F5",
    fontFamily: DP_SERIF,
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  talentWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 5,
  },
  talentText: {
    color: "#B2A7A0",
    fontSize: 11,
    lineHeight: 13,
    textAlign: "right",
  },
  talentHeart: {
    width: 30,
    height: 30,
  },

  warning: {
    color: "#FFD1D7",
    backgroundColor: "rgba(130,0,17,0.28)",
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.35)",
    padding: 12,
    borderRadius: 13,
    marginBottom: 12,
    fontSize: 12,
  },

  moneyGrid: {
    flexDirection: "row",
    gap: 9,
  },
  moneyCard: {
    flex: 1,
    minHeight: 167,
    borderRadius: 17,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  pendingCard: {
    backgroundColor: "rgba(86,4,15,0.78)",
    borderColor: "rgba(182,32,49,0.68)",
  },
  availableCard: {
    backgroundColor: "rgba(27,18,10,0.92)",
    borderColor: "rgba(230,188,91,0.78)",
    shadowColor: "#E4B956",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  moneyLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  moneyIconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(239,214,202,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  moneyIconCircleGold: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(236,198,101,0.60)",
    alignItems: "center",
    justifyContent: "center",
  },
  moneyIcon: {
    width: 24,
    height: 24,
  },
  moneyLabel: {
    color: "#E2DAD5",
    fontSize: 12,
    flexShrink: 1,
  },
  moneyValue: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    marginTop: 13,
  },
  moneyHelper: {
    color: "#D4CBC6",
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 10,
  },

  withdrawButton: {
    height: 42,
    borderRadius: 9,
    marginTop: 13,
    backgroundColor: "#E5B850",
    borderWidth: 1,
    borderColor: "#F4D37C",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawButtonText: {
    color: "#271700",
    fontFamily: DP_SERIF,
    fontSize: 12,
    fontWeight: "800",
  },
  withdrawArrow: {
    position: "absolute",
    right: 10,
    width: 20,
    height: 20,
  },

  tabs: {
    flexDirection: "row",
    gap: 7,
    marginTop: 17,
    marginBottom: 19,
  },
  tab: {
    flex: 1,
    height: 41,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(31,23,19,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "rgba(119,8,22,0.76)",
    borderColor: "#E32A43",
    shadowColor: "#E51D32",
    shadowOpacity: 0.20,
    shadowRadius: 7,
  },
  tabText: {
    color: "#DDD2CB",
    fontSize: 10.5,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFF",
    fontWeight: "800",
  },

  payoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231,191,98,0.48)",
    backgroundColor: "rgba(14,9,7,0.98)",
    padding: 15,
    marginBottom: 18,
  },
  payoutTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 20,
    fontWeight: "700",
  },
  payoutText: {
    color: "#9E938B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  input: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.25)",
    backgroundColor: "#0D0B0A",
    color: "#FFF",
    paddingHorizontal: 13,
    marginTop: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#11100F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: "rgba(145,0,18,0.35)",
    borderColor: DP.colors.primary,
  },
  chipText: {
    color: "#948B86",
    fontSize: 9,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFF",
  },
  estimate: {
    color: "#F1CE75",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
    marginBottom: 10,
  },
  confirmPayout: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#E4B64D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  confirmPayoutText: {
    color: "#261700",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFF7F2",
    fontFamily: DP_SERIF,
    fontSize: 21,
    fontWeight: "700",
  },
  periodPill: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(19,15,13,0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 7,
  },
  periodText: {
    color: "#BEB2AA",
    fontSize: 9.5,
  },
  periodIcon: {
    width: 17,
    height: 17,
  },

  chart: {
    height: 150,
    position: "relative",
    marginBottom: 14,
    paddingLeft: 46,
    paddingRight: 5,
    paddingTop: 8,
    paddingBottom: 21,
  },
  gridLine: {
    position: "absolute",
    left: 47,
    right: 4,
    height: 1,
    backgroundColor: "rgba(216,186,154,0.13)",
  },
  axisLabels: {
    position: "absolute",
    left: 0,
    top: 2,
    bottom: 21,
    justifyContent: "space-between",
  },
  axisText: {
    color: "#8E837C",
    fontSize: 8,
  },
  bars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barCol: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 24,
    minHeight: 8,
    borderRadius: 4,
    backgroundColor: "#E3B85B",
    borderWidth: 1,
    borderColor: "#F2D17B",
    shadowColor: "#E4B956",
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
  barEmpty: {
    opacity: 0.24,
  },
  barLabel: {
    color: "#9A8E86",
    fontSize: 8.5,
    marginTop: 6,
  },

  revenueRows: {
    gap: 7,
  },
  revenueRow: {
    minHeight: 61,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(35,18,14,0.88)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },
  revenueIcon: {
    width: 41,
    height: 41,
    borderRadius: 21,
    backgroundColor: "rgba(125,8,22,0.78)",
    borderWidth: 1,
    borderColor: "rgba(206,42,59,0.54)",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueIconSymbol: {
    width: 23,
    height: 23,
  },
  revenueLabel: {
    flex: 1,
    color: "#F5EEE9",
    fontSize: 12.5,
    marginLeft: 11,
  },
  revenueValue: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 15,
    fontWeight: "700",
  },
  revenueChevron: {
    width: 18,
    height: 18,
    marginLeft: 8,
  },

  movementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  viewAll: {
    color: "#D7B497",
    fontSize: 10,
  },
  movementsCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
    backgroundColor: "rgba(27,15,12,0.88)",
    overflow: "hidden",
  },
  movementRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },
  movementRowLast: {
    borderBottomWidth: 0,
  },
  movementIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.40)",
    backgroundColor: "rgba(79,43,11,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  movementSymbol: {
    width: 23,
    height: 23,
  },
  movementCopy: {
    flex: 1,
    marginLeft: 10,
  },
  movementTitle: {
    color: "#F6EFEB",
    fontSize: 11.5,
    fontWeight: "600",
  },
  movementSubtitle: {
    color: "#8E837D",
    fontSize: 8.5,
    marginTop: 3,
  },
  movementValue: {
    color: "#3DDC84",
    fontSize: 11.5,
    fontWeight: "800",
  },
  movementNegative: {
    color: "#EF3D55",
  },
  movementChevron: {
    width: 18,
    height: 18,
    marginLeft: 7,
  },
  emptyMovements: {
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyMovementsText: {
    color: "#8F847D",
    fontSize: 10.5,
    textAlign: "center",
  },

  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 15,
  },
  noticeIcon: {
    width: 18,
    height: 18,
  },
  noticeText: {
    color: "#8C817A",
    fontSize: 9,
  },

  pendingWrap: {
    paddingTop: 8,
  },
  pendingKicker: {
    color: "#F1CE75",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.6,
  },
  pendingTitle: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    marginTop: 8,
  },
  pendingSubtitle: {
    color: "#9C9591",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 18,
  },
  pendingStatusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.58)",
    backgroundColor: "rgba(9,7,6,0.94)",
    padding: 18,
    marginBottom: 14,
  },
  pendingStatusLabel: {
    color: "#978B84",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  pendingStatusValue: {
    color: "#F2CD70",
    fontFamily: DP_SERIF,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  pendingName: {
    color: "#FFF",
    fontSize: 13,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: "rgba(8,7,6,0.94)",
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.35)",
  },
  infoTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontWeight: "700",
    fontSize: 18,
  },
  infoText: {
    color: "#9C9591",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingBottom: 90,
  },
  errorStateIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: DP.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorStateIconText: {
    color: DP.colors.primary,
    fontSize: 30,
    fontWeight: "800",
  },
  errorStateTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },
  errorStateText: {
    color: "#9C9591",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  retryWrap: {
    width: "100%",
    marginTop: 22,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
