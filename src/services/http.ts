import { obterToken } from "../storage/auth";

export async function authHeaders() {
  const token = await obterToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  return { Authorization: `Bearer ${token}` };
}

export function apiErrorMessage(error: any, fallback = "Não foi possível concluir a operação") {
  return (
    error?.response?.data?.erro ||
    error?.response?.data?.mensagem ||
    error?.response?.data?.detalhe ||
    error?.message ||
    fallback
  );
}
