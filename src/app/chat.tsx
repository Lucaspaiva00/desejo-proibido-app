import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { buscarUsuarioLogado } from "../services/auth";
import {
    apagarMensagem,
    buscarMensagens,
    editarMensagem,
    enviarFoto,
    enviarMensagemTexto,
    liberarConversa,
    listarConversas,
    statusConversa,
} from "../services/chat";

import {
    enviarPresente,
    listarPresentes
} from "../services/presentes";


import { uploadFotoCloudinary } from "../services/upload";

export default function Chat() {
    const params = useLocalSearchParams();
    const conversaIdParam = params.conversaId
        ? String(params.conversaId)
        : "";

    const listaRef = useRef<FlatList>(null);

    const [meuId, setMeuId] = useState("");
    const [loading, setLoading] = useState(true);
    const [conversas, setConversas] = useState<any[]>([]);
    const [mensagens, setMensagens] = useState<any[]>([]);
    const [conversaAtual, setConversaAtual] = useState<any>(null);
    const [texto, setTexto] = useState("");
    const [editandoId, setEditandoId] =
        useState<string | null>(null);
    const [busca, setBusca] = useState("");
    const [ultimoTotal, setUltimoTotal] =
        useState(0);
    const [presentes, setPresentes] =
        useState<any[]>([]);

    const [mostrarPresentes, setMostrarPresentes] =
        useState(false);
    const [chatLiberado, setChatLiberado] = useState(false);
    const [saldoCreditos, setSaldoCreditos] = useState(0);
    const [custoCreditos, setCustoCreditos] = useState(10);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        iniciar();
    }, [conversaIdParam]);

    useEffect(() => {
        if (!conversaIdParam) return;

        const interval = setInterval(() => {
            carregarMensagens(conversaIdParam);
        }, 2000);

        return () => clearInterval(interval);
    }, [conversaIdParam]);

    async function iniciar() {
        try {
            setLoading(true);

            const usuario = await buscarUsuarioLogado();
            setMeuId(usuario?.id || "");

            const lista = await listarConversas();
            setConversas(lista || []);
            const listaPresentes =
                await listarPresentes();
            console.log(
                "PRESENTES:",
                JSON.stringify(
                    listaPresentes,
                    null,
                    2
                )
            );
            setPresentes(listaPresentes);
            setPresentes(listaPresentes || []);
            if (conversaIdParam) {
                const conversa = lista?.find(
                    (c: any) => c.id === conversaIdParam
                );

                setConversaAtual(conversa || null);

                await carregarStatus(conversaIdParam);
                await carregarMensagens(conversaIdParam);
            }
        } catch (error) {
            console.log(error);
            Alert.alert(
                "Erro",
                "Não foi possível carregar o chat"
            );
        } finally {
            setLoading(false);
        }
    }
    async function enviarPresenteChat(
        presenteId: string
    ) {
        try {

            await enviarPresente(
                conversaIdParam,
                presenteId
            );

            setMostrarPresentes(false);

            await carregarMensagens(
                conversaIdParam
            );

            await carregarStatus(
                conversaIdParam
            );

        } catch (error: any) {

            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Falha ao enviar presente"
            );
        }
    }
    async function selecionarFoto() {
        try {
            const imagem =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    quality: 0.8,
                });

            if (imagem.canceled) return;

            const asset = imagem.assets[0];

            const cloud =
                await uploadFotoCloudinary(
                    asset.uri
                );

            console.log(
                "CLOUDINARY:",
                cloud.secure_url
            );

            await enviarFoto(
                conversaIdParam,
                cloud.public_id + "." + cloud.format,
                cloud.public_id + "." + cloud.format
            );

            await carregarMensagens(
                conversaIdParam
            );
        } catch (error: any) {
            console.log(
                "ERRO FOTO:",
                error?.response?.data ||
                error?.message
            );

            Alert.alert(
                "Erro",
                "Falha ao enviar foto"
            );
        }
    }

    async function carregarMensagens(conversaId: string) {
        const data =
            await buscarMensagens(conversaId);

        const novas =
            data?.mensagens || [];



        setUltimoTotal(novas.length);

        setMensagens(novas);

        setTimeout(() => {
            listaRef.current?.scrollToEnd({
                animated: true,
            });
        }, 300);
    }

    async function carregarStatus(conversaId: string) {
        try {
            const data = await statusConversa(conversaId);

            setChatLiberado(!!data.chatLiberado);
            setSaldoCreditos(Number(data.saldoCreditos || 0));
            setCustoCreditos(Number(data.custoCreditos || 10));
        } catch (error) {
            console.log(error);
        }
    }

    async function abrirConversa(conversa: any) {
        router.push(`/chat?conversaId=${conversa.id}`);
    }

    async function liberar() {
        try {
            if (!conversaIdParam) return;

            const data = await liberarConversa(conversaIdParam);

            setChatLiberado(!!data.chatLiberado);
            setSaldoCreditos(Number(data.saldoCreditos || 0));

            await carregarMensagens(conversaIdParam);

            Alert.alert(
                "Sucesso",
                "Chat liberado com créditos"
            );
        } catch (error: any) {
            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Não foi possível liberar o chat"
            );
        }
    }
    function abrirMenuMensagem(item: any) {
        const minha =
            String(item.autorId) === String(meuId);

        if (!minha) return;

        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    "Cancelar",
                    "Editar",
                    "Apagar",
                ],
                destructiveButtonIndex: 2,
                cancelButtonIndex: 0,
            },
            async (index) => {
                try {
                    if (index === 1) {
                        setTexto(item.texto || "");
                        setEditandoId(item.id);
                    }

                    if (index === 2) {
                        await apagarMensagem(item.id);

                        await carregarMensagens(
                            conversaIdParam
                        );
                    }
                } catch (error) {
                    Alert.alert(
                        "Erro",
                        "Operação não realizada"
                    );
                }
            }
        );
    }
    async function enviar() {
        try {
            if (!conversaIdParam) return;
            if (!texto.trim()) return;

            setEnviando(true);

            if (editandoId) {
                await editarMensagem(
                    editandoId,
                    texto.trim()
                );

                setEditandoId(null);
            } else {
                await enviarMensagemTexto(
                    conversaIdParam,
                    texto.trim()
                );
            }

            setTexto("");

            await carregarMensagens(conversaIdParam);
            await carregarStatus(conversaIdParam);
        } catch (error: any) {
            if (error?.response?.status === 402) {
                Alert.alert(
                    "Créditos insuficientes",
                    error?.response?.data?.erro ||
                    "Você precisa liberar o chat ou ter créditos."
                );
                return;
            }

            Alert.alert(
                "Erro",
                error?.response?.data?.erro ||
                "Não foi possível enviar a mensagem"
            );
        } finally {
            setEnviando(false);
        }
    }

    function fotoConversa(item: any) {
        return (
            item?.outro?.fotos?.find((f: any) => f.principal)
                ?.url ||
            item?.outro?.fotos?.[0]?.url ||
            null
        );
    }

    function nomeConversa(item: any) {
        return (
            item?.outro?.perfil?.nome ||
            item?.outro?.nome ||
            item?.outro?.email ||
            "Usuário"
        );
    }

    function ultimaMensagem(item: any) {
        return (
            item?.ultimaMensagem?.textoExibido ||
            item?.ultimaMensagem?.texto ||
            "Sem mensagens ainda"
        );
    }

    const conversasFiltradas = conversas.filter((item) => {
        const textoBusca = `${nomeConversa(item)} ${item?.outro?.cidade || ""
            } ${item?.outro?.estado || ""}`.toLowerCase();

        return textoBusca.includes(busca.toLowerCase());
    });

    if (loading) {
        return (
            <TouchableOpacity style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color="#C1121F"
                />
            </TouchableOpacity>
        );
    }

    if (!conversaIdParam) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>
                    💬 Conversas
                </Text>

                <TextInput
                    placeholder="Buscar conversa..."
                    placeholderTextColor="#777"
                    value={busca}
                    onChangeText={setBusca}
                    style={styles.search}
                />

                <FlatList
                    data={conversasFiltradas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        paddingBottom: 30,
                    }}
                    renderItem={({ item }) => {
                        const foto = fotoConversa(item);

                        return (
                            <TouchableOpacity
                                style={styles.conversaCard}
                                onPress={() =>
                                    abrirConversa(item)
                                }
                            >
                                {foto ? (
                                    <Image
                                        source={{
                                            uri: foto,
                                        }}
                                        style={
                                            styles.avatar
                                        }
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.avatar,
                                            styles.avatarFallback,
                                        ]}
                                    >
                                        <Text
                                            style={
                                                styles.avatarText
                                            }
                                        >
                                            {nomeConversa(
                                                item
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={styles.conversaInfo}>
                                    <TouchableOpacity
                                        style={
                                            styles.conversaTop
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.conversaNome
                                            }
                                            numberOfLines={1}
                                        >
                                            {nomeConversa(
                                                item
                                            )}
                                        </Text>

                                        {!item.chatLiberado && (
                                            <Text
                                                style={
                                                    styles.lock
                                                }
                                            >
                                                🔒
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    <Text
                                        style={
                                            styles.ultimaMensagem
                                        }
                                        numberOfLines={1}
                                    >
                                        {ultimaMensagem(
                                            item
                                        )}
                                    </Text>

                                    <Text
                                        style={
                                            styles.local
                                        }
                                    >
                                        {item?.outro?.cidade ||
                                            ""}
                                        {item?.outro?.estado
                                            ? ` - ${item.outro.estado}`
                                            : ""}
                                    </Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={() => (
                        <TouchableOpacity style={styles.empty}>
                            <Text style={styles.emptyText}>
                                Nenhuma conversa encontrada
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <View style={styles.chatHeader}>
                <TouchableOpacity
                    onPress={() => router.push("/chat")}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>

                {fotoConversa(conversaAtual) ? (
                    <Image
                        source={{
                            uri: fotoConversa(conversaAtual),
                        }}
                        style={styles.headerAvatar}
                    />
                ) : (
                    <View
                        style={[
                            styles.headerAvatar,
                            styles.avatarFallback,
                        ]}
                    >
                        <Text style={styles.avatarText}>
                            {nomeConversa(conversaAtual)
                                .charAt(0)
                                .toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={{ flex: 1 }}>
                    <Text
                        style={styles.headerName}
                        numberOfLines={1}
                    >
                        {nomeConversa(conversaAtual)}
                    </Text>

                    <Text style={styles.headerStatus}>
                        {chatLiberado
                            ? "Chat liberado"
                            : "Acesso restrito"}
                    </Text>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerActionButton}
                            onPress={() => router.push("/creditos")}
                        >
                            <Text style={styles.headerActionText}>💎</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerActionButton}
                        >
                            <Text style={styles.headerActionText}>💸</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerActionButton}
                        >
                            <Text style={styles.headerActionText}>🎥</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerActionButton}
                            onPress={() =>
                                ActionSheetIOS.showActionSheetWithOptions(
                                    {
                                        options: [
                                            "Cancelar",
                                            "Ver perfil",
                                            "Bloquear",
                                            "Denunciar",
                                            "Apagar conversa",
                                        ],
                                        cancelButtonIndex: 0,
                                        destructiveButtonIndex: 4,
                                    },
                                    (index) => {
                                        if (index === 1) {
                                            router.push(
                                                `/usuario?id=${conversaAtual?.outroUsuarioId}`
                                            );
                                        }

                                        if (index === 2) {
                                            Alert.alert("Bloquear");
                                        }

                                        if (index === 3) {
                                            Alert.alert("Denunciar");
                                        }

                                        if (index === 4) {
                                            Alert.alert("Apagar conversa");
                                        }
                                    }
                                )
                            }
                        >
                            <Text style={styles.headerActionText}>⋮</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                ref={listaRef}
                data={mensagens}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 20,
                }}
                renderItem={({ item }) => {
                    const minha =
                        String(item.autorId) ===
                        String(meuId);

                    return item.tipo === "PRESENTE" ? (
                        <View
                            style={{
                                alignSelf: minha
                                    ? "flex-end"
                                    : "flex-start",
                                marginVertical: 8,
                                paddingHorizontal: 10,
                            }}
                        >
                            <Image
                                source={{
                                    uri: `https://desejoproibido.app${item.metaJson?.imagemUrl}`,
                                }}
                                style={{
                                    width: 120,
                                    height: 120,
                                    resizeMode: "contain",
                                }}
                            />



                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.bubble,
                                minha
                                    ? styles.bubbleMine
                                    : styles.bubbleOther,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.bubbleText,
                                    minha
                                        ? styles.bubbleTextMine
                                        : styles.bubbleTextOther,
                                ]}
                            >
                                {item.textoExibido ||
                                    item.texto ||
                                    ""}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={() => (
                    <Text style={styles.noMessages}>
                        Sem mensagens ainda.
                    </Text>
                )}

            />
            {!chatLiberado && (
                <TouchableOpacity style={styles.paywall}>
                    <Text style={styles.paywallTitle}>
                        🔒 Acesso restrito
                    </Text>

                    <Text style={styles.paywallText}>
                        Para enviar mensagens nesta conversa,
                        libere o acesso com créditos.
                    </Text>

                    <TouchableOpacity
                        style={styles.unlockButton}
                        onPress={liberar}
                    >
                        <Text style={styles.unlockText}>
                            Liberar por {custoCreditos} créditos
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.saldo}>
                        Saldo: {saldoCreditos}
                    </Text>

                </TouchableOpacity>
            )}
            {presentes.length > 0 && (
                <View
                    style={{
                        height: 85,
                        backgroundColor: "#070304",
                        borderTopWidth: 1,
                        borderTopColor:
                            "rgba(255,255,255,0.05)",
                    }}
                >
                    <FlatList
                        horizontal
                        data={presentes}
                        keyExtractor={(item) =>
                            String(item.id)
                        }
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 10,
                            alignItems: "center",
                        }}
                        renderItem={({ item }) => {
                            const imagemPresente =
                                item.imagemUrl
                                    ? `https://desejoproibido.app${item.imagemUrl}`
                                    : null;

                            return (
                                <TouchableOpacity
                                    onPress={() =>
                                        enviarPresenteChat(item.id)
                                    }
                                    style={{
                                        width: 70,
                                        alignItems: "center",
                                        marginRight: 8,
                                    }}
                                >
                                    <Image
                                        source={{
                                            uri: imagemPresente!,
                                        }}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            resizeMode: "contain",
                                        }}
                                    />

                                    <Text
                                        style={{
                                            color: "#FFD700",
                                            fontWeight: "700",
                                            fontSize: 12,
                                            marginTop: 4,
                                        }}
                                    >
                                        💎{item.custoCreditos}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            )}
            <View style={styles.inputArea}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={selecionarFoto}
                >
                    <Text style={styles.iconText}>
                        📷
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>
                        🎙️
                    </Text>
                </TouchableOpacity>

                <TextInput
                    placeholder="Digite uma mensagem..."
                    placeholderTextColor="#777"
                    value={texto}
                    onChangeText={setTexto}
                    style={styles.input}
                    editable={chatLiberado && !enviando}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!chatLiberado ||
                            enviando) &&
                        styles.sendButtonDisabled,
                    ]}
                    onPress={enviar}
                    disabled={!chatLiberado || enviando}
                >
                    <Text style={styles.sendText}>
                        Enviar
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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

    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "900",
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 14,
    },

    search: {
        height: 50,
        marginHorizontal: 16,
        marginBottom: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: "#12080A",
        color: "#fff",
        borderWidth: 1,
        borderColor: "rgba(193,18,31,0.35)",
    },

    conversaCard: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 20,
        backgroundColor: "#12080A",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },

    avatar: {
        width: 58,
        height: 58,
        borderRadius: 18,
        marginRight: 12,
    },

    avatarFallback: {
        backgroundColor: "#251015",
        justifyContent: "center",
        alignItems: "center",
    },

    avatarText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
    },

    conversaInfo: {
        flex: 1,
    },

    conversaTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    conversaNome: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "800",
        flex: 1,
    },

    lock: {
        marginLeft: 8,
    },

    ultimaMensagem: {
        color: "#aaa",
        marginTop: 4,
    },

    local: {
        color: "#666",
        marginTop: 3,
        fontSize: 12,
    },

    empty: {
        marginTop: 80,
        alignItems: "center",
    },

    emptyText: {
        color: "#888",
    },

    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: "#070304",
    },

    backButton: {
        width: 34,
        height: 34,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },

    backText: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "800",
    },

    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        marginRight: 10,
    },

    headerName: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "800",
    },

    headerStatus: {
        color: "#888",
        fontSize: 12,
        marginTop: 2,
    },

    noMessages: {
        color: "#777",
        marginTop: 20,
    },

    bubble: {
        maxWidth: "78%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },

    bubbleMine: {
        alignSelf: "flex-end",
        backgroundColor: "#C1121F",
        borderBottomRightRadius: 4,
    },

    bubbleOther: {
        alignSelf: "flex-start",
        backgroundColor: "#1B1114",
        borderBottomLeftRadius: 4,
    },

    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },

    bubbleTextMine: {
        color: "#fff",
    },

    bubbleTextOther: {
        color: "#eee",
    },

    paywall: {
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#101010",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },

    paywallTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 8,
    },

    paywallText: {
        color: "#ddd",
        lineHeight: 21,
        marginBottom: 14,
    },

    unlockButton: {
        backgroundColor: "#C1121F",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },

    unlockText: {
        color: "#fff",
        fontWeight: "900",
    },

    saldo: {
        color: "#aaa",
        marginTop: 10,
        textAlign: "right",
    },

    inputArea: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
        backgroundColor: "#070304",
    },

    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#140A0C",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
    },

    iconText: {
        fontSize: 18,
    },

    input: {
        flex: 1,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#12080A",
        color: "#fff",
        paddingHorizontal: 14,
        marginHorizontal: 6,
    },

    sendButton: {
        backgroundColor: "#C1121F",
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },

    sendButtonDisabled: {
        opacity: 0.5,
    },

    sendText: {
        color: "#fff",
        fontWeight: "900",
    },

    chatActions: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#090304",
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.08)",
    },

    actionButton: {
        backgroundColor: "#2A070C",
        borderWidth: 1,
        borderColor: "#5A0E18",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },

    actionText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "700",
    },

    actionIcon: {
        fontSize: 16,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 6,
    },

    headerActionButton: {
        backgroundColor: "#2A070C",
        borderWidth: 1,
        borderColor: "#5A0E18",
        borderRadius: 16,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },

    headerActionText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "800",
    },
});