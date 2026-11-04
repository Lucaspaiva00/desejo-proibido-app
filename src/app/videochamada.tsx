import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Videochamada() {
  const params = useLocalSearchParams<{ conversaId?: string }>();
  const conversaId = params.conversaId ? String(params.conversaId) : "";

  function voltar() {
    if (conversaId) {
      router.replace(`/chat?conversaId=${conversaId}`);
      return;
    }
    router.replace("/conversas");
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.glow} />

      <Text style={styles.kicker}>DESEJO PROIBIDO</Text>
      <Text style={styles.title}>Videochamada</Text>
      <Text style={styles.text}>
        A interface de vídeo está sendo preparada. Nenhuma cobrança é iniciada nesta tela.
      </Text>

      <Pressable onPress={voltar} style={styles.button}>
        <Text style={styles.buttonText}>Voltar para a conversa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020202",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(151,0,23,0.18)",
  },
  kicker: {
    color: "#E8BE5A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },
  title: {
    color: "#FFF",
    fontSize: 33,
    fontWeight: "800",
    marginTop: 10,
  },
  text: {
    color: "#A39A94",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
    maxWidth: 330,
  },
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#A8071C",
    borderWidth: 1,
    borderColor: "#E8BE5A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    marginTop: 24,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
