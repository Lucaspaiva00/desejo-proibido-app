import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DPBottomNav } from "../components/ui/dp-bottom-nav";
import { AppHeader, DP_SERIF, LuxuryScreen } from "../components/ui/dp-luxury";
import { DP } from "../constants/dp-theme";
import { api } from "../services/api";
import { obterToken } from "../storage/auth";

const MAX_FOTOS = 6;

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
      setFotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFoto() {
    if (fotos.length >= MAX_FOTOS) {
      Alert.alert("Limite atingido", "Você pode cadastrar até 6 fotos.");
      return;
    }

    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert("Permissão necessária", "Permita acesso à galeria.");
        return;
      }

      const imagem = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.86,
        allowsEditing: true,
        base64: true,
      });

      if (imagem.canceled) return;

      setUploading(true);
      const asset = imagem.assets[0];

      const uploadCloudinary = await fetch(
        "https://api.cloudinary.com/v1_1/dfdinbti3/image/upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: `data:${asset.mimeType};base64,${asset.base64}`,
            upload_preset: "desejoproibido",
          }),
        }
      );

      const cloudData = await uploadCloudinary.json();

      if (cloudData.error) {
        throw new Error(cloudData.error.message);
      }

      const headers = await authHeader();
      const { data } = await api.post(
        "/fotos/upload",
        { url: cloudData.secure_url },
        { headers }
      );

      if (fotos.length === 0 && !data.principal) {
        await api.patch(`/fotos/${data.id}/principal`, {}, { headers });
      }

      await carregarFotos();
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
      await carregarFotos();
    } catch {
      Alert.alert("Erro", "Erro ao definir foto principal.");
    }
  }

  async function removerFoto(fotoId: string) {
    try {
      const headers = await authHeader();
      await api.delete(`/fotos/${fotoId}`, { headers });
      await carregarFotos();
    } catch {
      Alert.alert("Erro", "Erro ao remover foto.");
    }
  }

  function abrirMenuFoto(item: any) {
    const opcoes: any[] = [{ text: "Cancelar", style: "cancel" }];

    if (!item.principal) {
      opcoes.push({
        text: "Definir como principal",
        onPress: () => definirPrincipal(item.id),
      });
    }

    opcoes.push({
      text: "Remover foto",
      style: "destructive",
      onPress: () => {
        Alert.alert(
          "Remover foto",
          "Deseja realmente remover esta foto?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Remover",
              style: "destructive",
              onPress: () => removerFoto(item.id),
            },
          ]
        );
      },
    });

    Alert.alert("Opções da foto", undefined, opcoes);
  }

  async function salvarAlteracoes() {
    await carregarFotos();
    Alert.alert("Galeria atualizada", "Suas alterações foram salvas.");
  }

  const fotosOrdenadas = useMemo(() => {
    return [...fotos].sort((a, b) => {
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      return 0;
    });
  }, [fotos]);

  const principal = fotosOrdenadas[0] || null;
  const segunda = fotosOrdenadas[1] || null;
  const terceira = fotosOrdenadas[2] || null;
  const extras = fotosOrdenadas.slice(3);

  if (loading) {
    return (
      <LuxuryScreen>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={DP.colors.gold} />
          <Text style={styles.loadingText}>Carregando sua galeria...</Text>
        </View>
      </LuxuryScreen>
    );
  }

  return (
    <LuxuryScreen style={styles.screen}>
      <AppHeader />

      <View style={styles.headerDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.counterWrap}>
          <View style={styles.counter}>
            <SymbolView
              name={{ ios: "camera", android: "photo_camera", web: "photo_camera" } as any}
              size={24}
              tintColor="#E7B84C"
              style={styles.counterIcon}
            />
            <Text style={styles.counterText}>
              {fotos.length} de {MAX_FOTOS} fotos
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Galeria Premium</Text>
        <Text style={styles.subtitle}>
          Sua foto principal aparece primeiro no seu perfil.
        </Text>

        <View style={styles.galleryGrid}>
          <View style={styles.leftColumn}>
            {principal ? (
              <PhotoCard
                item={principal}
                principal
                large
                onMenu={() => abrirMenuFoto(principal)}
              />
            ) : (
              <AddCard
                large
                uploading={uploading}
                onPress={uploadFoto}
              />
            )}

            {fotos.length < MAX_FOTOS ? (
              <AddCard
                uploading={uploading}
                onPress={uploadFoto}
              />
            ) : null}
          </View>

          <View style={styles.rightColumn}>
            {segunda ? (
              <PhotoCard
                item={segunda}
                onMenu={() => abrirMenuFoto(segunda)}
              />
            ) : (
              <EmptyPhotoCard />
            )}

            {terceira ? (
              <PhotoCard
                item={terceira}
                onMenu={() => abrirMenuFoto(terceira)}
              />
            ) : (
              <EmptyPhotoCard />
            )}
          </View>
        </View>

        {extras.length ? (
          <View style={styles.extraGrid}>
            {extras.map((item) => (
              <View key={item.id} style={styles.extraCell}>
                <PhotoCard
                  item={item}
                  onMenu={() => abrirMenuFoto(item)}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.tipCard}>
          <View style={styles.tipIconGlow}>
            <SymbolView
              name={{ ios: "heart", android: "favorite_border", web: "favorite_border" } as any}
              size={34}
              tintColor="#F1C665"
              style={styles.tipIcon}
            />
          </View>

          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Fotos nítidas</Text>
            <Text style={styles.tipText}>recebem mais curtidas</Text>
          </View>
        </View>

        <Pressable
          onPress={salvarAlteracoes}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "heart.fill", android: "favorite", web: "favorite" } as any}
            size={28}
            tintColor="#FFF7F1"
            style={styles.saveIcon}
          />
          <Text style={styles.saveText}>Salvar alterações</Text>
        </Pressable>
      </ScrollView>

      <DPBottomNav />
    </LuxuryScreen>
  );
}

function PhotoCard({
  item,
  principal = false,
  large = false,
  onMenu,
}: {
  item: any;
  principal?: boolean;
  large?: boolean;
  onMenu: () => void;
}) {
  return (
    <View
      style={[
        styles.photoCard,
        large && styles.photoCardLarge,
        principal && styles.photoCardPrincipal,
      ]}
    >
      <Image
        source={{ uri: item.url }}
        resizeMode="cover"
        style={styles.photo}
      />

      <View pointerEvents="none" style={styles.photoShade} />

      <Pressable
        onPress={onMenu}
        hitSlop={8}
        style={({ pressed }) => [
          styles.moreButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.moreText}>•••</Text>
      </Pressable>

      {principal ? (
        <View style={styles.principalBadge}>
          <SymbolView
            name={{ ios: "crown.fill", android: "workspace_premium", web: "workspace_premium" } as any}
            size={18}
            tintColor="#211400"
            style={styles.principalIcon}
          />
          <Text style={styles.principalText}>Principal</Text>
        </View>
      ) : null}
    </View>
  );
}

function AddCard({
  uploading,
  onPress,
  large = false,
}: {
  uploading: boolean;
  onPress: () => void;
  large?: boolean;
}) {
  return (
    <Pressable
      disabled={uploading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.addCard,
        large && styles.addCardLarge,
        uploading && styles.disabled,
        pressed && !uploading && styles.pressed,
      ]}
    >
      {uploading ? (
        <ActivityIndicator color="#E7B84C" />
      ) : (
        <>
          <View style={styles.addCircle}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <Text style={styles.addTitle}>Adicionar foto</Text>
        </>
      )}
    </Pressable>
  );
}

function EmptyPhotoCard() {
  return (
    <View style={styles.emptyPhotoCard}>
      <View style={styles.emptyGlowA} />
      <View style={styles.emptyGlowB} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#020202",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  loadingText: {
    color: "#938B86",
    fontSize: 12,
  },

  headerDivider: {
    height: 1,
    marginHorizontal: 20,
    backgroundColor: "rgba(233,185,73,0.34)",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 128,
  },

  counterWrap: {
    alignItems: "center",
  },
  counter: {
    minWidth: 150,
    height: 52,
    marginTop: -1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(233,185,73,0.42)",
    backgroundColor: "rgba(9,8,6,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  counterIcon: {
    width: 25,
    height: 25,
  },
  counterText: {
    color: "#EAC260",
    fontSize: 14,
    fontWeight: "700",
  },

  title: {
    color: "#FFFDFC",
    fontSize: 35,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 22,
  },
  subtitle: {
    color: "#A59D98",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 24,
  },

  galleryGrid: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  leftColumn: {
    flex: 1,
    gap: 11,
  },
  rightColumn: {
    flex: 0.92,
    gap: 11,
  },

  photoCard: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    position: "relative",
  },
  photoCardLarge: {
    height: 240,
  },
  photoCardPrincipal: {
    borderWidth: 1.5,
    borderColor: "#F1C65D",
    shadowColor: "#E7B84C",
    shadowOpacity: 0.23,
    shadowRadius: 12,
    elevation: 6,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  moreButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(10,10,10,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
    marginTop: -6,
  },

  principalBadge: {
    position: "absolute",
    left: 12,
    bottom: 14,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor: "#E7B84C",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  principalIcon: {
    width: 19,
    height: 19,
  },
  principalText: {
    color: "#211400",
    fontSize: 13,
    fontWeight: "800",
  },

  addCard: {
    height: 190,
    borderRadius: 18,
    borderWidth: 1.3,
    borderStyle: "dashed",
    borderColor: "#E7B84C",
    backgroundColor: "rgba(7,7,7,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardLarge: {
    height: 240,
  },
  addCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: "#E7B84C",
    alignItems: "center",
    justifyContent: "center",
  },
  addPlus: {
    color: "#E7B84C",
    fontSize: 48,
    lineHeight: 50,
    fontWeight: "200",
    marginTop: -3,
  },
  addTitle: {
    color: "#E7B84C",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 15,
  },

  emptyPhotoCard: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  emptyGlowA: {
    position: "absolute",
    width: 260,
    height: 90,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.045)",
    transform: [{ rotate: "-28deg" }],
    top: 38,
    left: -58,
  },
  emptyGlowB: {
    position: "absolute",
    width: 220,
    height: 64,
    borderRadius: 70,
    backgroundColor: "rgba(233,185,73,0.035)",
    transform: [{ rotate: "28deg" }],
    bottom: 32,
    right: -74,
  },

  extraGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 11,
  },
  extraCell: {
    width: "48.5%",
  },

  tipCard: {
    minHeight: 95,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,8,8,0.93)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 22,
  },
  tipIconGlow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "rgba(229,29,50,0.34)",
    backgroundColor: "rgba(98,0,15,0.24)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E51D32",
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
  },
  tipCopy: {
    marginLeft: 16,
    flex: 1,
  },
  tipTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  tipText: {
    color: "#A99F99",
    fontSize: 16,
    marginTop: 2,
  },

  saveButton: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E72E45",
    backgroundColor: "#A8071C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    marginTop: 20,
    shadowColor: "#E51D32",
    shadowOpacity: 0.24,
    shadowRadius: 11,
    elevation: 5,
  },
  saveIcon: {
    width: 30,
    height: 30,
  },
  saveText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.46,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
