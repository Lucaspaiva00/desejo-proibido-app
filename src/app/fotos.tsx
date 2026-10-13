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
import { DP_SERIF, Eyebrow, LuxuryHeader, LuxuryScreen } from "../components/ui/dp-luxury";
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
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Eyebrow>MEU PERFIL</Eyebrow>
            <Text style={styles.title}>Minhas fotos</Text>
          </View>
          <View style={styles.counter}><Text style={styles.counterText}>{fotos.length}/6</Text></View>
        </View>
        <Text style={styles.subtitle}>Sua foto principal aparece primeiro no perfil e no feed.</Text>

        <FlatList
          data={[{ id: "__add__", add: true }, ...fotos]}
          keyExtractor={(item: any) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            if (item.add) {
              return (
                <Pressable style={({ pressed }) => [styles.addCard, pressed && styles.pressed]} onPress={uploadFoto} disabled={uploading}>
                  <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
                  <Text style={styles.addTitle}>{uploading ? "Enviando..." : "Adicionar foto"}</Text>
                  <Text style={styles.addSub}>JPG ou PNG</Text>
                </Pressable>
              );
            }

            return (
              <View style={[styles.card, item.principal && styles.cardPrincipal]}>
                <Image source={{ uri: item.url }} style={styles.image} />
                <View style={styles.imageShade} />
                <Pressable style={styles.moreButton} onPress={() => removerFoto(item.id)}>
                  <Text style={styles.moreText}>•••</Text>
                </Pressable>
                {item.principal ? (
                  <View style={styles.principalBadge}><Text style={styles.principalText}>PRINCIPAL</Text></View>
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
                <Text style={styles.infoTitle}>Fotos nítidas valorizam seu perfil</Text>
                <Text style={styles.infoText}>Prefira imagens claras, atuais e que representem você de verdade.</Text>
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  counter: { minWidth: 48, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "rgba(233,185,73,0.6)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(233,185,73,0.07)" },
  counterText: { color: "#F1CD70", fontSize: 11, fontWeight: "800" },
  title: { color: "#FFFDFC", fontFamily: DP_SERIF, fontSize: 34, lineHeight: 38, fontWeight: "700", marginTop: 12 },
  subtitle: { color: "#8F8986", fontSize: 12, marginTop: 5, marginBottom: 18 },
  list: { paddingBottom: 112 },
  columns: { gap: 10 },
  card: { flex: 1, minHeight: 230, borderRadius: 18, overflow: "hidden", backgroundColor: "#101010", marginBottom: 10, borderWidth: 1, borderColor: "rgba(233,185,73,0.18)", position: "relative" },
  cardPrincipal: { borderColor: "#F2CD70", shadowColor: "#F2CD70", shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  image: { width: "100%", height: 230, resizeMode: "cover" },
  imageShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80, backgroundColor: "rgba(0,0,0,0.42)" },
  moreButton: { position: "absolute", right: 8, top: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.72)", borderWidth: 1, borderColor: "rgba(233,185,73,0.3)", alignItems: "center", justifyContent: "center" },
  moreText: { color: "#FFF", fontWeight: "900", fontSize: 12, marginTop: -4 },
  principalBadge: { position: "absolute", left: 9, bottom: 9, borderRadius: 999, backgroundColor: "#E7B84C", paddingHorizontal: 9, paddingVertical: 5 },
  principalText: { color: "#171000", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  makePrincipal: { position: "absolute", left: 8, right: 8, bottom: 8, height: 32, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.76)", borderWidth: 1, borderColor: "#E7B84C", alignItems: "center", justifyContent: "center" },
  makePrincipalText: { color: "#F0CC70", fontSize: 9, fontWeight: "800" },
  addCard: { flex: 1, minHeight: 230, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: "#E7B84C", backgroundColor: "rgba(8,7,6,0.94)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  addCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: "#E7B84C", alignItems: "center", justifyContent: "center" },
  addPlus: { color: "#E7B84C", fontSize: 34, fontWeight: "300", lineHeight: 36 },
  addTitle: { color: "#F0CC70", fontFamily: DP_SERIF, fontSize: 14, fontWeight: "700", marginTop: 11 },
  addSub: { color: "#6F6965", fontSize: 9, marginTop: 3 },
  infoCard: { minHeight: 92, borderRadius: 17, backgroundColor: "rgba(9,7,6,0.95)", borderWidth: 1, borderColor: "rgba(233,185,73,0.24)", flexDirection: "row", alignItems: "center", padding: 14, marginTop: 6 },
  infoIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(126,0,17,0.25)", borderWidth: 1, borderColor: "rgba(229,29,50,0.45)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoIconText: { color: "#F0CC70", fontSize: 27 },
  infoTitle: { color: "#FFF", fontFamily: DP_SERIF, fontSize: 14, fontWeight: "700" },
  infoText: { color: "#8F8986", fontSize: 10, lineHeight: 15, marginTop: 4 },
  pressed: { opacity: 0.72 },
});
