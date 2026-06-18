import { obterToken } from "../storage/auth";
import { api } from "./api";

async function authHeader() {
    const token = await obterToken();

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function listarPacotes() {
    const { data } = await api.get(
        "/pagamentos/pacotes"
    );

    return data;
}

export async function criarCheckout(
    packId: string
) {
    const headers = await authHeader();

    const { data } = await api.post(
        "/pagamentos/checkout",
        {
            packId,
        },
        {
            headers,
        }
    );

    return data;
}