import { api } from "./api";
import { authHeaders } from "./http";

export type LiveHost = {
  id: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  verificada?: boolean;
  foto?: string | null;
};

export type LiveItem = {
  id: string;
  titulo?: string | null;
  status: string;
  criadaEm: string;
  encerradaEm?: string | null;
  metaCreditos?: number | null;
  host: LiveHost;
  viewersOnline: number;
};

export type LiveStatus = {
  userId: string;
  nome: string;
  genero: string;
  podeTransmitir: boolean;
  podeAssistir: boolean;
  saldoCreditos: number;
  minutosDisponiveis: number;
  liveAtiva?: LiveItem | null;
  ganhos?: { creditos: number; eventos: number };
};

export type LiveRanking = {
  liveId: string;
  status: string;
  metaCreditos: number | null;
  arrecadadoBrutoCreditos: number;
  presentesQuantidade: number;
  ranking: Array<{ posicao: number; userId: string; nome: string; creditos: number }>;
};

export async function statusLives(): Promise<LiveStatus> {
  const headers = await authHeaders();
  const { data } = await api.get("/lives/status", { headers });
  return data;
}

export async function listarLives(): Promise<LiveItem[]> {
  const headers = await authHeaders();
  const { data } = await api.get("/lives", { headers });
  return data?.items || data?.data || [];
}

export async function detalharLive(id: string): Promise<LiveItem> {
  const headers = await authHeaders();
  const { data } = await api.get(`/lives/${id}`, { headers });
  return data;
}

export async function iniciarLive(titulo?: string, metaCreditos?: number | null) {
  const headers = await authHeaders();
  const { data } = await api.post(
    "/lives/iniciar",
    { titulo: titulo?.trim() || null, metaCreditos: metaCreditos || null },
    { headers }
  );
  return data;
}

export async function entrarLive(id: string) {
  const headers = await authHeaders();
  const { data } = await api.post(`/lives/${id}/entrar`, {}, { headers });
  return data;
}

export async function sairLive(id: string) {
  const headers = await authHeaders();
  const { data } = await api.post(`/lives/${id}/sair`, {}, { headers });
  return data;
}

export async function tickLive(id: string) {
  const headers = await authHeaders();
  const { data } = await api.post(`/lives/${id}/tick`, {}, { headers });
  return data;
}

export async function encerrarLive(id: string) {
  const headers = await authHeaders();
  const { data } = await api.post(`/lives/${id}/encerrar`, {}, { headers });
  return data;
}

export async function atualizarMetaLive(id: string, metaCreditos: number | null) {
  const headers = await authHeaders();
  const { data } = await api.put(`/lives/${id}/meta`, { metaCreditos }, { headers });
  return data;
}

export async function rankingLive(id: string): Promise<LiveRanking> {
  const headers = await authHeaders();
  const { data } = await api.get(`/lives/${id}/ranking`, { headers });
  return data;
}

export async function presentearLive(
  id: string,
  payload: { presenteId?: string; valorCreditos?: number; mensagem?: string }
) {
  const headers = await authHeaders();
  const { data } = await api.post(`/lives/${id}/presentear`, payload, { headers });
  return data;
}

export async function denunciarLive(id: string, motivo: string, descricao?: string) {
  const headers = await authHeaders();
  const { data } = await api.post(
    `/lives/${id}/denunciar`,
    { motivo, descricao: descricao || null },
    { headers }
  );
  return data;
}
