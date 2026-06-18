import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function statusConversa(
    conversaId: string
) {
    const token = await obterToken();

    const { data } = await api.get(
        `/conversas/${conversaId}/status`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}

export async function liberarChat(
    conversaId: string
) {
    const token = await obterToken();

    const { data } = await api.post(
        `/conversas/${conversaId}/liberar`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}