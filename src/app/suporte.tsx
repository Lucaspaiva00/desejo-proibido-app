import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppHeader, LuxuryScreen } from "../components/ui/dp-luxury";
import { api } from "../services/api";
import { authHeaders } from "../services/http";

type Chamado = { id: string; assunto: string; mensagem: string; resposta: string | null };

export default function Suporte() {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamento = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get<Chamado[]>("/suporte", { headers: await authHeaders() });
      setChamados(data);
    } catch {
      setAviso("Não foi possível carregar seus chamados.");
    }
  }, []);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  async function enviar() {
    if (envioEmAndamento.current || !assunto.trim() || !mensagem.trim()) return;
    envioEmAndamento.current = true;
    setEnviando(true);
    setAviso("");
    try {
      await api.post("/suporte", { assunto, mensagem }, { headers: await authHeaders() });
      setAssunto("");
      setMensagem("");
      setAviso("Chamado enviado. A resposta aparecerá aqui.");
      await carregar();
    } catch {
      setAviso("Não foi possível enviar o chamado. Tente novamente.");
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  const envioBloqueado = enviando || !assunto.trim() || !mensagem.trim();

  return (
    <LuxuryScreen>
      <AppHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>Suporte</Text>
        <TextInput accessibilityLabel="Assunto" placeholder="Assunto" placeholderTextColor="#A49A92"
          style={styles.field} maxLength={120} value={assunto} onChangeText={setAssunto} editable={!enviando} />
        <TextInput accessibilityLabel="Mensagem" placeholder="Como podemos ajudar?" placeholderTextColor="#A49A92"
          style={[styles.field, styles.message]} maxLength={2000} multiline value={mensagem}
          onChangeText={setMensagem} editable={!enviando} />
        <Pressable accessibilityRole="button" onPress={enviar}
          disabled={envioBloqueado}
          style={[styles.button, envioBloqueado && styles.disabled]}>
          <Text style={styles.buttonText}>{enviando ? "Enviando…" : "Enviar chamado"}</Text>
        </Pressable>
        {!!aviso && <Text accessibilityLiveRegion="polite" style={styles.copy}>{aviso}</Text>}
        <Text style={styles.title}>Meus chamados</Text>
        <Pressable accessibilityRole="button" onPress={carregar}>
          <Text style={styles.copy}>Atualizar chamados</Text>
        </Pressable>
        {chamados.map((chamado) => (
          <View key={chamado.id} style={styles.field}>
            <Text style={styles.title}>{chamado.assunto}</Text>
            <Text style={styles.copy}>{chamado.mensagem}</Text>
            <Text style={styles.copy}>{chamado.resposta ? `Suporte: ${chamado.resposta}` : "Aguardando resposta"}</Text>
          </View>
        ))}
      </ScrollView>
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { color: "#F2C867", fontSize: 20, fontWeight: "700" },
  field: { color: "#FFF", borderWidth: 1, borderColor: "#554019", borderRadius: 12, padding: 12 },
  message: { minHeight: 112, textAlignVertical: "top" },
  button: { backgroundColor: "#B30C29", borderRadius: 12, padding: 12, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  copy: { color: "#E5DDD6", marginTop: 4 },
});
