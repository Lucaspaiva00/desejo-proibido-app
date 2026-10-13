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

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cadastrar() {
    const mail = email.trim().toLowerCase();

    if (!mail) return Alert.alert("Atenção", "Informe seu e-mail.");
    if (senha.length < 6) return Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
    if (senha !== senha2) return Alert.alert("Atenção", "As senhas não conferem.");
    if (!aceitouTermos) return Alert.alert("Atenção", "Você precisa aceitar os Termos e a Política de Privacidade.");

    try {
      setLoading(true);
      const { data } = await api.post("/auth/registrar", {
        email: mail,
        senha,
        aceitouTermos: true,
      });

      if (data?.token) {
        await salvarToken(data.token);
        Alert.alert(
          "Conta criada",
          "Agora complete seu perfil para aproveitar o Desejo Proibido.",
          [{ text: "Continuar", onPress: () => router.replace("/perfil") }]
        );
        return;
      }

      Alert.alert("Conta criada", "Seu cadastro foi concluído. Faça login para continuar.", [
        { text: "Entrar", onPress: () => router.replace("/") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Não foi possível cadastrar",
        error?.response?.data?.erro || error?.response?.data?.detalhe || "Tente novamente em instantes."
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
              <Eyebrow>CRIAR PERFIL</Eyebrow>
              <Text style={styles.heroTitle}>
                Comece o seu{"\n"}
                <Text style={styles.heroGold}>momento em segredo.</Text>
              </Text>
              <Text style={styles.heroText}>Seu acesso é privado e leva menos de um minuto.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#716D6A"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>◇</Text>
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#716D6A"
                  style={styles.input}
                />
                <Pressable onPress={() => setMostrarSenha((value) => !value)} hitSlop={8}>
                  <Text style={styles.eye}>{mostrarSenha ? "◉" : "⊘"}</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Confirmar senha</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>◇</Text>
                <TextInput
                  value={senha2}
                  onChangeText={setSenha2}
                  secureTextEntry={!mostrarSenha}
                  placeholder="Repita a senha"
                  placeholderTextColor="#716D6A"
                  style={styles.input}
                />
              </View>

              <Pressable style={styles.terms} onPress={() => setAceitouTermos((value) => !value)}>
                <View style={[styles.checkbox, aceitouTermos && styles.checkboxActive]}>
                  <Text style={styles.check}>{aceitouTermos ? "✓" : ""}</Text>
                </View>
                <Text style={styles.termsText}>
                  Eu li e aceito os <Text style={styles.termsLink}>Termos</Text> e a <Text style={styles.termsLink}>Política de Privacidade</Text>.
                </Text>
              </Pressable>

              <GoldButton title={loading ? "Criando conta..." : "Criar perfil"} onPress={cadastrar} disabled={loading} red />

              <Pressable onPress={() => router.replace("/")} style={styles.loginLink}>
                <Text style={styles.loginMuted}>Já tem uma conta?</Text>
                <Text style={styles.loginAccent}> Entrar</Text>
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
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 34 },
  hero: { marginTop: 48, marginBottom: 34 },
  heroTitle: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 38, lineHeight: 42, fontWeight: "700", marginTop: 18, letterSpacing: -0.9 },
  heroGold: { color: "#F1D17F" },
  heroText: { color: "#A9A09B", fontSize: 13, lineHeight: 19, marginTop: 10 },
  form: { gap: 0 },
  label: { color: "#F0D486", fontFamily: DP_SERIF, fontSize: 16, fontWeight: "700", marginBottom: 7, marginTop: 13 },
  inputWrap: { height: 61, borderRadius: 15, borderWidth: 1, borderColor: "rgba(233,185,73,0.72)", backgroundColor: "rgba(5,5,5,0.78)", flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  inputIcon: { color: "#E8CD83", fontSize: 19, width: 30 },
  input: { flex: 1, color: "#FFF", fontSize: 14, paddingVertical: 0 },
  eye: { color: "#C49D55", fontSize: 19, paddingLeft: 10 },
  terms: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 22 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: "#D3B45F", backgroundColor: "#070707", alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxActive: { backgroundColor: "#9E071A", borderColor: "#F1C95D" },
  check: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  termsText: { flex: 1, color: "#AFA7A2", fontSize: 11, lineHeight: 17 },
  termsLink: { color: "#F1CD70", fontWeight: "800" },
  loginLink: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 20 },
  loginMuted: { color: "#C9C1BC", fontSize: 12 },
  loginAccent: { color: DP.colors.primary, fontSize: 12, fontWeight: "800" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 18 },
  footerLine: { width: 50, height: 1, backgroundColor: "rgba(233,185,73,0.52)" },
  footer: { color: "#9C8D77", fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
});
