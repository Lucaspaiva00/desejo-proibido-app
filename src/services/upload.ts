import { Platform } from "react-native";
export async function uploadFotoCloudinary(
    uri: string
) {
    console.log("URI:", uri);

    const formData = new FormData();

    formData.append(
        "upload_preset",
        "desejoproibido"
    );

    formData.append(
        "folder",
        "desejoproibido"
    );

    formData.append("file", {
        uri: Platform.OS === "ios"
            ? uri.replace("file://", "")
            : uri,
        type: "image/jpeg",
        name: "foto.jpg",
    } as any);

    console.log("ENVIANDO CLOUDINARY");

    const response = await fetch(
        "https://api.cloudinary.com/v1_1/dfdinbti3/image/upload",
        {
            method: "POST",
            body: formData,
        }
    );

    console.log(
        "STATUS CLOUDINARY:",
        response.status
    );

    const data = await response.json();

    console.log(
        "RESPOSTA CLOUDINARY:",
        data
    );

    return data;
}
export async function uploadAudioCloudinary(uri: string) {
    const formData = new FormData();
    if (Platform.OS === "web") {
        const blob = await fetch(uri).then((response) => response.blob());
        const extensao = blob.type.includes("mp4") ? "mp4" : "webm";
        formData.append("file", blob, `audio.${extensao}`);
    } else {
        formData.append("file", { uri, type: "audio/mp4", name: "audio.m4a" } as any);
    }
    formData.append("upload_preset", "desejoproibido");
    formData.append("folder", "desejoproibido/chat/audios");

    const response = await fetch("https://api.cloudinary.com/v1_1/dfdinbti3/video/upload", {
        method: "POST",
        body: formData,
    });
    const data = await response.json();
    if (!response.ok || !data.public_id || !data.format) {
        throw new Error(data?.error?.message || "Falha ao carregar o áudio.");
    }
    return `${data.public_id}.${data.format}`;
}
