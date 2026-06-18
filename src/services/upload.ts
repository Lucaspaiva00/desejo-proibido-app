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