// src/services/usuarios.ts

import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function buscarPerfilPublico(id: string) {
    const token = await obterToken();

    const { data } = await api.get(
        `/perfil/publico/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}