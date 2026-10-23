import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../services/api";
import { salvarToken } from "../storage/auth";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      return Alert.alert("Atenção", "Informe seu e-mail e sua senha.");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        senha,
      });
      await salvarToken(data.token);
      router.replace("/feed");
    } catch (error: any) {
      Alert.alert(
        "Não foi possível entrar",
        error?.response?.data?.erro ||
          error?.response?.data?.mensagem ||
          "Confira seus dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <View pointerEvents="none" style={styles.background}>
        <View style={styles.redGlowTop} />
        <View style={styles.redGlowMiddle} />
        <View style={styles.redGlowBottom} />
        <View style={styles.goldArcTopOuter} />
        <View style={styles.goldArcTopInner} />
        <View style={styles.goldArcMiddle} />
        <View style={styles.goldArcBottomOuter} />
        <View style={styles.goldArcBottomInner} />
      </View>

      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.brand}>
              <HeartLockMark />
              <Text style={styles.brandText}>Desejo Proibido</Text>
            </View>

            <View style={styles.hero}>
              <View style={styles.eyebrowRow}>
                <Text style={styles.eyebrow}>ENTRE NO SEU ESPAÇO</Text>
                <View style={styles.eyebrowLine} />
              </View>

              <Text style={styles.heroTitle}>Seu momento</Text>
              <Text style={styles.heroTitleGold}>em segredo.</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Acessar minha conta</Text>
              <Text style={styles.formSubtitle}>
                Use o mesmo acesso que você já utiliza no Desejo{"\n"}Proibido.
              </Text>

              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputShell}>
                <EnvelopeIcon />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#67676B"
                  selectionColor="#D6AC59"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Text style={[styles.label, styles.passwordLabel]}>Senha</Text>
              <View style={styles.inputShell}>
                <LockIcon />
                <TextInput
                  placeholder="Sua senha"
                  placeholderTextColor="#67676B"
                  secureTextEntry={!mostrarSenha}
                  selectionColor="#D6AC59"
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable
                  onPress={() => setMostrarSenha((value) => !value)}
                  hitSlop={12}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <Image
                    source={require("../../assets/images/eye-off-reference.png")}
                    style={styles.eyeReference}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/recuperar-senha")}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </Pressable>

              <View style={styles.ctaGlow} />
              <Pressable
                disabled={loading}
                onPress={entrar}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !loading && styles.loginButtonPressed,
                  loading && styles.loginButtonDisabled,
                ]}
              >
                <Text style={styles.loginText}>{loading ? "Entrando..." : "Entrar"}</Text>
                <Text style={styles.loginArrow}>›</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/cadastro")} style={styles.registerRow}>
                <Text style={styles.registerMuted}>Ainda não tem uma conta?</Text>
                <Text style={styles.registerLink}> Criar perfil</Text>
              </Pressable>

              <View style={styles.privateRow}>
                <View style={styles.privateLine} />
                <Text style={styles.privateText}>Ambiente privado +18</Text>
                <View style={styles.privateLine} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function HeartLockMark() {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.logoShackle}>
        <View style={styles.logoShackleInner} />
      </View>
      <Text style={styles.logoHeart}>♡</Text>
      <View style={styles.logoKeyHead} />
      <View style={styles.logoKeyStem} />
    </View>
  );
}

function EnvelopeIcon() {
  return (
    <View style={styles.envelope}>
      <View style={styles.envelopeDiagLeft} />
      <View style={styles.envelopeDiagRight} />
    </View>
  );
}

function LockIcon() {
  return (
    <View style={styles.lockIconWrap}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody}>
        <View style={styles.lockDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020202",
  },
  safe: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#020202",
  },

  redGlowTop: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(126,0,14,0.12)",
    right: -155,
    top: -95,
  },
  redGlowMiddle: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(125,0,15,0.12)",
    left: -170,
    top: 380,
  },
  redGlowBottom: {
    position: "absolute",
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: "rgba(132,0,16,0.12)",
    right: -220,
    bottom: 85,
  },

  goldArcTopOuter: {
    position: "absolute",
    width: 525,
    height: 525,
    borderRadius: 263,
    borderWidth: 1,
    borderColor: "rgba(226,174,69,0.62)",
    right: -365,
    top: -330,
    transform: [{ rotate: "-16deg" }],
  },
  goldArcTopInner: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1,
    borderColor: "rgba(226,174,69,0.25)",
    right: -295,
    top: -260,
    transform: [{ rotate: "-14deg" }],
  },
  goldArcMiddle: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: "rgba(193,134,39,0.31)",
    left: -410,
    top: 310,
    transform: [{ rotate: "11deg" }],
  },
  goldArcBottomOuter: {
    position: "absolute",
    width: 650,
    height: 650,
    borderRadius: 325,
    borderWidth: 1,
    borderColor: "rgba(223,169,58,0.55)",
    left: -485,
    bottom: -440,
    transform: [{ rotate: "10deg" }],
  },
  goldArcBottomInner: {
    position: "absolute",
    width: 530,
    height: 530,
    borderRadius: 265,
    borderWidth: 1,
    borderColor: "rgba(223,169,58,0.20)",
    left: -395,
    bottom: -370,
    transform: [{ rotate: "8deg" }],
  },

  scrollContent: {
    flexGrow: 1,
    minHeight: 1180,
    paddingHorizontal: 44,
    paddingTop: 76,
    paddingBottom: 34,
  },

  brand: {
    height: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  brandText: {
    color: "#EFCB78",
    fontFamily: SERIF,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.45,
    textShadowColor: "rgba(229,177,69,0.22)",
    textShadowRadius: 7,
  },

  logoWrap: {
    width: 70,
    height: 70,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoShackle: {
    position: "absolute",
    top: 2,
    left: 24,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: "#E8BE65",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  logoShackleInner: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    bottom: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,230,163,0.65)",
  },
  logoHeart: {
    position: "absolute",
    top: 10,
    color: "#EFC969",
    fontSize: 61,
    lineHeight: 63,
    fontWeight: "300",
    textShadowColor: "rgba(236,190,89,0.25)",
    textShadowRadius: 6,
  },
  logoKeyHead: {
    position: "absolute",
    top: 31,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F20B39",
  },
  logoKeyStem: {
    position: "absolute",
    top: 38,
    width: 4,
    height: 14,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: "#F20B39",
  },

  hero: {
    marginTop: 51,
  },
  eyebrowRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  eyebrow: {
    color: "#F2EEE9",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 4.2,
    marginRight: 15,
  },
  eyebrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#B98B39",
    opacity: 0.72,
  },

  heroTitle: {
    color: "#FFFDFC",
    fontFamily: SERIF,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: "700",
    letterSpacing: -1.65,
    marginTop: 26,
  },
  heroTitleGold: {
    color: "#E7D28A",
    fontFamily: SERIF,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: -1.8,
    marginTop: -3,
    textShadowColor: "rgba(233,194,106,0.16)",
    textShadowRadius: 8,
  },

  formSection: {
    marginTop: 102,
  },
  formTitle: {
    color: "#FFFDFC",
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.55,
  },
  formSubtitle: {
    color: "#D4D0CD",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    marginTop: 7,
    marginBottom: 28,
  },
  label: {
    color: "#F1D17F",
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 28,
  },

  inputShell: {
    height: 74,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D9B35D",
    backgroundColor: "rgba(4,4,4,0.88)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#F3F1EF",
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 16,
  },

  envelope: {
    width: 24,
    height: 18,
    borderWidth: 1.4,
    borderColor: "#D9BE73",
    borderRadius: 3,
    position: "relative",
    overflow: "hidden",
  },
  envelopeDiagLeft: {
    position: "absolute",
    width: 15,
    height: 1,
    backgroundColor: "#D9BE73",
    left: -1,
    top: 4,
    transform: [{ rotate: "33deg" }],
  },
  envelopeDiagRight: {
    position: "absolute",
    width: 15,
    height: 1,
    backgroundColor: "#D9BE73",
    right: -1,
    top: 4,
    transform: [{ rotate: "-33deg" }],
  },

  lockIconWrap: {
    width: 24,
    height: 26,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  lockShackle: {
    position: "absolute",
    top: 0,
    width: 13,
    height: 13,
    borderWidth: 1.4,
    borderBottomWidth: 0,
    borderColor: "#D9BE73",
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  lockBody: {
    width: 18,
    height: 16,
    borderWidth: 1.4,
    borderColor: "#D9BE73",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  lockDot: {
    width: 2.5,
    height: 5,
    borderRadius: 2,
    backgroundColor: "#D9BE73",
  },

  eyeButton: {
    width: 34,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeReference: {
    width: 22,
    height: 22,
    opacity: 0.96,
  },
  forgotRow: {
    height: 29,
    alignSelf: "flex-end",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 12,
  },
  forgotText: {
    color: "#C6A562",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },

  ctaGlow: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 399,
    height: 122,
    borderRadius: 61,
    backgroundColor: "rgba(179,0,27,0.18)",
    shadowColor: "#D20B31",
    shadowOpacity: 0.42,
    shadowRadius: 30,
    elevation: 7,
  },
  loginButton: {
    height: 72,
    borderRadius: 36,
    marginTop: 18,
    backgroundColor: "#9E061B",
    borderWidth: 1.1,
    borderColor: "#F4D16E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E20D35",
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 8,
  },
  loginButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.997 }],
  },
  loginButtonDisabled: {
    opacity: 0.58,
  },
  loginText: {
    color: "#FFF9F5",
    fontFamily: SERIF,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  loginArrow: {
    position: "absolute",
    right: 28,
    top: 17,
    color: "#F0C960",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "200",
  },

  registerRow: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerMuted: {
    color: "#D7D0CC",
    fontSize: 13,
  },
  registerLink: {
    color: "#ED153C",
    fontSize: 13,
    fontWeight: "600",
  },

  privateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 5,
  },
  privateLine: {
    width: 57,
    height: 1,
    backgroundColor: "#C0A057",
    opacity: 0.72,
  },
  privateText: {
    color: "#8E7963",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
});
