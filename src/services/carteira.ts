import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function presentearCreditos(
    destinatarioId: string,
    valor: number,
    mensagem?: string
) {
    const token = await obterToken();

    const { data } = await api.post(
        "/carteira/presentear",
        {
            destinatarioId,
            valor,
            mensagem,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}