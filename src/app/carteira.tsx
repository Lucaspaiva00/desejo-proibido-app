import { SymbolView } from "expo-symbols";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DP_SERIF, LockHeart, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP, dpNumber } from "../constants/dp-theme";
import { obterCarteira } from "../services/carteira";
import { getRealtimeSocket } from "../services/liveSocket";
import { statusLives } from "../services/lives";

const BOTTOM_ITEMS = [
  {
    label: "Descobrir",
    route: "/feed",
    symbol: { ios: "safari.fill", android: "explore", web: "explore" },
  },
  {
    label: "Matches",
    route: "/matches",
    symbol: { ios: "heart.fill", android: "favorite", web: "favorite" },
  },
  {
    label: "Conversas",
    route: "/conversas",
    symbol: { ios: "bubble.left.and.bubble.right.fill", android: "forum", web: "forum" },
  },
  {
    label: "Carteira",
    route: "/carteira",
    symbol: { ios: "wallet.bifold.fill", android: "account_balance_wallet", web: "account_balance_wallet" },
  },
  {
    label: "Perfil",
    route: "/perfil",
    symbol: { ios: "person.crop.circle.fill", android: "account_circle", web: "account_circle" },
  },
] as const;

export default function Carteira() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [minutos, setMinutos] = useState(0);

  const carregar = useCallback(async () => {
    try {
      const [wallet, status] = await Promise.all([
        obterCarteira(),
        statusLives(),
      ]);

      setSaldo(Number(wallet?.saldoCreditos || 0));
      setMinutos(Number(status?.minutosDisponiveis || 0));
    } catch (error) {
      console.log("Erro ao carregar carteira:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();

    let socket: any;

    const walletUpdate = (payload: any) => {
      if (payload?.saldoCreditos != null) {
        setSaldo(Number(payload.saldoCreditos));
      }
    };

    (async () => {
      try {
        socket = await getRealtimeSocket();
        socket.on("wallet:update", walletUpdate);
      } catch {}
    })();

    return () => socket?.off("wallet:update", walletUpdate);
  }, [carregar]);

  function abrirMenu() {
    if (navigation?.openDrawer) navigation.openDrawer();
    else navigation?.getParent?.()?.openDrawer?.();
  }

  if (loading) {
    return (
      <LuxuryScreen style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <LockHeart size={76} />
          <ActivityIndicator size="small" color={DP.colors.gold} />
          <Text style={styles.loadingText}>Carregando sua carteira...</Text>
        </View>
      </LuxuryScreen>
    );
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={DP.colors.gold}
            onRefresh={() => {
              setRefreshing(true);
              carregar();
            }}
          />
        }
      >
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>CARTEIRA</Text>
          <View style={styles.eyebrowLine} />
        </View>

        <Text style={styles.title}>Seu saldo</Text>
        <Text style={styles.subtitle}>
          Gerencie seus créditos, minutos e benefícios
        </Text>

        <View style={styles.balanceCard}>
          <View pointerEvents="none" style={styles.balanceRedGlow} />
          <View pointerEvents="none" style={styles.balanceGoldGlow} />

          <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>

          <View style={styles.balanceRow}>
            <View style={styles.coinGlow}>
              <View style={styles.coinOuter}>
                <View style={styles.coinInner}>
                  <Text style={styles.coinText}>D+</Text>
                </View>
              </View>
            </View>

            <View style={styles.balanceCopy}>
              <Text style={styles.balanceValue}>{dpNumber(saldo)}</Text>
              <Text style={styles.balanceUnit}>créditos</Text>
            </View>
          </View>

          <View style={styles.updatedRow}>
            <View style={styles.updatedDot} />
            <Text style={styles.updatedText}>Atualizado agora</Text>
          </View>

          <Pressable
            onPress={() => router.push("/creditos")}
            style={({ pressed }) => [
              styles.buyButton,
              pressed && styles.buyButtonPressed,
            ]}
          >
            <Text style={styles.buyButtonText}>Comprar créditos</Text>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
              size={23}
              tintColor="#F7D36B"
              style={styles.buyArrow}
            />
          </Pressable>
        </View>

        <View style={styles.minutesRow}>
          <View style={styles.minutesOrb}>
            <View style={styles.minutesOrbInner}>
              <View style={styles.minutesDot} />
            </View>
          </View>

          <View style={styles.minutesCopy}>
            <Text style={styles.minutesValue}>{dpNumber(minutos)}</Text>
            <Text style={styles.minutesLabel}>minutos de live</Text>
          </View>
        </View>

        <View style={styles.quickEyebrowRow}>
          <Text style={styles.eyebrow}>ACESSO RÁPIDO</Text>
          <View style={styles.eyebrowLine} />
        </View>

        <View style={styles.quickRow}>
          <QuickCard
            icon={{ ios: "play.fill", android: "play_arrow", web: "play_arrow" }}
            title="Assistir lives"
            subtitle="Criadora ao vivo"
            onPress={() => router.push("/lives")}
          />

          <QuickCard
            icon={{ ios: "tshirt.fill", android: "checkroom", web: "checkroom" }}
            title="Área da Criadora"
            subtitle="Ganhos e saques"
            onPress={() => router.push("/criadora")}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomTopLine} />

        <View style={styles.bottomItems}>
          {BOTTOM_ITEMS.map((item) => {
            const active = item.route === "/carteira";

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

                <SymbolView
                  name={item.symbol as any}
                  size={28}
                  tintColor={active ? "#F11E3A" : "#E8DED3"}
                  style={styles.bottomIcon}
                />

                <Text
                  style={[
                    styles.bottomLabel,
                    active && styles.bottomLabelActive,
                  ]}
                >
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

function QuickCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: { ios: string; android: string; web: string };
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.quickCardPressed,
      ]}
    >
      <View style={styles.quickIcon}>
        <SymbolView
          name={icon as any}
          size={22}
          tintColor="#F0C968"
          style={styles.quickIconSymbol}
        />
      </View>

      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>

      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
        size={21}
        tintColor="#F0C968"
        style={styles.quickArrow}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#020202",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#928A85",
    fontSize: 12,
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
    paddingHorizontal: 22,
    paddingBottom: 132,
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 9,
  },
  quickEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 9,
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

  title: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 42,
    lineHeight: 47,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 17,
  },
  subtitle: {
    color: "#8F8986",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 24,
  },

  balanceCard: {
    overflow: "hidden",
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: "#1A0304",
    borderWidth: 1.4,
    borderColor: "#F3C95E",
    shadowColor: "#E51D32",
    shadowOpacity: 0.46,
    shadowRadius: 22,
    elevation: 10,
  },
  balanceRedGlow: {
    position: "absolute",
    width: 360,
    height: 280,
    borderRadius: 180,
    backgroundColor: "rgba(176,0,21,0.28)",
    right: -130,
    top: -100,
  },
  balanceGoldGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: "rgba(249,205,93,0.22)",
    left: -130,
    bottom: -135,
  },

  balanceLabel: {
    color: "#F1D78B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3.4,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 19,
  },

  coinGlow: {
    width: 101,
    height: 101,
    borderRadius: 51,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,203,92,0.04)",
    shadowColor: "#F6CA59",
    shadowOpacity: 0.58,
    shadowRadius: 15,
    elevation: 8,
  },
  coinOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "#F7D36B",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120C05",
  },
  coinInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#916717",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,8,4,0.95)",
  },
  coinText: {
    color: "#F5D36D",
    fontFamily: DP_SERIF,
    fontSize: 34,
    fontWeight: "800",
  },

  balanceCopy: {
    flex: 1,
  },
  balanceValue: {
    color: "#FFD36F",
    fontFamily: DP_SERIF,
    fontSize: 58,
    lineHeight: 58,
    fontWeight: "800",
    letterSpacing: -1.8,
  },
  balanceUnit: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "700",
    marginTop: -1,
  },

  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 16,
  },
  updatedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2FE26E",
    shadowColor: "#2FE26E",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 7,
  },
  updatedText: {
    color: "#A7A09C",
    fontSize: 13,
  },

  buyButton: {
    height: 60,
    borderRadius: 30,
    marginTop: 22,
    backgroundColor: "#A9071C",
    borderWidth: 1.2,
    borderColor: "#F5D36D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.58,
    shadowRadius: 15,
    elevation: 8,
  },
  buyButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  buyButtonText: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 19,
    fontWeight: "800",
  },
  buyArrow: {
    position: "absolute",
    right: 19,
    width: 24,
    height: 24,
  },

  minutesRow: {
    minHeight: 122,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 7,
    marginVertical: 16,
  },
  minutesOrb: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.45)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(80,0,10,0.12)",
    shadowColor: "#D6112C",
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  minutesOrbInner: {
    width: 61,
    height: 61,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "rgba(132,20,36,0.34)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,3,7,0.28)",
  },
  minutesDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: DP.colors.primary,
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 7,
  },
  minutesCopy: {
    justifyContent: "center",
  },
  minutesValue: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 42,
    lineHeight: 43,
    fontWeight: "700",
  },
  minutesLabel: {
    color: "#C8C0BA",
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },

  quickRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  quickCard: {
    flex: 1,
    minHeight: 151,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.60)",
    backgroundColor: "rgba(8,7,6,0.94)",
    paddingHorizontal: 15,
    paddingTop: 17,
    paddingBottom: 15,
  },
  quickCardPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.985 }],
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1C95D",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120D07",
  },
  quickIconSymbol: {
    width: 24,
    height: 24,
  },
  quickTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 13,
  },
  quickSubtitle: {
    color: "#8F8986",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  quickArrow: {
    position: "absolute",
    right: 13,
    bottom: 17,
    width: 22,
    height: 22,
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
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  bottomItem: {
    flex: 1,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 34,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#F21F3B",
    shadowColor: "#F21F3B",
    shadowOpacity: 0.95,
    shadowRadius: 9,
    elevation: 8,
  },
  bottomIcon: {
    width: 30,
    height: 30,
  },
  bottomLabel: {
    color: "#D3CBC5",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "500",
    marginTop: 4,
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
