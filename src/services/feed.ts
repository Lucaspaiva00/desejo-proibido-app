import { obterToken } from "../storage/auth";
import { api } from "./api";

async function authHeader() {
    const token = await obterToken();

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function buscarFeed() {
    const headers = await authHeader();

    console.log("TOKEN HEADER:");
    console.log(headers);

    const response = await api.get("/busca", {
        headers,
    });

    console.log("BUSCA RESPONSE:");
    console.log(JSON.stringify(response.data, null, 2));

    return response.data?.data || [];
}

export async function curtirUsuario(usuarioId: string) {
    const headers = await authHeader();

    const { data } = await api.post(
        `/curtidas/${usuarioId}`,
        {},
        { headers }
    );

    return data;
}

export async function pularUsuario(usuarioId: string) {
    const headers = await authHeader();

    const { data } = await api.post(
        `/skips/${usuarioId}`,
        {},
        { headers }
    );

    return data;
}