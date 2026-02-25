import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
    View,
    Text,
    Alert,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Scanner({ route, navigation }) {
    const { eventId } = route.params;
    const [permission, requestPermission] = useCameraPermissions();
    const isScanning = useRef(false);
    const [loading, setLoading] = useState(false);

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text>Permission caméra requise</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text style={{ color: "blue", marginTop: 10 }}>
                        Autoriser
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleScan = async ({ data }) => {
        if (isScanning.current || loading) return;

        isScanning.current = true;
        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/scan`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cne: data,
                        eventId,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok) {
                Alert.alert("Succès", "Présence validée ✅", [
                    { text: "OK", onPress: () => { isScanning.current = false; } }
                ]);
            } else {
                Alert.alert("Erreur", result.message || "Erreur lors du scan", [
                    { text: "OK", onPress: () => { isScanning.current = false; } }
                ]);
            }
        } catch (error) {
            console.error("Scan error:", error);
            Alert.alert("Erreur", "Serveur injoignable", [
                { text: "OK", onPress: () => { isScanning.current = false; } }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleScan}
            />

            {/* Overlay professionnel */}
            <View style={styles.overlay}>
                <View style={styles.scanArea} />
                <Text style={styles.scanText}>
                    Placez le QR code dans le cadre
                </Text>
            </View>

            {/* Bouton fermer */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: "#00FF00",
        borderRadius: 20,
    },
    scanText: {
        color: "#FFF",
        marginTop: 20,
        fontSize: 16,
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 10,
        borderRadius: 50,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});