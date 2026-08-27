import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

let configurado = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configurarNotificacoesLocais() {
  if (configurado) return;
  configurado = true;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("desejo-proibido", {
      name: "Desejo Proibido",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  const atual = await Notifications.getPermissionsAsync();
  if (atual.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

export async function notificarLocal(titulo: string, corpo: string, data?: Record<string, any>) {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo, data: data || {} },
    trigger: null,
  });
}
