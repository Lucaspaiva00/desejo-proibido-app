import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP } from "../constants/dp-theme";
import { buscarBloqueados, desbloquearUsuario } from "../services/bloqueados";

export default function Bloqueados() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregar() {
    try {
      const data = await buscarBloqueados();
      setUsuarios(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function desbloquear(usuarioId: string) {
    Alert.alert("Desbloquear", "Deseja desbloquear este usuário?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desbloquear",
        onPress: async () => {
          try {
            await desbloquearUsuario(usuarioId);
            setUsuarios((old) => old.filter((u) => u.usuario.id !== usuarioId));
          } catch {
            Alert.alert("Erro", "Não foi possível desbloquear");
          }
        },
      },
    ]);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    return usuarios.filter((item) => {
      const nome = item.usuario?.perfil?.nome || "";
      const cidade = item.usuario?.perfil?.cidade || "";
      return `${nome} ${cidade}`.toLowerCase().includes(busca.toLowerCase());
    });
  }, [usuarios, busca]);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.brand}>DESEJO PROIBIDO</Text>
        <Text style={styles.title}>Usuários bloqueados</Text>
        <Text style={styles.subtitle}>Gerencie quem não pode visualizar ou contatar você.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar usuário bloqueado"
            placeholderTextColor="#6B6460"
            style={styles.search}
          />
        </View>

        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const nome = item.usuario?.perfil?.nome || "Usuário";
            return (
              <View style={styles.card}>
                {item.usuario?.fotoPrincipal ? (
                  <Image source={{ uri: item.usuario.fotoPrincipal }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]}>
                    <Text style={styles.photoFallbackText}>{nome.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{nome}</Text>
                  <Text style={styles.location}>
                    {item.usuario?.perfil?.cidade || "Localização não informada"}
                    {item.usuario?.perfil?.estado ? ` • ${item.usuario.perfil.estado}` : ""}
                  </Text>
                  <Pressable style={styles.unlockButton} onPress={() => desbloquear(item.usuario.id)}>
                    <Text style={styles.unlockText}>Desbloquear</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.shield}><Text style={styles.shieldText}>✓</Text></View>
              <Text style={styles.emptyTitle}>Nenhum usuário bloqueado</Text>
              <Text style={styles.emptyText}>Quando você bloquear alguém, essa pessoa aparecerá aqui.</Text>
              <View style={styles.securityRow}>
                <View style={styles.securityDot} />
                <Text style={styles.securityText}>Sua segurança está em primeiro lugar.</Text>
              </View>
            </View>
          }
        />
      </View>
      <DPBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  brand: { color: DP.colors.gold, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 17, letterSpacing: -0.6 },
  subtitle: { color: DP.colors.muted, fontSize: 12, marginTop: 4 },
  searchWrap: { height: 50, borderRadius: 15, backgroundColor: "#0B0B0B", borderWidth: 1, borderColor: DP.colors.borderGold, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 18, marginBottom: 18 },
  searchIcon: { color: DP.colors.primary, fontSize: 22, marginRight: 8 },
  search: { flex: 1, color: "#fff", fontSize: 13 },
  list: { paddingBottom: 105 },
  card: { minHeight: 110, borderRadius: 18, borderWidth: 1, borderColor: "rgba(233,185,73,0.22)", backgroundColor: "#090909", padding: 11, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  photo: { width: 82, height: 82, borderRadius: 18, marginRight: 12, borderWidth: 1, borderColor: DP.colors.borderGold },
  photoFallback: { backgroundColor: "#17120A", alignItems: "center", justifyContent: "center" },
  photoFallbackText: { color: DP.colors.gold, fontSize: 28, fontWeight: "900" },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 17, fontWeight: "900" },
  location: { color: DP.colors.muted, fontSize: 11, marginTop: 4 },
  unlockButton: { alignSelf: "flex-start", minWidth: 112, height: 34, borderRadius: 10, borderWidth: 1, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center", marginTop: 10, paddingHorizontal: 12 },
  unlockText: { color: DP.colors.gold, fontSize: 11, fontWeight: "900" },
  emptyCard: { marginTop: 4, minHeight: 360, borderRadius: 24, borderWidth: 1, borderColor: DP.colors.borderGold, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", padding: 28, ...DP.shadow.card },
  shield: { width: 96, height: 110, borderRadius: 34, borderWidth: 2, borderColor: DP.colors.gold, backgroundColor: "#12100A", alignItems: "center", justifyContent: "center", ...DP.shadow.gold },
  shieldText: { color: DP.colors.goldBright, fontSize: 42, fontWeight: "300" },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 24, textAlign: "center" },
  emptyText: { color: DP.colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8, maxWidth: 260 },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 28 },
  securityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DP.colors.gold },
  securityText: { color: "#7D746F", fontSize: 10 },
});
