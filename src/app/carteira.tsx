import { Text, View } from "react-native";

export default function Carteira() {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#040205",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: "#fff",
                    fontSize: 18,
                }}
            >
                Carteira
            </Text>
        </View>
    );
}