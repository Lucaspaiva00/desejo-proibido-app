import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@dp_token";

export async function salvarToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function obterToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removerToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
}