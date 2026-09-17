import { router } from "expo-router";
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
import { DP, dpNumber } from "../constants/dp-theme";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";

export default function Perfil() {
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
      setEditando(false);
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
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.brand}>DESEJO PROIBIDO</Text>
        <Text style={styles.pageTitle}>Meu Perfil</Text>

        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(nome || "D").charAt(0).toUpperCase()}</Text></View>
          </View>
          <Text style={styles.name}>{nome || "Seu perfil"}</Text>
          <View style={styles.nameMetaRow}>
            <Text style={styles.meta}>{cidade || "Cidade"}{estado ? ` • ${estado}` : ""}</Text>
            {isPremium ? <View style={styles.verified}><Text style={styles.verifiedText}>◆</Text></View> : null}
          </View>

          <Pressable style={styles.creditBar} onPress={() => router.push("/carteira")}>
            <Text style={styles.creditIcon}>◇</Text>
            <Text style={styles.creditValue}>{dpNumber(saldoCreditos)} créditos</Text>
            <Text style={styles.creditBuy}>Comprar</Text>
            <Text style={styles.creditArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.editButton} onPress={() => setEditando((old) => !old)}>
            <Text style={styles.editIcon}>✎</Text>
            <Text style={styles.editText}>{editando ? "Fechar edição" : "Editar perfil"}</Text>
          </Pressable>
        </View>

        {editando ? (
          <View style={styles.editCard}>
            <Text style={styles.cardTitle}>Informações pessoais</Text>
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
            <Pressable style={styles.saveButton} onPress={salvarPerfil}><Text style={styles.saveText}>Salvar alterações</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.premiumCard}>
          <View style={styles.premiumGlow} />
          <View style={styles.premiumTopRow}>
            <Text style={styles.crown}>♛</Text>
            <Text style={styles.premiumTitle}>Premium</Text>
          </View>
          <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>{isPremium ? "Ativo" : "Disponível"}</Text></View>
          <Text style={styles.premiumText}>{isPremium ? "Aproveite todos os benefícios exclusivos do Premium." : "Desbloqueie recursos e tenha mais destaque na plataforma."}</Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}><Text style={styles.settingIconText}>⌁</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Modo invisível</Text>
            <Text style={styles.settingText}>Navegue sem aparecer</Text>
          </View>
          <Switch
            value={isInvisivel}
            onValueChange={alterarInvisivel}
            trackColor={{ false: "#242424", true: DP.colors.primaryDark }}
            thumbColor={isInvisivel ? DP.colors.primary : "#F7F7F7"}
          />
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}><Text style={styles.settingIconText}>↗</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Boost</Text>
            <Text style={styles.settingText}>Destaque seu perfil no feed</Text>
          </View>
          <Pressable style={styles.boostButton} onPress={ativarBoost}><Text style={styles.boostText}>Ativar Boost</Text></Pressable>
        </View>

        <Pressable style={styles.photosButton} onPress={() => router.push("/fotos")}>
          <Text style={styles.photosIcon}>▧</Text>
          <Text style={styles.photosText}>Gerenciar minhas fotos</Text>
          <Text style={styles.photosArrow}>›</Text>
        </Pressable>
      </ScrollView>
      <DPBottomNav />
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, maxLength }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; maxLength?: number }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={DP.colors.dim} maxLength={maxLength} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  page: { flex: 1, backgroundColor: "#000" },
  content: { padding: 16, paddingTop: 18, paddingBottom: 108 },
  brand: { color: DP.colors.gold, fontSize: 14, fontWeight: "900", letterSpacing: 1.1, textAlign: "center" },
  pageTitle: { color: "#fff", fontSize: 24, fontWeight: "900", textAlign: "center", marginTop: 18 },
  hero: { alignItems: "center", marginTop: 15 },
  avatarRing: { width: 118, height: 118, borderRadius: 59, borderWidth: 4, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center", backgroundColor: "#060606", ...DP.shadow.gold },
  avatar: { width: 101, height: 101, borderRadius: 51, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#555", fontSize: 38, fontWeight: "900" },
  name: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 12 },
  nameMetaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 },
  meta: { color: DP.colors.muted, fontSize: 11 },
  verified: { width: 18, height: 18, borderRadius: 9, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center" },
  verifiedText: { color: "#fff", fontSize: 7 },
  creditBar: { width: "100%", height: 48, borderRadius: 12, borderWidth: 1, borderColor: DP.colors.borderGold, backgroundColor: "#080808", flexDirection: "row", alignItems: "center", paddingHorizontal: 13, marginTop: 14 },
  creditIcon: { color: DP.colors.gold, fontSize: 22, marginRight: 9 },
  creditValue: { color: "#fff", fontSize: 12, fontWeight: "900", flex: 1 },
  creditBuy: { color: DP.colors.gold, fontSize: 10, fontWeight: "900" },
  creditArrow: { color: DP.colors.gold, fontSize: 23, marginLeft: 6 },
  editButton: { width: "100%", height: 44, borderRadius: 11, borderWidth: 1, borderColor: DP.colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  editIcon: { color: DP.colors.primary, fontSize: 16 },
  editText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  editCard: { marginTop: 16, borderRadius: 20, backgroundColor: "#090909", borderWidth: 1, borderColor: DP.colors.borderGold, padding: 15 },
  cardTitle: { color: "#fff", fontSize: 17, fontWeight: "900", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  field: { marginBottom: 10 },
  label: { color: DP.colors.textSoft, fontSize: 10, fontWeight: "900", marginBottom: 6 },
  input: { minHeight: 48, backgroundColor: "#111", color: "#fff", borderRadius: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: DP.colors.border, fontSize: 13 },
  bio: { minHeight: 100, paddingTop: 13, textAlignVertical: "top" },
  saveButton: { height: 48, borderRadius: 12, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", marginTop: 6 },
  saveText: { color: "#fff", fontWeight: "900" },
  premiumCard: { minHeight: 142, overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: DP.colors.gold, backgroundColor: "#0B0904", padding: 16, marginTop: 20, ...DP.shadow.gold },
  premiumGlow: { position: "absolute", width: 210, height: 210, borderRadius: 105, right: -55, top: -65, backgroundColor: "rgba(233,185,73,0.12)" },
  premiumTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  crown: { color: DP.colors.goldBright, fontSize: 28 },
  premiumTitle: { color: "#fff", fontSize: 21, fontWeight: "900" },
  premiumBadge: { alignSelf: "flex-start", backgroundColor: DP.colors.gold, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4, marginTop: 7 },
  premiumBadgeText: { color: "#171000", fontSize: 9, fontWeight: "900" },
  premiumText: { color: DP.colors.textSoft, fontSize: 10, lineHeight: 16, marginTop: 9, maxWidth: 220 },
  settingCard: { minHeight: 76, borderRadius: 16, backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: DP.colors.border, padding: 12, marginTop: 12, flexDirection: "row", alignItems: "center" },
  settingIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#111", borderWidth: 1, borderColor: DP.colors.borderStrong, alignItems: "center", justifyContent: "center", marginRight: 11 },
  settingIconText: { color: DP.colors.primary, fontSize: 22 },
  settingTitle: { color: "#fff", fontSize: 14, fontWeight: "900" },
  settingText: { color: DP.colors.muted, fontSize: 10, marginTop: 3 },
  boostButton: { minWidth: 94, height: 36, borderRadius: 10, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  boostText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  photosButton: { minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: DP.colors.borderGold, backgroundColor: "#080808", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginTop: 13 },
  photosIcon: { color: DP.colors.gold, fontSize: 22, marginRight: 10 },
  photosText: { color: "#fff", fontSize: 12, fontWeight: "800", flex: 1 },
  photosArrow: { color: DP.colors.gold, fontSize: 24 },
});
