import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { buscarMatches } from "../services/matches";

export default function Matches() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");

    async function carregar() {
        try {
            const data = await buscarMatches();
            setMatches(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    const matchesFiltrados = matches.filter((item) => {
        const perfil = item.outro?.perfil;

        const texto = (
            `${perfil?.nome || ""} ${perfil?.cidade || ""}`
        ).toLowerCase();

        return texto.includes(busca.toLowerCase());
    });

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
                ❤️ Seus Matches
            </Text>

            <TextInput
                placeholder="Pesquisar nome ou cidade..."
                placeholderTextColor="#888"
                value={busca}
                onChangeText={setBusca}
                style={styles.search}
            />

            <FlatList
                data={matchesFiltrados}
                keyExtractor={(item) =>
                    item.id.toString()
                }
                contentContainerStyle={{
                    paddingBottom: 30,
                }}
                renderItem={({ item }) => {
                    console.log("MATCH:", item);
                    const perfil =
                        item.outro?.perfil;

                    const foto =
                        item.outro?.fotos?.[0]?.url;

                    return (
                        <View style={styles.card}>
                            {foto ? (
                                <Image
                                    source={{
                                        uri: foto,
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

                            <View style={styles.info}>
                                <Text
                                    style={
                                        styles.nome
                                    }
                                >
                                    {perfil?.nome ||
                                        "Usuário"}
                                </Text>

                                <Text
                                    style={
                                        styles.cidade
                                    }
                                >
                                    {perfil?.cidade} -{" "}
                                    {
                                        perfil?.estado
                                    }
                                </Text>

                                <View
                                    style={
                                        styles.actions
                                    }
                                >
                                    <TouchableOpacity
                                        style={
                                            styles.chatBtn
                                        }
                                        onPress={() =>
                                            router.push(
                                                `/chat?conversaId=${item.conversaId}`
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.btnText
                                            }
                                        >
                                            Abrir Chat
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.profileBtn}
                                        onPress={() =>
                                            router.push(
                                                `/usuario?id=${item.outro.id}`
                                            )
                                        }
                                    >
                                        <Text style={styles.btnText}>
                                            Ver Perfil
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={() => (
                    <View
                        style={{
                            marginTop: 40,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                color: "#888",
                            }}
                        >
                            Nenhum match encontrado
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
        marginBottom: 16,
    },

    search: {
        backgroundColor: "#12080A",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.08)",
        color: "#fff",
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 18,
    },

    card: {
        backgroundColor: "#12080A",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 18,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    photo: {
        width: "100%",
        height: 260,
    },

    semFoto: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1A1012",
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
        color: "#BBB",
        marginTop: 4,
        marginBottom: 14,
    },

    actions: {
        flexDirection: "row",
        gap: 10,
    },

    chatBtn: {
        flex: 1,
        backgroundColor: "#C1121F",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },

    profileBtn: {
        flex: 1,
        backgroundColor: "#1F1A1C",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },

    btnText: {
        color: "#fff",
        fontWeight: "700",
    },
});