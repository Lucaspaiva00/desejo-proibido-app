import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../services/api";
import { salvarToken } from "../storage/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function entrar() {
    try {
      const { data } = await api.post("/auth/login", {
        email,
        senha,
      });

      await salvarToken(data.token);

      router.replace("/home");
    } catch (error: any) {
      console.log("STATUS:", error?.response?.status);
      console.log("DATA:", error?.response?.data);
      console.log("ERROR:", error?.message);

      Alert.alert(
        "Erro",
        JSON.stringify(error?.response?.data || error?.message)
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Desejo Proibido</Text>

      <TextInput
        placeholder="E-mail"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#999"
        secureTextEntry
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.button} onPress={entrar}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/cadastro")}>
        <Text style={styles.link}>
          Não possui conta? Cadastre-se
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    padding: 24,
  },

  logo: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
  },

  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#ff3366",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  link: {
    color: "#ff3366",
    textAlign: "center",
    marginTop: 20,
  },
});