import "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";

export default function Layout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#040205",
        },
        headerTintColor: "#fff",
        headerTitle: "Desejo Proibido",

        drawerStyle: {
          backgroundColor: "#0B0507",
        },

        drawerLabelStyle: {
          color: "#fff",
          fontSize: 16,
        },

        sceneStyle: {
          backgroundColor: "#040205",
        },
      }}
    >

      <Drawer.Screen
        name="perfil"
        options={{
          title: "Perfil",
        }}
      />

      <Drawer.Screen
        name="feed"
        options={{
          title: "Feed",
        }}
      />

      <Drawer.Screen
        name="fotos"
        options={{
          title: "Fotos",
        }}
      />

      <Drawer.Screen
        name="matches"
        options={{
          title: "Matches",
        }}
      />

      <Drawer.Screen
        name="chat"
        options={{
          title: "Chat",
        }}
      />
      <Drawer.Screen
        name="bloqueados"
        options={{
          title: "Bloqueados",
        }}
      />

      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: {
            display: "none",
          },
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="home"
        options={{
          drawerItemStyle: {
            display: "none",
          },
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="explore"
        options={{
          drawerItemStyle: {
            display: "none",
          },
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="cadastro"
        options={{
          drawerItemStyle: {
            display: "none",
          },
          headerShown: false,
        }}
      />

    </Drawer>
  );
}