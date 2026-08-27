import { usePathname } from "expo-router";
import { useEffect } from "react";
import { configurarNotificacoesLocais, notificarLocal } from "../services/notificacoes";
import { getRealtimeSocket } from "../services/liveSocket";

export function useRealtimeNotifications() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/" || pathname === "/cadastro") return;

    let mounted = true;
    let socket: any;

    const creatorStatus = (payload: any) => {
      const status = String(payload?.status || "");
      if (!status) return;
      notificarLocal("Conta de criadora", `Seu status foi atualizado para ${status}.`);
    };

    const payout = (payload: any) => {
      const status = String(payload?.status || "");
      if (!status) return;
      notificarLocal("Saque atualizado", `Seu saque agora está como ${status}.`);
    };

    (async () => {
      try {
        await configurarNotificacoesLocais();
        socket = await getRealtimeSocket();
        if (!mounted) return;
        socket.on("creator:status", creatorStatus);
        socket.on("creator:payout:update", payout);
      } catch (e) {
        console.log("Notificações realtime indisponíveis:", e);
      }
    })();

    return () => {
      mounted = false;
      socket?.off("creator:status", creatorStatus);
      socket?.off("creator:payout:update", payout);
    };
  }, [pathname]);
}
