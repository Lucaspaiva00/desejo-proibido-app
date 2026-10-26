import { obterToken } from "../storage/auth";
import { api } from "./api";

export type FeedFilters = {
  q?: string;
  cidade?: string;
  estado?: string;
  genero?: string;
  idadeMin?: number;
  idadeMax?: number;
  somenteComFoto?: boolean;
  somenteVerificados?: boolean;
  ordenarPor?: "recent" | "boost" | "random";
  take?: number;
};

async function authHeader() {
  const token = await obterToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function buscarFeed(filtros: FeedFilters = {}) {
  const headers = await authHeader();

  const response = await api.get("/busca", {
    headers,
    params: filtros,
  });

  return response.data?.data || [];
}

export async function curtirUsuario(usuarioId: string) {
  const headers = await authHeader();

  const { data } = await api.post(`/curtidas/${usuarioId}`, {}, { headers });

  return data;
}

export async function pularUsuario(usuarioId: string) {
  const headers = await authHeader();

  const { data } = await api.post(`/skips/${usuarioId}`, {}, { headers });

  return data;
}

export async function bloquearUsuario(usuarioId: string) {
  const headers = await authHeader();

  const { data } = await api.post(`/bloqueios/${usuarioId}`, {}, { headers });

  return data;
}

export async function denunciarUsuario(usuarioId: string) {
  const headers = await authHeader();

  const { data } = await api.post(
    "/denuncias",
    {
      denunciadoId: usuarioId,
      motivo: "Perfil suspeito",
      descricao: "Denúncia enviada pelo aplicativo mobile",
    },
    { headers }
  );

  return data;
}
