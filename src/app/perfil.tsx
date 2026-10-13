import { router } from "expo-router";
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
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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
      setFotoPrincipal(usuario?.fotoPrincipal || perfil?.fotoPrincipal || "");
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
    return (
      <LuxuryScreen>
        <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Eyebrow>MEU PERFIL</Eyebrow>

        <View style={styles.hero}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarRing}>
              {fotoPrincipal ? (
                <Image source={{ uri: fotoPrincipal }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(nome || "D").charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.name}>{nome || "Seu perfil"}</Text>
          <View style={styles.nameMetaRow}>
            <Text style={styles.meta}>{cidade || "Cidade"}{estado ? ` • ${estado}` : ""}</Text>
            {isPremium ? <View style={styles.verified}><Text style={styles.verifiedText}>●</Text></View> : null}
          </View>

          <Pressable style={({ pressed }) => [styles.creditBar, pressed && styles.pressed]} onPress={() => router.push("/carteira")}>
            <Text style={styles.creditIcon}>◇</Text>
            <Text style={styles.creditValue}>{dpNumber(saldoCreditos)} créditos</Text>
            <Text style={styles.creditBuy}>Comprar</Text>
            <Text style={styles.creditArrow}>›</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.pressed]} onPress={() => setEditando((old) => !old)}>
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
          <View style={styles.premiumTitleRow}>
            <Text style={styles.crown}>♛</Text>
            <Text style={styles.premiumTitle}>Premium</Text>
          </View>
          <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>{isPremium ? "Ativo" : "Disponível"}</Text></View>
          <Text style={styles.premiumText}>
            {isPremium ? "Aproveite todos os benefícios exclusivos do Premium." : "Desbloqueie recursos e tenha mais destaque na plataforma."}
          </Text>
        </View>

        <View style={styles.settingsBox}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Text style={styles.settingIconText}>⊘</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Modo invisível</Text>
              <Text style={styles.settingText}>Navegue sem aparecer</Text>
            </View>
            <Switch
              value={isInvisivel}
              onValueChange={alterarInvisivel}
              trackColor={{ false: "#262626", true: DP.colors.primaryDark }}
              thumbColor={isInvisivel ? DP.colors.primary : "#EDEDED"}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Text style={styles.settingIconText}>↗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Boost</Text>
              <Text style={styles.settingText}>Destaque seu perfil no feed</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.boostButton, pressed && styles.pressed]} onPress={ativarBoost}>
              <Text style={styles.boostText}>Ativar Boost</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.photosButton, pressed && styles.pressed]} onPress={() => router.push("/fotos")}>
          <Text style={styles.photosIcon}>▧</Text>
          <Text style={styles.photosText}>Gerenciar minhas fotos</Text>
          <Text style={styles.photosArrow}>›</Text>
        </Pressable>
      </ScrollView>
      <DPBottomNav />
    </LuxuryScreen>
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
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  hero: { alignItems: "center", marginTop: 22 },
  avatarGlow: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 2,
    borderColor: DP.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "#F2CF71",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#070707",
  },
  avatar: { width: "100%", height: "100%", backgroundColor: "#181818", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarText: { color: "#8A8A8A", fontFamily: DP_SERIF, fontSize: 50, fontWeight: "800" },
  name: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 33, fontWeight: "700", marginTop: 15 },
  nameMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  meta: { color: "#9C9591", fontSize: 13 },
  verified: { width: 20, height: 20, borderRadius: 10, backgroundColor: DP.colors.primary, alignItems: "center", justifyContent: "center" },
  verifiedText: { color: "#fff", fontSize: 8 },
  creditBar: {
    width: "100%",
    height: 62,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.7)",
    backgroundColor: "rgba(8,7,5,0.92)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 22,
  },
  creditIcon: { color: "#F2CD70", fontSize: 25, marginRight: 13 },
  creditValue: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 17, fontWeight: "700", flex: 1 },
  creditBuy: { color: "#F2CD70", fontFamily: DP_SERIF, fontSize: 14, fontWeight: "700" },
  creditArrow: { color: "#F2CD70", fontSize: 26, marginLeft: 6 },
  editButton: {
    width: "100%",
    height: 60,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FF3150",
    backgroundColor: "rgba(128,0,18,0.52)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
    shadowColor: DP.colors.primary,
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 7,
  },
  editIcon: { color: DP.colors.primary, fontSize: 20 },
  editText: { color: "#FFF", fontFamily: DP_SERIF, fontWeight: "700", fontSize: 17 },
  editCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "rgba(8,7,6,0.96)",
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.58)",
    padding: 16,
  },
  cardTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 20, fontWeight: "700", marginBottom: 14 },
  row: { flexDirection: "row", gap: 10 },
  field: { marginBottom: 11 },
  label: { color: "#EACD82", fontSize: 11, fontWeight: "800", marginBottom: 6 },
  input: {
    minHeight: 50,
    backgroundColor: "#0F0F0F",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.24)",
    fontSize: 13,
  },
  bio: { minHeight: 90, textAlignVertical: "top", paddingTop: 12 },
  saveButton: { height: 50, borderRadius: 13, backgroundColor: DP.colors.primaryDark, borderWidth: 1, borderColor: DP.colors.primary, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveText: { color: "#FFF", fontWeight: "900" },
  premiumCard: {
    minHeight: 176,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#F2C85E",
    backgroundColor: "rgba(17,11,4,0.95)",
    padding: 20,
    overflow: "hidden",
    shadowColor: "#E9B949",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  premiumGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(233,185,73,0.1)",
    right: -80,
    top: -95,
  },
  premiumTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  crown: { color: "#F4CD68", fontSize: 30 },
  premiumTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 30, fontWeight: "700" },
  premiumBadge: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#E9B949", paddingHorizontal: 13, paddingVertical: 6, marginTop: 10 },
  premiumBadgeText: { color: "#221500", fontSize: 11, fontWeight: "900" },
  premiumText: { color: "#C9C0B8", fontFamily: DP_SERIF, fontSize: 15, lineHeight: 21, marginTop: 12, maxWidth: 320 },
  settingsBox: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(7,7,7,0.92)",
    overflow: "hidden",
  },
  settingRow: { minHeight: 92, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 12 },
  settingDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 18 },
  settingIcon: { width: 34, alignItems: "center" },
  settingIconText: { color: DP.colors.primary, fontSize: 25 },
  settingTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 18, fontWeight: "700" },
  settingText: { color: "#8F8986", fontSize: 12, marginTop: 2 },
  boostButton: { minWidth: 112, height: 45, borderRadius: 12, backgroundColor: "#A9071C", borderWidth: 1, borderColor: "#FF3150", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  boostText: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 13, fontWeight: "700" },
  photosButton: {
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(233,185,73,0.42)",
    backgroundColor: "rgba(8,7,6,0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  photosIcon: { color: "#F2CD70", fontSize: 22, marginRight: 10 },
  photosText: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 15, fontWeight: "700", flex: 1 },
  photosArrow: { color: "#F2CD70", fontSize: 27 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
