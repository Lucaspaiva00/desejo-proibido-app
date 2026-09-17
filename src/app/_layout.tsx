import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import { DP } from "../constants/dp-theme";
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";

export default function Layout() {
  useRealtimeNotifications();

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: DP.colors.backgroundSoft },
        headerTintColor: DP.colors.text,
        headerTitle: "Desejo Proibido",
        headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: DP.colors.backgroundSoft, width: 310 },
        drawerActiveBackgroundColor: DP.colors.primarySoft,
        drawerActiveTintColor: DP.colors.primary,
        drawerInactiveTintColor: DP.colors.textSoft,
        drawerLabelStyle: { fontSize: 14, fontWeight: "800", marginLeft: -4 },
        drawerItemStyle: { borderRadius: 16, marginHorizontal: 10, marginVertical: 3 },
        sceneStyle: { backgroundColor: DP.colors.background },
        overlayColor: "rgba(0,0,0,0.55)",
      }}
    >
      <Drawer.Screen name="feed" options={{ title: "Descobrir" }} />
      <Drawer.Screen name="lives" options={{ title: "Lives" }} />
      <Drawer.Screen name="matches" options={{ title: "Matches" }} />
      <Drawer.Screen name="conversas" options={{ title: "Conversas" }} />
      <Drawer.Screen name="perfil" options={{ title: "Meu perfil" }} />
      <Drawer.Screen name="fotos" options={{ title: "Minhas fotos" }} />
      <Drawer.Screen name="carteira" options={{ title: "Carteira" }} />
      <Drawer.Screen name="creditos" options={{ title: "Comprar créditos" }} />
      <Drawer.Screen name="criadora" options={{ title: "Área da Criadora" }} />
      <Drawer.Screen name="bloqueados" options={{ title: "Bloqueados" }} />

      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
      <Drawer.Screen name="home" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
      <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
      <Drawer.Screen name="cadastro" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
      <Drawer.Screen name="usuario" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
      <Drawer.Screen name="chat" options={{ drawerItemStyle: { display: "none" }, title: "Chat" }} />
      <Drawer.Screen name="videochamada" options={{ drawerItemStyle: { display: "none" }, title: "Videochamada" }} />
      <Drawer.Screen name="transmitir" options={{ drawerItemStyle: { display: "none" }, title: "Transmitir ao vivo" }} />
      <Drawer.Screen name="live/[id]" options={{ drawerItemStyle: { display: "none" }, title: "Ao vivo" }} />
    </Drawer>
  );
}
