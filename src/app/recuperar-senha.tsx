import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { api } from "../services/api";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      Alert.alert("Atenção", "Informe o e-mail da sua conta.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email: mail });
      setEnviado(true);
    } catch (error: any) {
      Alert.alert(
        "Não foi possível enviar",
        error?.response?.data?.erro || "Tente novamente em instantes."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.arcTop} />
        <View style={styles.arcBottom} />
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
            contentContainerStyle={styles.content}
          >
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <Text style={styles.eyebrow}>ACESSO PRIVADO</Text>
            <View style={styles.line} />

            <Text style={styles.title}>Recupere sua{"\n"}<Text style={styles.titleGold}>senha.</Text></Text>

            {!enviado ? (
              <View style={styles.form}>
                <Text style={styles.heading}>Informe seu e-mail</Text>
                <Text style={styles.description}>
                  Enviaremos um link seguro para você criar uma nova senha.
                </Text>

                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputShell}>
                  <Text style={styles.mail}>✉</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="voce@exemplo.com"
                    placeholderTextColor="#67676B"
                    selectionColor="#D6AC59"
                    style={styles.input}
                  />
                </View>

                <Pressable
                  disabled={loading}
                  onPress={enviar}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && !loading && { opacity: 0.9 },
                    loading && { opacity: 0.58 },
                  ]}
                >
                  <Text style={styles.buttonText}>{loading ? "Enviando..." : "Enviar link"}</Text>
                  <Text style={styles.buttonArrow}>›</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.success}>
                <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
                <Text style={styles.successTitle}>Confira seu e-mail</Text>
                <Text style={styles.successText}>
                  Se existir uma conta vinculada a {email.trim()}, você receberá as instruções para redefinir sua senha.
                </Text>
                <Pressable onPress={() => router.replace("/")} style={styles.button}>
                  <Text style={styles.buttonText}>Voltar para entrar</Text>
                  <Text style={styles.buttonArrow}>›</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.privateRow}>
              <View style={styles.privateLine} />
              <Text style={styles.privateText}>Ambiente privado +18</Text>
              <View style={styles.privateLine} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020202" },
  safe: { flex: 1 },
  background: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    overflow: "hidden", backgroundColor: "#020202",
  },
  glowTop: {
    position: "absolute", width: 360, height: 360, borderRadius: 180,
    backgroundColor: "rgba(126,0,14,0.13)", right: -180, top: -90,
  },
  glowBottom: {
    position: "absolute", width: 420, height: 420, borderRadius: 210,
    backgroundColor: "rgba(132,0,16,0.12)", left: -230, bottom: 40,
  },
  arcTop: {
    position: "absolute", width: 520, height: 520, borderRadius: 260,
    borderWidth: 1, borderColor: "rgba(226,174,69,0.48)",
    right: -360, top: -310, transform: [{ rotate: "-16deg" }],
  },
  arcBottom: {
    position: "absolute", width: 640, height: 640, borderRadius: 320,
    borderWidth: 1, borderColor: "rgba(223,169,58,0.38)",
    left: -470, bottom: -430, transform: [{ rotate: "10deg" }],
  },
  content: {
    flexGrow: 1, minHeight: 900, paddingHorizontal: 44,
    paddingTop: 50, paddingBottom: 34,
  },
  back: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    borderColor: "rgba(217,179,93,0.62)", alignItems: "center",
    justifyContent: "center", backgroundColor: "rgba(4,4,4,0.72)",
  },
  backText: { color: "#EFCB78", fontSize: 32, lineHeight: 34, marginTop: -2 },
  eyebrow: {
    color: "#F2EEE9", fontSize: 12, lineHeight: 16, fontWeight: "500",
    letterSpacing: 4.2, marginTop: 72,
  },
  line: { width: 150, height: 1, backgroundColor: "#B98B39", opacity: 0.72, marginTop: 14 },
  title: {
    color: "#FFFDFC", fontFamily: SERIF, fontSize: 48, lineHeight: 51,
    fontWeight: "700", letterSpacing: -1.5, marginTop: 30,
  },
  titleGold: { color: "#E7D28A", fontStyle: "italic" },
  form: { marginTop: 86 },
  heading: {
    color: "#FFFDFC", fontFamily: SERIF, fontSize: 29, lineHeight: 35,
    fontWeight: "700",
  },
  description: { color: "#D4D0CD", fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 29 },
  label: {
    color: "#F1D17F", fontFamily: SERIF, fontSize: 17, lineHeight: 21,
    fontWeight: "700", marginBottom: 8,
  },
  inputShell: {
    height: 74, borderRadius: 15, borderWidth: 1, borderColor: "#D9B35D",
    backgroundColor: "rgba(4,4,4,0.88)", flexDirection: "row",
    alignItems: "center", paddingHorizontal: 20,
  },
  mail: { color: "#D9BE73", fontSize: 19, width: 24 },
  input: {
    flex: 1, height: "100%", color: "#F3F1EF", fontSize: 15,
    paddingVertical: 0, paddingHorizontal: 16,
  },
  button: {
    height: 72, borderRadius: 36, marginTop: 42, backgroundColor: "#9E061B",
    borderWidth: 1.1, borderColor: "#F4D16E", alignItems: "center",
    justifyContent: "center", shadowColor: "#E20D35", shadowOpacity: 0.42,
    shadowRadius: 18, elevation: 8,
  },
  buttonText: { color: "#FFF9F5", fontFamily: SERIF, fontSize: 20, fontWeight: "500" },
  buttonArrow: {
    position: "absolute", right: 28, top: 17, color: "#F0C960",
    fontSize: 32, lineHeight: 34, fontWeight: "200",
  },
  success: { marginTop: 110, alignItems: "center" },
  successCircle: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 1,
    borderColor: "#F4D16E", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(126,0,14,0.22)",
  },
  successCheck: { color: "#F1D17F", fontSize: 35 },
  successTitle: {
    color: "#FFFDFC", fontFamily: SERIF, fontSize: 30, fontWeight: "700", marginTop: 24,
  },
  successText: {
    color: "#CFC6C0", textAlign: "center", fontSize: 14, lineHeight: 21,
    marginTop: 10, maxWidth: 390,
  },
  privateRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 14, marginTop: 54,
  },
  privateLine: { width: 57, height: 1, backgroundColor: "#C0A057", opacity: 0.72 },
  privateText: { color: "#8E7963", fontSize: 11, lineHeight: 15, fontWeight: "500" },
});
