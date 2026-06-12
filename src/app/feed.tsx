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
    buscarFeed,
    curtirUsuario,
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

            console.log("FEED RETORNO:");
            console.log(JSON.stringify(dados, null, 2));

            setUsuarios(dados);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const usuario = usuarios[indice];

    async function curtir() {
        try {
            const r = await curtirUsuario(usuario.id);

            if (r?.matchCriado) {
                Alert.alert("🔥 MATCH!", "Vocês curtiram um ao outro!");
            }

            setIndice((old) => old + 1);
        } catch (error) {
            console.log(error);
        }
    }

    async function pular() {
        try {
            await pularUsuario(usuario.id);
            setIndice((old) => old + 1);
        } catch (error) {
            console.log(error);
        }
    }

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#ff3366" />
            </View>
        );
    }

    if (!usuario) {
        return (
            <View style={styles.loading}>
                <Text style={styles.semUsuarios}>
                    Nenhum usuário encontrado
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {usuario.fotoPrincipal ? (
                <Image
                    source={{ uri: usuario.fotoPrincipal }}
                    style={styles.foto}
                />
            ) : (
                <View style={styles.semFoto}>
                    <Text style={styles.semFotoText}>
                        Sem Foto
                    </Text>
                </View>
            )}

            <View style={styles.info}>
                <Text style={styles.nome}>
                    {usuario?.perfil?.nome || "Sem nome"}
                </Text>

                <Text style={styles.local}>
                    {usuario?.perfil?.cidade || ""}
                    {usuario?.perfil?.estado
                        ? ` - ${usuario.perfil.estado}`
                        : ""}
                </Text>

                <Text style={styles.bio}>
                    {usuario?.perfil?.bio || ""}
                </Text>
            </View>

            <View style={styles.acoes}>
                <TouchableOpacity
                    style={styles.btnPular}
                    onPress={pular}
                >
                    <Text style={styles.btnText}>
                        ❌
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnCurtir}
                    onPress={curtir}
                >
                    <Text style={styles.btnText}>
                        ❤️
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}



const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
    },

    container: {
        flex: 1,
        backgroundColor: "#111",
        padding: 20,
    },

    foto: {
        width: "100%",
        height: 500,
        borderRadius: 20,
        marginTop: 40,
    },

    semFoto: {
        width: "100%",
        height: 500,
        borderRadius: 20,
        marginTop: 40,
        backgroundColor: "#1e1e1e",
        justifyContent: "center",
        alignItems: "center",
    },

    semFotoText: {
        color: "#fff",
    },

    info: {
        marginTop: 20,
    },

    nome: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
    },

    local: {
        color: "#bbb",
        marginTop: 5,
    },

    bio: {
        color: "#fff",
        marginTop: 15,
        lineHeight: 22,
    },

    acoes: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 30,
    },

    btnPular: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#444",
        justifyContent: "center",
        alignItems: "center",
    },

    btnCurtir: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ff3366",
        justifyContent: "center",
        alignItems: "center",
    },

    btnText: {
        fontSize: 32,
    },

    semUsuarios: {
        color: "#fff",
        fontSize: 18,
    },
});