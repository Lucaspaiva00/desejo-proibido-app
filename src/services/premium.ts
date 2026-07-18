import { obterToken } from "../storage/auth";
import { api } from "./api";

async function authHeader() {
    const token = await obterToken();

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function premiumMe() {
    const headers = await authHeader();

    const { data } = await api.get(
        "/premium/me",
        { headers }
    );

    return data;
}

export async function ativarBoost() {
    const headers = await authHeader();

    const { data } = await api.put(
        "/usuarios/boost",
        {},
        { headers }
    );

    return data;
}

export async function alterarInvisivel(
    ativo: boolean
) {
    const headers = await authHeader();

    const { data } = await api.put(
        "/usuarios/invisivel",
        { ativo },
        { headers }
    );

    return data;
}