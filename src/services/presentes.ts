import { obterToken } from "../storage/auth";
import { api } from "./api";

export async function listarPresentes() {
    const token = await obterToken();

    const { data } = await api.get(
        "/presentes",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}

export async function enviarPresente(
    conversaId: string,
    presenteId: string
) {
    const token = await obterToken();

    const { data } = await api.post(
        "/presentes/enviar",
        {
            conversaId,
            presenteId,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}