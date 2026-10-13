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
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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
    return (
      <LuxuryScreen>
        <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen>
      <LuxuryHeader />
      <View style={styles.content}>
        <Eyebrow>PRIVACIDADE</Eyebrow>
        <Text style={styles.title}>Bloqueados</Text>
        <Text style={styles.subtitle}>Gerencie quem não pode visualizar ou contatar você.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar usuário bloqueado"
            placeholderTextColor="#746D69"
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
                  <Pressable style={({ pressed }) => [styles.unlockButton, pressed && styles.pressed]} onPress={() => desbloquear(item.usuario.id)}>
                    <Text style={styles.unlockText}>Desbloquear</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.shield}>
                <Text style={styles.shieldText}>◇</Text>
                <View style={styles.shieldKey}><Text style={styles.shieldKeyText}>✓</Text></View>
              </View>
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
    </LuxuryScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 36, lineHeight: 40, fontWeight: "700", marginTop: 14 },
  subtitle: { color: "#8F8986", fontSize: 12, marginTop: 5 },
  searchWrap: { height: 56, borderRadius: 16, backgroundColor: "rgba(8,7,6,0.94)", borderWidth: 1, borderColor: "rgba(233,185,73,0.56)", flexDirection: "row", alignItems: "center", paddingHorizontal: 13, marginTop: 18, marginBottom: 18 },
  searchIcon: { color: "#F1CD70", fontSize: 22, marginRight: 8 },
  search: { flex: 1, color: "#FFF", fontSize: 13 },
  list: { paddingBottom: 110 },
  card: { minHeight: 118, borderRadius: 18, borderWidth: 1, borderColor: "rgba(233,185,73,0.3)", backgroundColor: "rgba(8,7,6,0.95)", padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  photo: { width: 88, height: 88, borderRadius: 20, marginRight: 13, borderWidth: 1, borderColor: "#EBC65D" },
  photoFallback: { backgroundColor: "#171108", alignItems: "center", justifyContent: "center" },
  photoFallbackText: { color: "#F1CD70", fontFamily: DP_SERIF, fontSize: 31, fontWeight: "800" },
  info: { flex: 1 },
  name: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 19, fontWeight: "700" },
  location: { color: "#8F8986", fontSize: 11, marginTop: 4 },
  unlockButton: { alignSelf: "flex-start", minWidth: 118, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#EBC65D", alignItems: "center", justifyContent: "center", marginTop: 11, paddingHorizontal: 12 },
  unlockText: { color: "#F1CD70", fontFamily: DP_SERIF, fontSize: 12, fontWeight: "700" },
  emptyCard: { marginTop: 16, minHeight: 390, borderRadius: 24, borderWidth: 1, borderColor: "rgba(233,185,73,0.54)", backgroundColor: "rgba(8,7,6,0.94)", alignItems: "center", justifyContent: "center", padding: 28 },
  shield: { width: 110, height: 124, borderRadius: 38, borderWidth: 2, borderColor: "#EBC65D", backgroundColor: "rgba(20,14,7,0.9)", alignItems: "center", justifyContent: "center", shadowColor: "#EBC65D", shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  shieldText: { color: "#F1CD70", fontSize: 48 },
  shieldKey: { position: "absolute", width: 34, height: 34, borderRadius: 17, backgroundColor: "#7E0011", alignItems: "center", justifyContent: "center" },
  shieldKeyText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  emptyTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 23, fontWeight: "700", marginTop: 26, textAlign: "center" },
  emptyText: { color: "#8F8986", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8, maxWidth: 270 },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 30 },
  securityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EBC65D" },
  securityText: { color: "#756F6C", fontSize: 10 },
  pressed: { opacity: 0.72 },
});
