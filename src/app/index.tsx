import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandMark, Kicker } from "../components/ui/dp-ui";
import { DP } from "../constants/dp-theme";
import { api } from "../services/api";
import { salvarToken } from "../storage/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.top}>
          <BrandMark />
          <View style={styles.heroCopy}>
            <Kicker>ENTRE NO SEU ESPAÇO</Kicker>
            <Text style={styles.title}>Conexões que acontecem do seu jeito.</Text>
            <Text style={styles.subtitle}>Descubra pessoas, converse e acompanhe lives em uma experiência mais privada e direta.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acessar minha conta</Text>
          <Text style={styles.cardSubtitle}>Use o mesmo acesso que você já utiliza no Desejo Proibido.</Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="voce@exemplo.com"
            placeholderTextColor={DP.colors.dim}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="Sua senha"
            placeholderTextColor={DP.colors.dim}
            secureTextEntry
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
          />

          <Pressable disabled={loading} onPress={entrar} style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}>
            <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
            <Text style={styles.buttonArrow}>›</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/cadastro")} style={({ pressed }) => [styles.register, pressed && styles.pressed]}>
            <Text style={styles.registerMuted}>Ainda não tem uma conta?</Text>
            <Text style={styles.registerLink}> Criar perfil</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Ambiente privado • 18+</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DP.colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 22, overflow: "hidden" },
  glowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,45,85,0.10)",
    top: -80,
    right: -110,
  },
  glowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(244,196,106,0.05)",
    bottom: -80,
    left: -100,
  },
  top: { gap: 30, marginBottom: 26 },
  heroCopy: { maxWidth: 420 },
  title: { color: DP.colors.text, fontSize: 31, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, marginTop: 8 },
  subtitle: { color: DP.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  card: {
    backgroundColor: DP.colors.glass,
    borderRadius: DP.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: DP.colors.border,
    ...DP.shadow.card,
  },
  cardTitle: { color: DP.colors.text, fontSize: 20, fontWeight: "900" },
  cardSubtitle: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 17 },
  label: { color: DP.colors.textSoft, fontSize: 11, fontWeight: "900", marginBottom: 7, marginTop: 7 },
  input: {
    height: 54,
    backgroundColor: DP.colors.surface2,
    color: DP.colors.text,
    borderRadius: DP.radius.md,
    borderWidth: 1,
    borderColor: DP.colors.border,
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 9,
  },
  button: {
    marginTop: 12,
    height: 58,
    borderRadius: DP.radius.md,
    backgroundColor: DP.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...DP.shadow.primary,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  buttonArrow: { color: "#fff", fontSize: 27, marginLeft: 7, marginTop: -2 },
  register: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18 },
  registerMuted: { color: DP.colors.muted, fontSize: 13 },
  registerLink: { color: DP.colors.primary, fontSize: 13, fontWeight: "900" },
  footer: { color: DP.colors.dim, textAlign: "center", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 20 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
