import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import * as WebBrowser from "expo-web-browser";

import {
    criarCheckout,
    listarPacotes,
} from "../services/pagamentos";

export default function Creditos() {
    const [pacotes, setPacotes] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    async function carregar() {
        try {
            const data =
                await listarPacotes();

            setPacotes(data);
        } catch (error) {
            console.log(error);

            Alert.alert(
                "Erro",
                "Não foi possível carregar os pacotes"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    async function comprar(
        packId: string
    ) {
        try {
            const checkout =
                await criarCheckout(
                    packId
                );

            await WebBrowser.openBrowserAsync(
                checkout.initPoint
            );
        } catch (error) {
            console.log(error);

            Alert.alert(
                "Erro",
                "Não foi possível iniciar a compra"
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
        <View style={styles.container}>
            <Text style={styles.title}>
                💎 Comprar Créditos
            </Text>

            <FlatList
                data={pacotes}
                keyExtractor={(item) =>
                    item.id
                }
                contentContainerStyle={{
                    paddingBottom: 30,
                }}
                renderItem={({ item }) => (
                    <View
                        style={styles.card}
                    >
                        <Text
                            style={
                                styles.nome
                            }
                        >
                            {item.nome}
                        </Text>

                        <Text
                            style={
                                styles.creditos
                            }
                        >
                            {
                                item.creditos
                            }{" "}
                            créditos
                        </Text>

                        <Text
                            style={
                                styles.preco
                            }
                        >
                            R${" "}
                            {(
                                item.valorCentavos /
                                100
                            ).toFixed(
                                2
                            )}
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.button
                            }
                            onPress={() =>
                                comprar(
                                    item.id
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Comprar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles =
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor:
                "#040205",
            padding: 16,
        },

        loading: {
            flex: 1,
            justifyContent:
                "center",
            alignItems:
                "center",
            backgroundColor:
                "#040205",
        },

        title: {
            color: "#fff",
            fontSize: 28,
            fontWeight: "900",
            marginBottom: 20,
        },

        card: {
            backgroundColor:
                "#12080A",
            borderRadius: 20,
            padding: 20,
            marginBottom: 15,
            borderWidth: 1,
            borderColor:
                "rgba(255,255,255,0.08)",
        },

        nome: {
            color: "#fff",
            fontSize: 22,
            fontWeight: "800",
        },

        creditos: {
            color: "#ddd",
            marginTop: 8,
            fontSize: 16,
        },

        preco: {
            color: "#C1121F",
            fontSize: 24,
            fontWeight: "900",
            marginTop: 10,
        },

        button: {
            backgroundColor:
                "#C1121F",
            marginTop: 15,
            padding: 14,
            borderRadius: 14,
            alignItems:
                "center",
        },

        buttonText: {
            color: "#fff",
            fontWeight: "800",
            fontSize: 16,
        },
    });