import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { DP_SERIF, Eyebrow, GoldButton, LuxuryBackground, LuxuryBrand } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { api } from "../services/api";
import { salvarToken } from "../storage/auth";

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
      const { data } = await api.post("/auth/login", { email: email.trim(), senha });
      await salvarToken(data.token);
      router.replace("/feed");
    } catch (error: any) {
      Alert.alert(
        "Não foi possível entrar",
        error?.response?.data?.erro || error?.response?.data?.mensagem || "Confira seus dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LuxuryBackground />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <LuxuryBrand centered tagline />

            <View style={styles.hero}>
              <Eyebrow>ENTRE NO SEU ESPAÇO</Eyebrow>
              <Text style={styles.heroTitle}>
                Seu momento{"\n"}
                <Text style={styles.heroGold}>em segredo.</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.formTitle}>Acessar minha conta</Text>
              <Text style={styles.formSubtitle}>Use o mesmo acesso que você já utiliza no Desejo Proibido.</Text>

              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#716D6A"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>♙</Text>
                <TextInput
                  placeholder="Sua senha"
                  placeholderTextColor="#716D6A"
                  secureTextEntry={!mostrarSenha}
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable onPress={() => setMostrarSenha((value) => !value)} hitSlop={8}>
                  <Text style={styles.eye}>{mostrarSenha ? "◉" : "⊘"}</Text>
                </Pressable>
              </View>

              <View style={styles.buttonWrap}>
                <GoldButton
                  title={loading ? "Entrando..." : "Entrar"}
                  onPress={entrar}
                  disabled={loading}
                  red
                />
              </View>

              <Pressable onPress={() => router.push("/cadastro")} style={styles.register}>
                <Text style={styles.registerMuted}>Ainda não tem uma conta?</Text>
                <Text style={styles.registerLink}> Criar perfil</Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.footerLine} />
              <Text style={styles.footer}>Ambiente privado +18</Text>
              <View style={styles.footerLine} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 34,
    justifyContent: "space-between",
  },
  hero: { marginTop: 60 },
  heroTitle: {
    color: "#FFFDFC",
    fontFamily: DP_SERIF,
    fontSize: 44,
    lineHeight: 47,
    fontWeight: "700",
    marginTop: 20,
    letterSpacing: -1.1,
  },
  heroGold: { color: "#F1D17F" },
  form: { marginTop: 68 },
  formTitle: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 29, lineHeight: 34, fontWeight: "700" },
  formSubtitle: { color: "#D0C9C5", fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 24 },
  label: { color: "#F0D486", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700", marginBottom: 7, marginTop: 10 },
  inputWrap: {
    height: 64,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.74)",
    backgroundColor: "rgba(5,5,5,0.78)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  inputIcon: { color: "#E8CD83", fontSize: 21, width: 30 },
  input: { flex: 1, color: "#FFF", fontSize: 15, paddingVertical: 0 },
  eye: { color: "#C49D55", fontSize: 20, paddingLeft: 10 },
  buttonWrap: { marginTop: 30 },
  register: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 22 },
  registerMuted: { color: "#D0C9C5", fontSize: 13 },
  registerLink: { color: DP.colors.primary, fontSize: 13, fontWeight: "800" },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 34, justifyContent: "center" },
  footerLine: { width: 50, height: 1, backgroundColor: "rgba(233,185,73,0.52)" },
  footer: { color: "#9C8D77", fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
});
