import { obterToken } from "../storage/auth";
import { api } from "./api";

async function authHeader() {
  const token = await obterToken();
  return { Authorization: `Bearer ${token}` };
}

export async function obterCarteira() {
  const headers = await authHeader();
  const { data } = await api.get("/carteira", { headers });
  return data;
}

export async function presentearCreditos(destinatarioId: string, valor: number, mensagem?: string) {
  const headers = await authHeader();
  const { data } = await api.post(
    "/carteira/presentear",
    { destinatarioId, valor, mensagem },
    { headers }
  );
  return data;
}
