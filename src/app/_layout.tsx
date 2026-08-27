import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";

export default function Layout() {
  useRealtimeNotifications();

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#080407" },
        headerTintColor: "#fff",
        headerTitle: "Desejo Proibido",
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: "#0B0507" },
        drawerActiveBackgroundColor: "#E21D3D",
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#D7C9CE",
        drawerLabelStyle: { fontSize: 15, fontWeight: "700" },
        sceneStyle: { backgroundColor: "#050205" },
      }}
    >
      <Drawer.Screen name="feed" options={{ title: "Descobrir" }} />
      <Drawer.Screen name="lives" options={{ title: "🔴 Lives" }} />
      <Drawer.Screen name="matches" options={{ title: "Matches" }} />
      <Drawer.Screen name="conversas" options={{ title: "Conversas" }} />
      <Drawer.Screen name="perfil" options={{ title: "Perfil" }} />
      <Drawer.Screen name="fotos" options={{ title: "Fotos" }} />
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
