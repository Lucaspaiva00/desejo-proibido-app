import { obterToken } from "../storage/auth";
import { api } from "./api";


async function authHeader() {
    const token = await obterToken();

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function listarConversas() {
    const headers = await authHeader();

    const { data } = await api.get("/conversas", {
        headers,
    });

    return data;
}

export async function salvarFotoPerfil(
    url: string
) {
    const token =
        await obterToken();

    const { data } =
        await api.post(
            "/fotos/upload",
            { url },
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            }
        );

    return data;
}


export async function enviarFoto(
    conversaId: string,
    mediaPath: string,
    thumbPath?: string
) {
    const headers = await authHeader();

    const { data } = await api.post(
        "/mensagens/foto",
        {
            conversaId,
            mediaPath,
            thumbPath,
        },
        { headers }
    );

    return data;
}

export async function enviarAudio(
    conversaId: string,
    mediaPath: string,
    duracao?: number
) {
    const headers = await authHeader();

    const { data } = await api.post(
        "/mensagens/audio",
        {
            conversaId,
            mediaPath,
            duracao,
        },
        { headers }
    );

    return data;
}
export async function buscarMensagens(conversaId: string) {
    const headers = await authHeader();

    const { data } = await api.get(
        `/conversas/${conversaId}/mensagens`,
        {
            headers,
        }
    );

    return data;
}

export async function statusConversa(conversaId: string) {
    const headers = await authHeader();

    const { data } = await api.get(
        `/conversas/${conversaId}/status`,
        {
            headers,
        }
    );

    return data;
}

export async function liberarConversa(conversaId: string) {
    const headers = await authHeader();

    const { data } = await api.post(
        `/conversas/${conversaId}/liberar`,
        {},
        {
            headers,
        }
    );

    return data;
}

export async function enviarMensagemTexto(
    conversaId: string,
    texto: string
) {
    const headers = await authHeader();

    const { data } = await api.post(
        "/mensagens",
        {
            conversaId,
            texto,
        },
        {
            headers,
        }
    );

    return data;
}

export async function apagarMensagem(
    mensagemId: string
) {
    const headers = await authHeader();

    const { data } = await api.delete(
        `/mensagens/${mensagemId}`,
        { headers }
    );

    return data;
}

export async function editarMensagem(
    mensagemId: string,
    texto: string
) {
    const headers = await authHeader();

    const { data } = await api.put(
        `/mensagens/${mensagemId}`,
        { texto },
        { headers }
    );

    return data;
}