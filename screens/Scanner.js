import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    Dimensions,
    Animated,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { API_URL } from "../config";

const { width, height } = Dimensions.get("window");
const SCAN_AREA_SIZE = 260;

export default function Scanner({ route, navigation }) {
    const { eventId } = route.params;
    const [permission, requestPermission] = useCameraPermissions();
    const isScanning = useRef(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [scanMessage, setScanMessage] = useState("");

    // Animations standard
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const modalFadeAnim = useRef(new Animated.Value(0)).current;
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Animation laser
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (showModal) {
            Animated.parallel([
                Animated.timing(modalFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(modalScaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            modalFadeAnim.setValue(0);
            modalScaleAnim.setValue(0.8);
        }
    }, [showModal]);

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-outline" size={80} color="#003cffff" />
                <Text style={styles.permissionText}>Accès à la caméra requis</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleScan = async ({ data }) => {
        if (isScanning.current || loading || showModal) return;

        isScanning.current = true;
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cne: data, eventId }),
            });

            const result = await response.json();

            if (response.ok || response.status === 200) {
                setStudentData(result.student);
                setScanMessage(result.message);
                setShowModal(true);
            } else {
                Alert.alert("Erreur", result.message || "Le code est invalide.", [
                    {
                        text: "OK",
                        onPress: () => {
                            setTimeout(() => {
                                isScanning.current = false;
                            }, 1000);
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error("Scan error:", error);
            Alert.alert("Erreur", "Erreur de connexion au serveur", [
                {
                    text: "OK",
                    onPress: () => {
                        setTimeout(() => {
                            isScanning.current = false;
                        }, 1000);
                    }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setStudentData(null);
        setTimeout(() => {
            isScanning.current = false;
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleScan}
            />

            <View style={styles.hudContainer}>
                <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    
                    <Animated.View style={[
                        styles.scanLine,
                        {
                            transform: [
                                {
                                    translateY: scanLineAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [10, SCAN_AREA_SIZE - 10],
                                    })
                                }
                            ]
                        }
                    ]} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.scanInstruction}>Scan Étudiant</Text>
                    <Text style={styles.scanSubtitle}>Placez le QR Code au centre</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <BlurView intensity={30} tint="light" style={styles.backButtonBlur}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </BlurView>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="none"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={{ opacity: modalFadeAnim, transform: [{ scale: modalScaleAnim }], width: "100%", alignItems: "center" }}>
                        <BlurView intensity={90} tint="dark" style={styles.modalContent}>
                            <View style={styles.profileWrapper}>
                                <View style={styles.profileCircle}>
                                    {studentData?.photo ? (
                                        <Image source={{ uri: studentData.photo }} style={styles.profileImg} />
                                    ) : (
                                        <View style={styles.profilePlaceholder}>
                                            <Ionicons name="person" size={60} color="#0033ffff" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.checkBadge}>
                                    <Ionicons name="checkmark" size={20} color="#FFF" />
                                </View>
                            </View>

                            <Text style={styles.studentName}>{studentData?.nom}</Text>
                            <Text style={styles.studentEmail}>{studentData?.email}</Text>
                            
                            <View style={[
                                styles.statusBadge, 
                                { backgroundColor: (scanMessage && scanMessage.includes('⚠️')) ? 'rgba(255, 166, 0, 0.11)' : 'rgba(76, 175, 79, 0.15)' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: (scanMessage && scanMessage.includes('⚠️')) ? '#FFA500' : '#4CAF50' }
                                ]}>
                                    {scanMessage}
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.confirmButton} onPress={handleCloseModal}>
                                <Text style={styles.confirmButtonText}>Scanner Suivant</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
    permissionText: { color: "#FFF", fontSize: 18, marginTop: 20, marginBottom: 30 },
    permissionButton: { backgroundColor: "#6279D8", paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
    permissionButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    
    maskContainer: { flex: 1 },
    maskBackground: { flex: 1, backgroundColor: "black" },
    maskRow: { flexDirection: "row", height: SCAN_AREA_SIZE },
    maskCutout: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, backgroundColor: "transparent", borderRadius: 40 },
    
    hudContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
    scanFrame: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, justifyContent: "center", alignItems: "center" },
    corner: { position: "absolute", width: 45, height: 45, borderColor: "#ffffffff", borderWidth: 5 },
    topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 35 },
    topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 35 },
    bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 35 },
    bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 35 },
    
    scanLine: {
        position: "absolute",
        top: 0,
        left: 15,
        right: 15,
        height: 3,
        backgroundColor: "#62d878ff",
        shadowColor: "#ffffffff",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 6,
        shadowRadius: 10,
        elevation: 10,
    },

    textContainer: { marginTop: 60, alignItems: "center" },
    scanInstruction: { color: "#FFF", fontSize: 24, fontWeight: "bold", letterSpacing: 1 },
    scanSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 10 },
    
    backButton: { position: "absolute", top: 50, left: 20, overflow: "hidden", borderRadius: 20, zIndex: 10 },
    backButtonBlur: { padding: 12 },
    
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
    modalContent: {
        width: width * 0.85,
        borderRadius: 40,
        padding: 30,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        overflow: "hidden",
    },
    profileWrapper: { marginBottom: 20 },
    profileCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: "#6279D8",
        backgroundColor: "rgba(255,255,255,0.1)",
        overflow: "hidden",
    },
    profileImg: { width: "100%", height: "100%" },
    profilePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#333" },
    checkBadge: {
        position: "absolute",
        bottom: 5,
        right: 5,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#6279D8",
        borderWidth: 3,
        borderColor: "#1A1A1A",
    },
    studentName: { fontSize: 26, fontWeight: "bold", color: "#FFF", textAlign: "center", marginBottom: 5 },
    studentEmail: { fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 20 },
    statusBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 30 },
    statusText: { fontWeight: "600", fontSize: 15 },
    confirmButton: {
        width: "100%",
        backgroundColor: "#6279D8",
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        elevation: 5,
    },
    confirmButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
