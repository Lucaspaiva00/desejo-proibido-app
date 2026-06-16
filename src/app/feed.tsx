import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    bloquearUsuario,
    buscarFeed,
    curtirUsuario,
    denunciarUsuario,
    pularUsuario,
} from "../services/feed";

export default function Feed() {
    const [loading, setLoading] = useState(true);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [indice, setIndice] = useState(0);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            const dados = await buscarFeed();
            setUsuarios(dados);
            setIndice(0);
        } catch (error) {
            console.log(error);
            Alert.alert("Erro", "Não foi possível carregar o feed.");
        } finally {
            setLoading(false);
        }
    }

    const usuario = usuarios[indice];

    function proximo() {
        setIndice((old) => old + 1);
    }

    async function curtir() {
        if (!usuario) return;

        try {
            const r = await curtirUsuario(usuario.id);

            if (r?.matchCriado) {
                Alert.alert("🔥 MATCH!", "Vocês curtiram um ao outro!");
            }

            proximo();
        } catch (error: any) {
            console.log(error?.response?.data || error);
            Alert.alert("Erro", error?.response?.data?.erro || "Erro ao curtir.");
        }
    }

    async function pular() {
        if (!usuario) return;

        try {
            await pularUsuario(usuario.id);
            proximo();
        } catch (error: any) {
            console.log(error?.response?.data || error);
            Alert.alert("Erro", error?.response?.data?.erro || "Erro ao pular.");
        }
    }

    async function bloquear() {
        if (!usuario) return;

        Alert.alert(
            "Bloquear perfil",
            "Deseja bloquear este perfil?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Bloquear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await bloquearUsuario(usuario.id);
                            proximo();
                        } catch (error: any) {
                            Alert.alert(
                                "Erro",
                                error?.response?.data?.erro || "Erro ao bloquear."
                            );
                        }
                    },
                },
            ]
        );
    }

    async function denunciar() {
        if (!usuario) return;

        Alert.alert(
            "Denunciar perfil",
            "Deseja denunciar este perfil como suspeito?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Denunciar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await denunciarUsuario(usuario.id);
                            Alert.alert("Denúncia enviada", "Obrigado pelo aviso.");
                            proximo();
                        } catch (error: any) {
                            Alert.alert(
                                "Erro",
                                error?.response?.data?.erro || "Erro ao denunciar."
                            );
                        }
                    },
                },
            ]
        );
    }

    const nome = usuario?.perfil?.nome || "Sem nome";
    const cidade = usuario?.perfil?.cidade || "";
    const estado = usuario?.perfil?.estado || "";
    const bio = usuario?.perfil?.bio || "";
    const inicial = nome?.[0]?.toUpperCase() || "D";

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#C1121F" />
            </View>
        );
    }

    if (!usuario) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyCard}>
                    <View style={styles.emptyBadge}>
                        <Text style={styles.emptyBadgeText}>DP</Text>
                    </View>

                    <Text style={styles.emptyText}>
                        Sem pessoas no feed com esses filtros.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionDanger} onPress={carregar}>
                        <Text style={styles.actionText}>↻</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {usuario.fotoPrincipal ? (
                    <>
                        <Image
                            source={{ uri: usuario.fotoPrincipal }}
                            style={styles.photo}
                            resizeMode="cover"
                        />
                    </>
                ) : (
                    <View style={styles.noPhotoArea}>
                        <View style={styles.fallbackBadge}>
                            <Text style={styles.fallbackBadgeText}>{inicial}</Text>
                        </View>
                        <Text style={styles.noPhotoText}>Sem foto principal</Text>
                    </View>
                )}


                {usuario.boostAte && (
                    <View style={styles.boostBadge}>
                        <Text style={styles.boostText}>🔥 BOOST</Text>
                    </View>
                )}

                <View style={styles.profileInfo}>
                    <Text style={styles.name}>{nome}</Text>

                    {!!(cidade || estado) && (
                        <View style={styles.locationPill}>
                            <Text style={styles.locationText}>
                                📍 {cidade}
                                {estado ? ` ${estado}` : ""}
                            </Text>
                        </View>
                    )}

                    {!!bio && <Text style={styles.bio}>{bio}</Text>}
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionDanger} onPress={pular}>
                    <Text style={styles.actionText}>✖</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionNeutral} onPress={carregar}>
                    <Text style={styles.actionTextSmall}>⟲</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionNeutral} onPress={denunciar}>
                    <Text style={styles.actionTextSmall}>⚑</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionLike} onPress={curtir}>
                    <Text style={styles.actionText}>❤</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#040205",
        justifyContent: "center",
        alignItems: "center",
    },

    container: {
        flex: 1,
        backgroundColor: "#050106",
    },

    card: {
        flex: 1,
        borderRadius: 28,
        overflow: "hidden",
        marginHorizontal: 8,
        marginTop: 10,
        marginBottom: 10,
    },

    photo: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },


    noPhotoArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#321018",
    },

    fallbackBadge: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    fallbackBadgeText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
    },

    noPhotoText: {
        color: "#fff",
        fontSize: 15,
        opacity: 0.9,
    },

    boostBadge: {
        position: "absolute",
        top: 18,
        right: 18,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(193,18,31,0.92)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.20)",
    },

    boostText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "900",
    },

    profileInfo: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 30,
    },

    name: {
        color: "#fff",
        fontSize: 31,
        fontWeight: "900",
        letterSpacing: -0.5,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },

    locationPill: {
        alignSelf: "flex-start",
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },

    locationText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
    },

    bio: {
        marginTop: 12,
        color: "rgba(255,255,255,0.92)",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "600",
    },

    actions: {
        height: 104,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
    },

    actionDanger: {
        width: 62,
        height: 62,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#C1121F",
        shadowColor: "#C1121F",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 10,
    },

    actionLike: {
        width: 62,
        height: 62,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#C1121F",
        shadowColor: "#C1121F",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.55,
        shadowRadius: 25,
        elevation: 12,
    },

    actionNeutral: {
        width: 58,
        height: 58,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.13)",
    },

    actionText: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
    },

    actionTextSmall: {
        color: "#fff",
        fontSize: 25,
        fontWeight: "900",
    },

    emptyCard: {
        flex: 1,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#321018",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },

    emptyBadge: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    emptyBadgeText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "900",
    },

    emptyText: {
        color: "#fff",
        fontSize: 15,
        opacity: 0.9,
    },
});