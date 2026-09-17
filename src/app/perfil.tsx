import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { Kicker, Pill, PrimaryButton, SecondaryButton } from "../components/ui/dp-ui";
import { DP, dpNumber } from "../constants/dp-theme";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [genero, setGenero] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [saldoCreditos, setSaldoCreditos] = useState(0);
  const [isInvisivel, setIsInvisivel] = useState(false);

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

      const perfil = perfilRes.data;
      const premium = premiumRes.data;
      const usuario = usuarioRes.data;

      setNome(perfil?.nome || "");
      setBio(perfil?.bio || "");
      setCidade(perfil?.cidade || "");
      setEstado(perfil?.estado || "");
      setGenero(perfil?.genero || "");
      if (perfil?.nascimento) setNascimento(String(perfil.nascimento).substring(0, 10));
      setSaldoCreditos(premium?.saldoCreditos || 0);
      setIsPremium(premium?.isPremium || false);
      setIsInvisivel(usuario?.isInvisivel || false);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar o perfil");
    } finally {
      setLoading(false);
    }
  }

  async function salvarPerfil() {
    try {
      const headers = await authHeader();
      await api.put("/perfil", { nome, bio, cidade, estado, genero, nascimento }, { headers });
      Alert.alert("Perfil atualizado", "Suas informações foram salvas com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao salvar perfil");
    }
  }

  async function ativarBoost() {
    try {
      const headers = await authHeader();
      await api.put("/usuarios/boost", {}, { headers });
      Alert.alert("Boost ativado", "Seu perfil recebeu mais destaque.");
      carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao ativar boost");
    }
  }

  async function alterarInvisivel(valor: boolean) {
    try {
      const headers = await authHeader();
      await api.put("/usuarios/invisivel", { ativo: valor }, { headers });
      setIsInvisivel(valor);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.erro || "Erro ao alterar invisível");
    }
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.primary} /></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Kicker>MEU PERFIL</Kicker>
        <View style={styles.profileHero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(nome || "D").slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{nome || "Seu perfil"}</Text>
            <Text style={styles.meta}>{cidade || "Cidade"}{estado ? ` • ${estado}` : ""}</Text>
            <View style={styles.pills}>
              <Pill tone={isPremium ? "gold" : "neutral"}>{isPremium ? "Premium" : "Free"}</Pill>
              <Pill tone="primary">{dpNumber(saldoCreditos)} créditos</Pill>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Informações pessoais</Text>
        <View style={styles.card}>
          <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Field label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" /></View>
            <View style={{ width: 92 }}><Field label="Estado" value={estado} onChangeText={setEstado} placeholder="SP" maxLength={2} /></View>
          </View>
          <Field label="Gênero" value={genero} onChangeText={setGenero} placeholder="Gênero" />
          <Field label="Nascimento" value={nascimento} onChangeText={setNascimento} placeholder="2000-01-01" />
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bio]}
            multiline
            value={bio}
            onChangeText={setBio}
            placeholder="Conte um pouco sobre você..."
            placeholderTextColor={DP.colors.dim}
          />
          <PrimaryButton title="Salvar perfil" subtitle="Atualizar minhas informações" onPress={salvarPerfil} />
        </View>

        <Text style={styles.sectionTitle}>Privacidade e destaque</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 15 }}>
              <Text style={styles.settingTitle}>Modo invisível</Text>
              <Text style={styles.settingText}>Controle sua visibilidade sem sair da plataforma.</Text>
            </View>
            <Switch
              value={isInvisivel}
              onValueChange={alterarInvisivel}
              trackColor={{ false: DP.colors.surface3, true: DP.colors.primaryDark }}
              thumbColor={isInvisivel ? DP.colors.primary : "#CFC5CA"}
            />
          </View>
          <View style={styles.divider} />
          <Text style={styles.settingTitle}>Mais destaque no feed</Text>
          <Text style={styles.settingText}>Ative o boost para ganhar mais visibilidade entre os perfis.</Text>
          <Pressable onPress={ativarBoost} style={({ pressed }) => [styles.boostButton, pressed && styles.pressed]}>
            <Text style={styles.boostText}>Ativar Boost</Text>
            <Text style={styles.boostArrow}>›</Text>
          </Pressable>
        </View>

        <SecondaryButton title="Gerenciar minhas fotos" onPress={() => {}} />
      </ScrollView>
      <DPBottomNav />
    </View>
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
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={DP.colors.dim}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: DP.colors.background, justifyContent: "center", alignItems: "center" },
  page: { flex: 1, backgroundColor: DP.colors.background },
  content: { padding: 18, paddingTop: 22, paddingBottom: 112 },
  profileHero: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 14, marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#2B1018",
    borderWidth: 1,
    borderColor: DP.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    ...DP.shadow.primary,
  },
  avatarText: { color: DP.colors.text, fontSize: 30, fontWeight: "900" },
  name: { color: DP.colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.7 },
  meta: { color: DP.colors.muted, fontSize: 12, marginTop: 3 },
  pills: { flexDirection: "row", gap: 7, marginTop: 9, flexWrap: "wrap" },
  sectionTitle: { color: DP.colors.text, fontSize: 19, fontWeight: "900", marginBottom: 11, marginTop: 4 },
  card: {
    backgroundColor: DP.colors.surface,
    borderRadius: DP.radius.xl,
    padding: 17,
    borderWidth: 1,
    borderColor: DP.colors.border,
    marginBottom: 22,
    ...DP.shadow.card,
  },
  row: { flexDirection: "row", gap: 10 },
  field: { marginBottom: 11 },
  label: { color: DP.colors.textSoft, fontSize: 11, fontWeight: "900", marginBottom: 7 },
  input: {
    minHeight: 52,
    backgroundColor: DP.colors.surface2,
    color: DP.colors.text,
    borderRadius: DP.radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: DP.colors.border,
    fontSize: 14,
  },
  bio: { minHeight: 112, paddingTop: 14, textAlignVertical: "top", marginBottom: 14 },
  switchRow: { flexDirection: "row", alignItems: "center" },
  settingTitle: { color: DP.colors.text, fontSize: 15, fontWeight: "900" },
  settingText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  divider: { height: 1, backgroundColor: DP.colors.border, marginVertical: 17 },
  boostButton: {
    marginTop: 13,
    height: 54,
    borderRadius: DP.radius.md,
    borderWidth: 1,
    borderColor: "rgba(244,196,106,0.28)",
    backgroundColor: "rgba(244,196,106,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  boostText: { color: DP.colors.gold, fontWeight: "900", fontSize: 14 },
  boostArrow: { color: DP.colors.gold, fontSize: 24 },
  pressed: { opacity: 0.8 },
});
