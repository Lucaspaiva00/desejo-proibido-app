import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function buscarMatches() {
    const token = await obterToken();

    const { data } = await api.get("/matches", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}