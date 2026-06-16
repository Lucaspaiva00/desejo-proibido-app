import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

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

        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async function carregarFotos() {
        try {
            const headers = await authHeader();

            const { data } = await api.get(
                "/fotos/minhas",
                { headers }
            );

            setFotos(data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function uploadFoto() {
        try {
            const permissao =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissao.granted) {
                Alert.alert(
                    "Permissão necessária",
                    "Permita acesso à galeria"
                );
                return;
            }

            const imagem =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    quality: 0.8,
                    allowsEditing: true,
                    base64: true,
                });

            if (imagem.canceled) return;

            setUploading(true);

            const asset = imagem.assets[0];

            console.log(asset);

            const uploadCloudinary = await fetch(
                "https://api.cloudinary.com/v1_1/dfdinbti3/image/upload",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        file: `data:${asset.mimeType};base64,${asset.base64}`,
                        upload_preset: "desejoproibido",
                    }),
                }
            );

            const cloudData =
                await uploadCloudinary.json();

            console.log("CLOUDINARY:");
            console.log(cloudData);

            if (cloudData.error) {
                throw new Error(
                    cloudData.error.message
                );
            }

            const headers = await authHeader();

            const { data } = await api.post(
                "/fotos/upload",
                {
                    url: cloudData.secure_url,
                },
                { headers }
            );

            if (!data.principal) {
                await api.patch(
                    `/fotos/${data.id}/principal`,
                    {},
                    { headers }
                );
            }

            Alert.alert(
                "Sucesso",
                "Foto enviada"
            );

            carregarFotos();
        } catch (error: any) {
            console.log(error);

            Alert.alert(
                "Erro",
                error?.message ||
                "Erro ao enviar foto"
            );
        } finally {
            setUploading(false);
        }
    }

    async function definirPrincipal(
        fotoId: string
    ) {
        try {
            const headers = await authHeader();

            await api.patch(
                `/fotos/${fotoId}/principal`,
                {},
                { headers }
            );

            carregarFotos();
        } catch {
            Alert.alert(
                "Erro",
                "Erro ao definir destaque"
            );
        }
    }

    async function removerFoto(
        fotoId: string
    ) {
        Alert.alert(
            "Remover",
            "Deseja remover esta foto?",
            [
                {
                    text: "Cancelar",
                },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const headers =
                                await authHeader();

                            await api.delete(
                                `/fotos/${fotoId}`,
                                { headers }
                            );

                            carregarFotos();
                        } catch {
                            Alert.alert(
                                "Erro",
                                "Erro ao remover"
                            );
                        }
                    },
                },
            ]
        );
    }

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color="#C1121F"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Galeria Premium ✨
            </Text>

            <Text style={styles.subtitle}>
                Sua foto principal define sua
                posição no feed.
            </Text>

            <TouchableOpacity
                style={styles.uploadButton}
                onPress={uploadFoto}
                disabled={uploading}
            >
                <Text style={styles.uploadTitle}>
                    {uploading
                        ? "Enviando..."
                        : "Adicionar Foto"}
                </Text>

                <Text style={styles.uploadSub}>
                    JPG ou PNG
                </Text>
            </TouchableOpacity>

            <FlatList
                data={fotos}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{
                    paddingBottom: 100,
                }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image
                            source={{
                                uri: item.url,
                            }}
                            style={styles.image}
                        />

                        {item.principal && (
                            <View style={styles.badge}>
                                <Text
                                    style={styles.badgeText}
                                >
                                    Em Destaque
                                </Text>
                            </View>
                        )}

                        {!item.principal && (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() =>
                                    definirPrincipal(
                                        item.id
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.buttonText
                                    }
                                >
                                    Destaque
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() =>
                                removerFoto(item.id)
                            }
                        >
                            <Text
                                style={styles.buttonText}
                            >
                                Remover
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#050106",
        justifyContent: "center",
        alignItems: "center",
    },

    container: {
        flex: 1,
        backgroundColor: "#050106",
        padding: 15,
    },

    title: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "700",
        marginTop: 10,
    },

    subtitle: {
        color: "#999",
        marginBottom: 20,
    },

    uploadButton: {
        backgroundColor: "#C1121F",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
    },

    uploadTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    uploadSub: {
        color: "#fff",
        opacity: 0.8,
        marginTop: 4,
    },

    card: {
        width: "48%",
        margin: "1%",
        backgroundColor: "#120108",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,.08)",
    },

    image: {
        width: "100%",
        height: 180,
    },

    badge: {
        backgroundColor: "#C1121F",
        padding: 8,
        alignItems: "center",
    },

    badgeText: {
        color: "#fff",
        fontWeight: "700",
    },

    primaryButton: {
        backgroundColor: "#C1121F",
        padding: 12,
        alignItems: "center",
    },

    removeButton: {
        backgroundColor: "#1D1115",
        padding: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
});