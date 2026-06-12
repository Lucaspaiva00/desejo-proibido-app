import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function buscarUsuarioLogado() {
    const token = await obterToken();

    const { data } = await api.get("/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}