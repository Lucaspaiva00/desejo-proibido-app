import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { router } from "expo-router";
import { buscarUsuarioLogado } from "../services/auth";

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState<any>(null);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            const dados = await buscarUsuarioLogado();
            setUsuario(dados);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#ff3366" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>Desejo Proibido</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{usuario?.email}</Text>

                <Text style={styles.label}>Plano</Text>
                <Text style={styles.value}>
                    {usuario?.isPremium ? "Premium" : "Free"}
                </Text>

                <Text style={styles.label}>Créditos</Text>
                <Text style={styles.value}>
                    {usuario?.saldoCreditos}
                </Text>

                <Text style={styles.label}>Idioma</Text>
                <Text style={styles.value}>
                    {usuario?.idioma}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/perfil")}
            >
                <Text style={styles.buttonText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/feed")}
            >
                <Text style={styles.buttonText}>
                    Feed
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
            >
                <Text style={styles.buttonText}>Matches</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
            >
                <Text style={styles.buttonText}>Conversas</Text>
            </TouchableOpacity>
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
        paddingTop: 60,
    },

    logo: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 20,
    },

    card: {
        backgroundColor: "#1e1e1e",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },

    label: {
        color: "#888",
        marginTop: 8,
    },

    value: {
        color: "#fff",
        fontSize: 16,
        marginTop: 2,
    },

    button: {
        backgroundColor: "#ff3366",
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
    },

    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
    },
});