import { SymbolView } from "expo-symbols";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DP_SERIF, LockHeart, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP, dpNumber } from "../constants/dp-theme";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";

const BOTTOM_ITEMS = [
  {
    label: "Descobrir",
    route: "/feed",
    symbol: { ios: "safari", android: "explore", web: "explore" },
  },
  {
    label: "Matches",
    route: "/matches",
    symbol: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  },
  {
    label: "Conversas",
    route: "/conversas",
    symbol: { ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  },
  {
    label: "Carteira",
    route: "/carteira",
    symbol: { ios: "wallet.bifold", android: "wallet", web: "wallet" },
  },
  {
    label: "Perfil",
    route: "/perfil",
    symbol: { ios: "person", android: "person_outline", web: "person_outline" },
  },
] as const;

export default function Perfil() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [genero, setGenero] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [saldoCreditos, setSaldoCreditos] = useState(0);
  const [isInvisivel, setIsInvisivel] = useState(false);
  const [fotoPrincipal, setFotoPrincipal] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function authHeader() {
    const token = await obterToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function carregar() {
    try {
      const headers = await authHeader();

      const [perfilRes, premiumRes, usuarioRes] = await Promise.all([
        api.get("/perfil/me", { headers }),
        api.get("/premium/me", { headers }),
        api.get("/usuarios/me", { headers }),
      ]);

      const perfil = perfilRes.data || {};
      const premium = premiumRes.data || {};
      const usuario = usuarioRes.data || {};

      setNome(perfil?.nome || "");
      setBio(perfil?.bio || "");
      setCidade(perfil?.cidade || "");
      setEstado(perfil?.estado || "");
      setGenero(perfil?.genero || "");

      if (perfil?.nascimento) {
        setNascimento(String(perfil.nascimento).substring(0, 10));
      }

      setSaldoCreditos(Number(premium?.saldoCreditos || usuario?.saldoCreditos || 0));
      setIsPremium(!!(premium?.isPremium || usuario?.premiumAtivo));
      setIsInvisivel(!!usuario?.isInvisivel);
      setFotoPrincipal(
        usuario?.fotoPrincipal ||
        perfil?.fotoPrincipal ||
        ""
      );
    } catch (error) {
      console.log("Erro ao carregar perfil:", error);
      Alert.alert("Erro", "Não foi possível carregar o perfil");
    } finally {
      setLoading(false);
    }
  }

  async function salvarPerfil() {
    try {
      const headers = await authHeader();

      await api.put(
        "/perfil",
        { nome, bio, cidade, estado, genero, nascimento },
        { headers }
      );

      setEditando(false);
      Alert.alert("Perfil atualizado", "Suas informações foram salvas com sucesso.");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.erro || "Erro ao salvar perfil"
      );
    }
  }

  async function ativarBoost() {
    try {
      const headers = await authHeader();
      await api.put("/usuarios/boost", {}, { headers });
      Alert.alert("Boost ativado", "Seu perfil recebeu mais destaque.");
      carregar();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.erro || "Erro ao ativar boost"
      );
    }
  }

  async function alterarInvisivel(valor: boolean) {
    try {
      const headers = await authHeader();
      await api.put("/usuarios/invisivel", { ativo: valor }, { headers });
      setIsInvisivel(valor);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.erro || "Erro ao alterar invisível"
      );
    }
  }

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
          <Text style={styles.loadingText}>Carregando seu perfil...</Text>
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
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.pressed,
          ]}
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
      >
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>MEU PERFIL</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.profileHero}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarGoldRing}>
              {fotoPrincipal ? (
                <Image
                  source={{ uri: fotoPrincipal }}
                  resizeMode="cover"
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(nome || "D").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.name}>{nome || "Seu perfil"}</Text>

          <View style={styles.locationRow}>
            <Text style={styles.location}>
              {cidade || "Cidade"}{estado ? ` • ${estado}` : ""}
            </Text>

            {isPremium ? (
              <View style={styles.statusDotWrap}>
                <View style={styles.statusDot} />
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/creditos")}
          style={({ pressed }) => [
            styles.creditBar,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.creditDiamond}>
            <View style={styles.creditDiamondInner} />
          </View>

          <Text style={styles.creditValue}>
            {dpNumber(saldoCreditos)} créditos
          </Text>

          <View style={styles.creditBuyRow}>
            <Text style={styles.creditBuy}>Comprar</Text>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" } as any}
              size={19}
              tintColor="#EBCB78"
              style={styles.creditChevron}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setEditando((old) => !old)}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "pencil", android: "edit", web: "edit" } as any}
            size={21}
            tintColor="#F11E3A"
            style={styles.editIcon}
          />
          <Text style={styles.editButtonText}>
            {editando ? "Fechar edição" : "Editar perfil"}
          </Text>
        </Pressable>

        {editando ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Editar perfil</Text>

            <Field
              label="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
            />

            <View style={styles.editRow}>
              <View style={styles.flexField}>
                <Field
                  label="Cidade"
                  value={cidade}
                  onChangeText={setCidade}
                  placeholder="Cidade"
                />
              </View>

              <View style={styles.stateField}>
                <Field
                  label="Estado"
                  value={estado}
                  onChangeText={setEstado}
                  placeholder="SP"
                  maxLength={2}
                />
              </View>
            </View>

            <Field
              label="Gênero"
              value={genero}
              onChangeText={setGenero}
              placeholder="Gênero"
            />

            <Field
              label="Nascimento"
              value={nascimento}
              onChangeText={setNascimento}
              placeholder="2000-01-01"
            />

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Conte um pouco sobre você..."
              placeholderTextColor="#69635F"
              style={[styles.input, styles.bioInput]}
            />

            <View style={styles.editActions}>
              <Pressable
                onPress={() => router.push("/fotos")}
                style={styles.photosButton}
              >
                <Text style={styles.photosButtonText}>Gerenciar fotos</Text>
              </Pressable>

              <Pressable
                onPress={salvarPerfil}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.premiumCard}>
          <View pointerEvents="none" style={styles.premiumGlow} />

          <View style={styles.premiumTitleRow}>
            <SymbolView
              name={{ ios: "crown.fill", android: "workspace_premium", web: "workspace_premium" } as any}
              size={31}
              tintColor="#F1CA63"
              style={styles.premiumIcon}
            />
            <Text style={styles.premiumTitle}>Premium</Text>
          </View>

          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>
              {isPremium ? "Ativo" : "Disponível"}
            </Text>
          </View>

          <Text style={styles.premiumText}>
            {isPremium
              ? "Aproveite todos os benefícios exclusivos do Premium."
              : "Desbloqueie recursos e tenha mais destaque na plataforma."}
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconStage}>
              <SymbolView
                name={{ ios: "eye.slash", android: "visibility_off", web: "visibility_off" } as any}
                size={27}
                tintColor="#E9233E"
                style={styles.settingIcon}
              />
            </View>

            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Modo invisível</Text>
              <Text style={styles.settingSubtitle}>Navegue sem aparecer</Text>
            </View>

            <Switch
              value={isInvisivel}
              onValueChange={alterarInvisivel}
              trackColor={{
                false: "#242424",
                true: "#7D0718",
              }}
              thumbColor={isInvisivel ? "#F11E3A" : "#E6E6E6"}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconStage}>
              <SymbolView
                name={{ ios: "paperplane.fill", android: "rocket_launch", web: "rocket_launch" } as any}
                size={27}
                tintColor="#E9233E"
                style={styles.settingIcon}
              />
            </View>

            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Boost</Text>
              <Text style={styles.settingSubtitle}>Destaque seu perfil no feed</Text>
            </View>

            <Pressable
              onPress={ativarBoost}
              style={({ pressed }) => [
                styles.boostButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.boostButtonText}>Ativar Boost</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomTopLine} />

        <View style={styles.bottomItems}>
          {BOTTOM_ITEMS.map((item) => {
            const active = item.route === "/perfil";

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

                <View style={styles.bottomIconStage}>
                  <SymbolView
                    name={item.symbol as any}
                    size={active ? 33 : 31}
                    tintColor={active ? "#F11E3A" : "#EADFCF"}
                    style={styles.bottomIcon}
                  />
                </View>

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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#69635F"
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
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

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 6,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(233,185,73,0.44)",
  },
  sectionTitle: {
    color: "#F0D28B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 4.1,
  },

  profileHero: {
    alignItems: "center",
    marginTop: 28,
  },
  avatarGlow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#B6132B",
    backgroundColor: "rgba(91,0,12,0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.75,
    shadowRadius: 21,
    elevation: 9,
  },
  avatarGoldRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 4,
    borderColor: "#F0C866",
    padding: 4,
    backgroundColor: "#090909",
    overflow: "hidden",
    shadowColor: "#F0C866",
    shadowOpacity: 0.44,
    shadowRadius: 9,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 60,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#8D8D8D",
    fontFamily: DP_SERIF,
    fontSize: 52,
    fontWeight: "800",
  },

  name: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    marginTop: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 3,
  },
  location: {
    color: "#A19A95",
    fontSize: 14,
  },
  statusDotWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EC1735",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EC1735",
    shadowOpacity: 0.65,
    shadowRadius: 9,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },

  creditBar: {
    width: "100%",
    height: 64,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.72)",
    backgroundColor: "rgba(8,7,5,0.94)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 23,
  },
  creditDiamond: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#F0C866",
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 19,
  },
  creditDiamondInner: {
    width: 8,
    height: 8,
    backgroundColor: "#15100A",
  },
  creditValue: {
    flex: 1,
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 18,
    fontWeight: "700",
  },
  creditBuyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  creditBuy: {
    color: "#EBCB78",
    fontFamily: DP_SERIF,
    fontSize: 15,
    fontWeight: "700",
  },
  creditChevron: {
    width: 20,
    height: 20,
  },

  editButton: {
    width: "100%",
    height: 61,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FF3150",
    backgroundColor: "rgba(132,0,19,0.52)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 15,
    shadowColor: "#E51D32",
    shadowOpacity: 0.42,
    shadowRadius: 13,
    elevation: 7,
  },
  editIcon: {
    width: 23,
    height: 23,
  },
  editButtonText: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 18,
    fontWeight: "700",
  },

  editCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.56)",
    backgroundColor: "rgba(8,7,6,0.97)",
    padding: 17,
  },
  editCardTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 13,
  },
  editRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexField: {
    flex: 1,
  },
  stateField: {
    width: 94,
  },
  field: {
    marginBottom: 11,
  },
  fieldLabel: {
    color: "#E9CB7D",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.24)",
    backgroundColor: "#0E0E0E",
    color: "#FFF",
    paddingHorizontal: 13,
    fontSize: 13,
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 11,
  },
  photosButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.46)",
    alignItems: "center",
    justifyContent: "center",
  },
  photosButtonText: {
    color: "#E9CB7D",
    fontSize: 12,
    fontWeight: "800",
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3150",
    backgroundColor: "#9D071C",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },

  premiumCard: {
    minHeight: 177,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#F0C866",
    backgroundColor: "rgba(20,13,5,0.95)",
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 18,
    overflow: "hidden",
    shadowColor: "#E9B949",
    shadowOpacity: 0.21,
    shadowRadius: 14,
    elevation: 6,
  },
  premiumGlow: {
    position: "absolute",
    width: 215,
    height: 215,
    borderRadius: 108,
    backgroundColor: "rgba(233,185,73,0.07)",
    right: -90,
    top: -105,
  },
  premiumTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  premiumIcon: {
    width: 33,
    height: 33,
  },
  premiumTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "700",
  },
  premiumBadge: {
    alignSelf: "flex-start",
    minWidth: 74,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#E9B949",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    marginTop: 10,
  },
  premiumBadgeText: {
    color: "#251700",
    fontSize: 11,
    fontWeight: "900",
  },
  premiumText: {
    color: "#C8BDB4",
    fontFamily: DP_SERIF,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 11,
    maxWidth: 330,
  },

  settingsCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(7,7,7,0.94)",
    overflow: "hidden",
  },
  settingRow: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 13,
  },
  settingDivider: {
    height: 1,
    marginHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.075)",
  },
  settingIconStage: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  settingIcon: {
    width: 29,
    height: 29,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  settingSubtitle: {
    color: "#8F8986",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  boostButton: {
    minWidth: 112,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3150",
    backgroundColor: "#A9071C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    shadowColor: "#E51D32",
    shadowOpacity: 0.38,
    shadowRadius: 9,
    elevation: 5,
  },
  boostButtonText: {
    color: "#FFF",
    fontFamily: DP_SERIF,
    fontSize: 13,
    fontWeight: "700",
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
    height: 94,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  bottomItem: {
    flex: 1,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: 5,
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 38,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#F21F3B",
    shadowColor: "#F21F3B",
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomIconStage: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: {
    width: 34,
    height: 34,
  },
  bottomLabel: {
    color: "#D8D0C8",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 2,
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
    transform: [{ scale: 0.99 }],
  },
});
