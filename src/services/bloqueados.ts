import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function buscarBloqueados() {
    const token = await obterToken();

    const { data } = await api.get(
        "/bloqueios/meus",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}

export async function desbloquearUsuario(
    usuarioId: string
) {
    const token = await obterToken();

    const { data } = await api.delete(
        `/bloqueios/${usuarioId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}