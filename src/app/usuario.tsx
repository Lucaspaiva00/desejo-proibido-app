import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { buscarPerfilPublico } from "../services/usuarios";

export default function Usuario() {
    const { id } = useLocalSearchParams();

    const [perfil, setPerfil] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function carregar() {
        try {
            const data = await buscarPerfilPublico(
                String(id)
            );

            setPerfil(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

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

    if (!perfil) {
        return (
            <View style={styles.loading}>
                <Text style={{ color: "#fff" }}>
                    Perfil não encontrado
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{
                paddingBottom: 40,
            }}
        >
            <View style={styles.photoContainer}>
                <Image
                    source={{
                        uri: perfil.fotoPrincipal,
                    }}
                    style={styles.mainPhoto}
                />

                <View style={styles.overlay}>
                    <Text style={styles.nomeOverlay}>
                        {perfil.perfil?.nome}
                    </Text>

                    <Text style={styles.cidadeOverlay}>
                        {perfil.perfil?.cidade} -{" "}
                        {perfil.perfil?.estado}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.actionsCard}>
                    <Text style={styles.cardTitle}>
                        Ações rápidas
                    </Text>

                    <TouchableOpacity
                        style={styles.chatBtn}
                    >
                        <Text style={styles.btnText}>
                            Abrir Chat
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() =>
                            router.back()
                        }
                    >
                        <Text style={styles.btnText}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.blockBtn}
                    >
                        <Text style={styles.btnText}>
                            Bloquear
                        </Text>
                    </TouchableOpacity>
                </View>




                <Text style={styles.label}>
                    Fotos
                </Text>

                <FlatList
                    horizontal
                    data={perfil.fotos}
                    keyExtractor={(item) =>
                        item.id
                    }
                    showsHorizontalScrollIndicator={
                        false
                    }
                    renderItem={({ item }) => (
                        <Image
                            source={{
                                uri: item.url,
                            }}
                            style={
                                styles.galleryPhoto
                            }
                        />
                    )}
                />
            </View>
            <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>
                    Dica
                </Text>

                <Text style={styles.tipText}>
                    Bloquear remove match e
                    conversa imediatamente.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#040205",
    },

    loading: {
        flex: 1,
        backgroundColor: "#040205",
        justifyContent: "center",
        alignItems: "center",
    },

    photoContainer: {
        position: "relative",
    },

    mainPhoto: {
        width: "100%",
        height: 420,
    },

    overlay: {
        position: "absolute",
        left: 20,
        bottom: 20,
    },

    nomeOverlay: {
        color: "#fff",
        fontSize: 34,
        fontWeight: "900",
        textShadowColor:
            "rgba(0,0,0,0.8)",
        textShadowOffset: {
            width: 0,
            height: 2,
        },
        textShadowRadius: 8,
    },

    cidadeOverlay: {
        color: "#fff",
        marginTop: 4,
        fontSize: 15,
        textShadowColor:
            "rgba(0,0,0,0.8)",
        textShadowOffset: {
            width: 0,
            height: 2,
        },
        textShadowRadius: 8,
    },

    content: {
        padding: 16,
    },

    actionsCard: {
        backgroundColor: "#12080A",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    cardTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 12,
    },

    tipCard: {
        backgroundColor: "#12080A",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    tipTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 6,
    },

    tipText: {
        color: "#AAA",
        lineHeight: 20,
    },

    label: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 10,
        marginTop: 10,
    },

    bio: {
        color: "#DDD",
        lineHeight: 22,
        marginBottom: 16,
    },

    galleryPhoto: {
        width: 110,
        height: 150,
        borderRadius: 14,
        marginRight: 10,
    },

    chatBtn: {
        backgroundColor: "#C1121F",
        padding: 15,
        borderRadius: 14,
        alignItems: "center",
    },

    secondaryBtn: {
        backgroundColor: "#2A1B1F",
        padding: 15,
        borderRadius: 14,
        marginTop: 12,
        alignItems: "center",
    },

    blockBtn: {
        backgroundColor: "#C1121F",
        padding: 15,
        borderRadius: 14,
        marginTop: 12,
        alignItems: "center",
    },

    btnText: {
        color: "#fff",
        fontWeight: "700",
    },
});