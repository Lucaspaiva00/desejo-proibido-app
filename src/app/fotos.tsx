import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { DP } from "../constants/dp-theme";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";

export default function Fotos() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fotos, setFotos] = useState<any[]>([]);

  useEffect(() => {
    carregarFotos();
  }, []);

  async function authHeader() {
    const token = await obterToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function carregarFotos() {
    try {
      const headers = await authHeader();
      const { data } = await api.get("/fotos/minhas", { headers });
      setFotos(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFoto() {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert("Permissão necessária", "Permita acesso à galeria");
        return;
      }

      const imagem = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        base64: true,
      });

      if (imagem.canceled) return;
      setUploading(true);
      const asset = imagem.assets[0];

      const uploadCloudinary = await fetch("https://api.cloudinary.com/v1_1/dfdinbti3/image/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: `data:${asset.mimeType};base64,${asset.base64}`, upload_preset: "desejoproibido" }),
      });

      const cloudData = await uploadCloudinary.json();
      if (cloudData.error) throw new Error(cloudData.error.message);

      const headers = await authHeader();
      const { data } = await api.post("/fotos/upload", { url: cloudData.secure_url }, { headers });
      if (!data.principal) await api.patch(`/fotos/${data.id}/principal`, {}, { headers });
      await carregarFotos();
      Alert.alert("Foto adicionada", "Sua galeria foi atualizada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function definirPrincipal(fotoId: string) {
    try {
      const headers = await authHeader();
      await api.patch(`/fotos/${fotoId}/principal`, {}, { headers });
      carregarFotos();
    } catch {
      Alert.alert("Erro", "Erro ao definir destaque");
    }
  }

  async function removerFoto(fotoId: string) {
    Alert.alert("Remover foto", "Deseja remover esta foto?", [
      { text: "Cancelar" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const headers = await authHeader();
            await api.delete(`/fotos/${fotoId}`, { headers });
            carregarFotos();
          } catch {
            Alert.alert("Erro", "Erro ao remover");
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={DP.colors.gold} /></View>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>DESEJO PROIBIDO</Text>
          <View style={styles.counter}><Text style={styles.counterText}>{fotos.length} fotos</Text></View>
        </View>
        <Text style={styles.title}>Galeria Premium</Text>
        <Text style={styles.subtitle}>Sua foto principal aparece primeiro no seu perfil.</Text>

        <FlatList
          data={[{ id: "__add__", add: true }, ...fotos]}
          keyExtractor={(item: any) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }: any) => {
            if (item.add) {
              return (
                <Pressable style={styles.addCard} onPress={uploadFoto} disabled={uploading}>
                  <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
                  <Text style={styles.addTitle}>{uploading ? "Enviando..." : "Adicionar foto"}</Text>
                  <Text style={styles.addSub}>JPG ou PNG</Text>
                </Pressable>
              );
            }

            return (
              <View style={[styles.card, item.principal && styles.cardPrincipal]}>
                <Image source={{ uri: item.url }} style={styles.image} />
                <Pressable style={styles.moreButton} onPress={() => removerFoto(item.id)}>
                  <Text style={styles.moreText}>•••</Text>
                </Pressable>
                {item.principal ? (
                  <View style={styles.principalBadge}><Text style={styles.principalText}>Principal</Text></View>
                ) : (
                  <Pressable style={styles.makePrincipal} onPress={() => definirPrincipal(item.id)}>
                    <Text style={styles.makePrincipalText}>Definir principal</Text>
                  </Pressable>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}><Text style={styles.infoIconText}>♡</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Fotos nítidas recebem mais curtidas</Text>
                <Text style={styles.infoText}>Escolha imagens claras e atuais para valorizar seu perfil.</Text>
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
  content: { flex: 1, paddingHorizontal: 15, paddingTop: 18 },
  loading: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: DP.colors.gold, fontWeight: "900", fontSize: 14, letterSpacing: 1.1 },
  counter: { borderRadius: 999, borderWidth: 1, borderColor: DP.colors.borderGold, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: DP.colors.goldSoft },
  counterText: { color: DP.colors.gold, fontSize: 10, fontWeight: "800" },
  title: { color: "#fff", fontSize: 29, fontWeight: "900", marginTop: 18, letterSpacing: -0.6 },
  subtitle: { color: DP.colors.muted, fontSize: 12, marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 115 },
  columns: { gap: 10 },
  card: { flex: 1, minHeight: 214, borderRadius: 18, overflow: "hidden", backgroundColor: "#101010", marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", position: "relative" },
  cardPrincipal: { borderColor: DP.colors.gold, ...DP.shadow.gold },
  image: { width: "100%", height: 214, resizeMode: "cover" },
  moreButton: { position: "absolute", right: 8, top: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  moreText: { color: "#fff", fontWeight: "900", fontSize: 12, marginTop: -4 },
  principalBadge: { position: "absolute", left: 9, bottom: 9, borderRadius: 999, backgroundColor: DP.colors.gold, paddingHorizontal: 9, paddingVertical: 5 },
  principalText: { color: "#171000", fontSize: 9, fontWeight: "900" },
  makePrincipal: { position: "absolute", left: 8, right: 8, bottom: 8, height: 31, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.72)", borderWidth: 1, borderColor: DP.colors.borderGold, alignItems: "center", justifyContent: "center" },
  makePrincipalText: { color: DP.colors.gold, fontSize: 9, fontWeight: "800" },
  addCard: { flex: 1, minHeight: 214, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: DP.colors.gold, backgroundColor: "#080808", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  addCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: DP.colors.gold, alignItems: "center", justifyContent: "center" },
  addPlus: { color: DP.colors.gold, fontSize: 32, fontWeight: "300", lineHeight: 34 },
  addTitle: { color: DP.colors.gold, fontSize: 12, fontWeight: "800", marginTop: 10 },
  addSub: { color: DP.colors.dim, fontSize: 9, marginTop: 3 },
  infoCard: { minHeight: 84, borderRadius: 17, backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: DP.colors.border, flexDirection: "row", alignItems: "center", padding: 13, marginTop: 5 },
  infoIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: DP.colors.primarySoft, borderWidth: 1, borderColor: DP.colors.borderStrong, alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoIconText: { color: DP.colors.gold, fontSize: 25 },
  infoTitle: { color: "#fff", fontSize: 13, fontWeight: "900" },
  infoText: { color: DP.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
});
