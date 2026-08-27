import { api } from "./api";
import { authHeaders } from "./http";

export type CriadoraStatus = {
  id: string;
  nome: string;
  creatorStatus: "NAO_SOLICITADO" | "PENDENTE" | "APROVADA" | "BLOQUEADA" | "REPROVADA" | string;
  creatorMotivo?: string | null;
  perfilVerificado: boolean;
  genero?: string | null;
  idade?: number | null;
  maiorDe18: boolean;
  elegivelParaSolicitar: boolean;
  podeTransmitir: boolean;
  carteira: { disponivel: number; bloqueado: number };
  configuracaoFinanceira?: any;
};

export async function statusCriadora(): Promise<CriadoraStatus> {
  const headers = await authHeaders();
  const { data } = await api.get("/criadora/status", { headers });
  return data;
}

export async function solicitarCriadora() {
  const headers = await authHeaders();
  const { data } = await api.post("/criadora/solicitar", {}, { headers });
  return data;
}

export async function financeiroCriadora() {
  const headers = await authHeaders();
  const { data } = await api.get("/criadora/financeiro", { headers });
  return data;
}

export async function listarSaquesCriadora() {
  const headers = await authHeaders();
  const { data } = await api.get("/criadora/saques", { headers });
  return data?.data || [];
}

export async function solicitarSaqueCriadora(payload: {
  valorCreditos: number;
  chavePix: string;
  tipoChavePix: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
}) {
  const headers = await authHeaders();
  const { data } = await api.post("/criadora/saques", payload, { headers });
  return data;
}
