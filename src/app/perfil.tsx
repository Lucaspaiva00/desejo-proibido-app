import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../services/api";
import { obterToken } from "../storage/auth";

export default function Perfil() {
    const [loading, setLoading] = useState(true);

    const [nome, setNome] = useState("");
    const [bio, setBio] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");
    const [genero, setGenero] = useState("");
    const [nascimento, setNascimento] = useState("");

    const [isPremium, setIsPremium] = useState(false);
    const [saldoCreditos, setSaldoCreditos] = useState(0);

    const [isInvisivel, setIsInvisivel] = useState(false);

    useEffect(() => {
        carregar();
    }, []);

    async function authHeader() {
        const token = await obterToken();

        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async function carregar() {
        try {
            const headers = await authHeader();

            const [perfilRes, premiumRes, usuarioRes] =
                await Promise.all([
                    api.get("/perfil/me", { headers }),
                    api.get("/premium/me", { headers }),
                    api.get("/usuarios/me", { headers }),
                ]);

            const perfil = perfilRes.data;
            const premium = premiumRes.data;
            const usuario = usuarioRes.data;

            setNome(perfil?.nome || "");
            setBio(perfil?.bio || "");
            setCidade(perfil?.cidade || "");
            setEstado(perfil?.estado || "");
            setGenero(perfil?.genero || "");

            if (perfil?.nascimento) {
                setNascimento(
                    String(perfil.nascimento).substring(0, 10)
                );
            }

            setSaldoCreditos(
                premium?.saldoCreditos || 0
            );

            setIsPremium(
                premium?.isPremium || false
            );

            setIsInvisivel(
                usuario?.isInvisivel || false
            );
        } catch (error) {
            console.log(error);
            Alert.alert(
                "Erro",
                "Não foi possível carregar o perfil"
            );
        } finally {
            setLoading(false);
        }
    }

    async function salvarPerfil() {
        try {
            const headers = await authHeader();

            await api.put(
                "/perfil",
                {
                    nome,
                    bio,
                    cidade,
                    estado,
                    genero,
                    nascimento,
                },
                { headers }
            );

            Alert.alert(
                "Sucesso",
                "Perfil salvo com sucesso"
            );
        } catch (error: any) {
            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Erro ao salvar perfil"
            );
        }
    }

    async function ativarBoost() {
        try {
            const headers = await authHeader();

            await api.put(
                "/usuarios/boost",
                {},
                { headers }
            );

            Alert.alert(
                "Sucesso",
                "Boost ativado!"
            );

            carregar();
        } catch (error: any) {
            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Erro ao ativar boost"
            );
        }
    }

    async function alterarInvisivel(
        valor: boolean
    ) {
        try {
            const headers = await authHeader();

            await api.put(
                "/usuarios/invisivel",
                {
                    ativo: valor,
                },
                { headers }
            );

            setIsInvisivel(valor);
        } catch (error: any) {
            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Erro ao alterar invisível"
            );
        }
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
        <ScrollView
            style={styles.container}
            contentContainerStyle={{
                paddingBottom: 40,
            }}
        >
            <Text style={styles.title}>
                Meu Perfil
            </Text>

            <View style={styles.card}>
                <Text style={styles.label}>
                    Nome
                </Text>

                <TextInput
                    style={styles.input}
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Seu nome"
                    placeholderTextColor="#777"
                />

                <Text style={styles.label}>
                    Cidade
                </Text>

                <TextInput
                    style={styles.input}
                    value={cidade}
                    onChangeText={setCidade}
                    placeholder="Cidade"
                    placeholderTextColor="#777"
                />

                <Text style={styles.label}>
                    Estado
                </Text>

                <TextInput
                    style={styles.input}
                    value={estado}
                    onChangeText={setEstado}
                    placeholder="SP"
                    maxLength={2}
                    placeholderTextColor="#777"
                />

                <Text style={styles.label}>
                    Gênero
                </Text>

                <TextInput
                    style={styles.input}
                    value={genero}
                    onChangeText={setGenero}
                    placeholder="Masculino"
                    placeholderTextColor="#777"
                />

                <Text style={styles.label}>
                    Nascimento
                </Text>

                <TextInput
                    style={styles.input}
                    value={nascimento}
                    onChangeText={setNascimento}
                    placeholder="2000-01-01"
                    placeholderTextColor="#777"
                />

                <Text style={styles.label}>
                    Bio
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        {
                            height: 120,
                            textAlignVertical: "top",
                        },
                    ]}
                    multiline
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Conte um pouco sobre você..."
                    placeholderTextColor="#777"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={salvarPerfil}
                >
                    <Text style={styles.buttonText}>
                        Salvar Perfil
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.section}>
                    Premium
                </Text>

                <Text style={styles.info}>
                    Plano:
                    {isPremium
                        ? " Premium"
                        : " Free"}
                </Text>

                <Text style={styles.info}>
                    Créditos: {saldoCreditos}
                </Text>

                <View style={styles.switchRow}>
                    <Text style={styles.info}>
                        Modo Invisível
                    </Text>

                    <Switch
                        value={isInvisivel}
                        onValueChange={
                            alterarInvisivel
                        }
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={ativarBoost}
                >
                    <Text style={styles.buttonText}>
                        🚀 Ativar Boost
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
        padding: 16,
    },

    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 15,
    },

    card: {
        backgroundColor: "#120108",
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.05)",
    },

    section: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10,
    },

    label: {
        color: "#aaa",
        marginBottom: 6,
        marginTop: 12,
    },

    input: {
        backgroundColor: "#1D1115",
        color: "#fff",
        borderRadius: 12,
        padding: 14,
    },

    button: {
        backgroundColor: "#C1121F",
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },

    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
    },

    info: {
        color: "#fff",
        marginBottom: 10,
    },

    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 15,
    },
});