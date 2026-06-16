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

import {
    buscarBloqueados,
    desbloquearUsuario,
} from "../services/bloqueados";

export default function Bloqueados() {
    const [usuarios, setUsuarios] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    async function carregar() {
        try {
            const data =
                await buscarBloqueados();

            setUsuarios(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    async function desbloquear(
        usuarioId: string
    ) {
        Alert.alert(
            "Desbloquear",
            "Deseja desbloquear este usuário?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Desbloquear",
                    onPress: async () => {
                        try {
                            await desbloquearUsuario(
                                usuarioId
                            );

                            setUsuarios(
                                usuarios.filter(
                                    (u) =>
                                        u.usuario.id !==
                                        usuarioId
                                )
                            );
                        } catch (err) {
                            Alert.alert(
                                "Erro",
                                "Não foi possível desbloquear"
                            );
                        }
                    },
                },
            ]
        );
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                🚫 Usuários Bloqueados
            </Text>

            <FlatList
                data={usuarios}
                keyExtractor={(item) =>
                    item.id
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {item.usuario
                            .fotoPrincipal ? (
                            <Image
                                source={{
                                    uri: item.usuario
                                        .fotoPrincipal,
                                }}
                                style={
                                    styles.photo
                                }
                            />
                        ) : (
                            <View
                                style={[
                                    styles.photo,
                                    styles.semFoto,
                                ]}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                    }}
                                >
                                    Sem foto
                                </Text>
                            </View>
                        )}

                        <View
                            style={styles.info}
                        >
                            <Text
                                style={
                                    styles.nome
                                }
                            >
                                {
                                    item.usuario
                                        ?.perfil
                                        ?.nome
                                }
                            </Text>

                            <Text
                                style={
                                    styles.cidade
                                }
                            >
                                {
                                    item.usuario
                                        ?.perfil
                                        ?.cidade
                                }{" "}
                                -{" "}
                                {
                                    item.usuario
                                        ?.perfil
                                        ?.estado
                                }
                            </Text>

                            <TouchableOpacity
                                style={
                                    styles.btn
                                }
                                onPress={() =>
                                    desbloquear(
                                        item
                                            .usuario
                                            .id
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.btnText
                                    }
                                >
                                    Desbloquear
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View
                        style={{
                            marginTop: 60,
                            alignItems:
                                "center",
                        }}
                    >
                        <Text
                            style={{
                                color: "#888",
                            }}
                        >
                            Nenhum usuário bloqueado
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#040205",
        padding: 16,
    },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#040205",
    },

    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 20,
    },

    card: {
        backgroundColor: "#12080A",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    photo: {
        width: "100%",
        height: 220,
    },

    semFoto: {
        justifyContent: "center",
        alignItems: "center",
    },

    info: {
        padding: 15,
    },

    nome: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "800",
    },

    cidade: {
        color: "#999",
        marginTop: 4,
        marginBottom: 15,
    },

    btn: {
        backgroundColor: "#C1121F",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    btnText: {
        color: "#fff",
        fontWeight: "700",
    },
});