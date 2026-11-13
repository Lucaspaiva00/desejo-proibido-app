import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FACE_ID_KEY = "dp_face_id_session";
const faceIdOptions = {
    requireAuthentication: true,
    authenticationPrompt: "Entre no Desejo Proibido com Face ID",
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function faceIdDisponivel() {
    return Platform.OS === "ios" && SecureStore.canUseBiometricAuthentication();
}

export function salvarSessaoFaceId(token: string) {
    return SecureStore.setItemAsync(FACE_ID_KEY, token, faceIdOptions);
}

export function obterSessaoFaceId() {
    return SecureStore.getItemAsync(FACE_ID_KEY, faceIdOptions);
}

export async function removerSessaoFaceId() {
    if (Platform.OS === "ios") {
        await SecureStore.deleteItemAsync(FACE_ID_KEY, faceIdOptions);
    }
}

const TOKEN_KEY = "@dp_token";

export async function salvarToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function obterToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removerToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await removerSessaoFaceId();
}