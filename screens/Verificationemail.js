import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";

const { width, height } = Dimensions.get("window");

export default function Verificationemail() {
  const navigation = useNavigation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const fadeAnim = useRef(new Animated.Value(50)).current;
  const inputsRef = useRef([]);
  const route = useRoute();
  const { email, context } = route.params || {};

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  const handleVerify = () => {
    const finalCode = code.join("");

    if (finalCode.length !== 6) {
      Alert.alert("Erreur", "Entrez le code complet");
      return;
    }

    if (context === "reset-password") {
      navigation.navigate("ResetPassword", { email, otp: finalCode });
    } else {
      Alert.alert("Succès", "Code vérifié !");
      navigation.navigate("ResetPassword");
    }
  };

  const handleChange = (text, index) => {
    if (text.length > 1) return;

    let newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Aller au champ suivant si un chiffre est saisi
    if (text !== "" && index < code.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.2}
      >
        <Ionicons name="chevron-back" size={25} color="#fff" />
      </TouchableOpacity>

      <ImageBackground
        source={require("../assets/project/est.png")}
        style={styles.background}
        resizeMode="cover"
      />

      <View style={styles.whiteTriangle} />

      <LinearGradient
        colors={["#143287", "#6279D8"]}
        style={styles.gradientTriangle}
      />

      <View style={styles.content}>
        <Image
          source={require("../assets/project/verif.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <BlurView intensity={25} tint="light" style={styles.glassCard}>
          <Animated.View
            style={{
              transform: [{ translateY: fadeAnim }],
              opacity: fadeAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [1, 0],
              }),
            }}
          >
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Entrez le code envoyé à votre email
            </Text>

            <View style={styles.otpContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputsRef.current[index] = ref)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (
                      nativeEvent.key === "Backspace" &&
                      code[index] === "" &&
                      index > 0
                    ) {
                      inputsRef.current[index - 1].focus();
                    }
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
            >
              <LinearGradient
                colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
                style={styles.verifyGradient}
              >
                <Text style={styles.verifyText}>Vérifier</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton}>
              <Text style={styles.resend}>Renvoyer le code</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.29)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 50,
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  whiteTriangle: {
    position: "absolute",
    right: 0,
    top: height * 0.4,
    width: 0,
    height: 0,
    borderTopWidth: 200,
    borderBottomWidth: 300,
    borderRightWidth: 400,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#FFFFFF",
  },

  gradientTriangle: {
    position: "absolute",
    right: 0,
    bottom: -150,
    width: width,
    height: height * 0.5,
    transform: [{ skewX: "20deg" }, { rotate: "20deg" }],
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },

  logo: {
    position: "absolute",
    width: 550,
    height: 400,
    marginLeft: 120,
    zIndex: 10,
    pointerEvents: "none",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 70,
  },

  glassCard: {
    width: 320,
    height: 330,
    borderRadius: 30,
    padding: 25,
    marginTop: 230,
    backgroundColor: "rgba(0, 0, 0, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 17,
    fontFamily: "almas",
  },

  subtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 30,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  otpInput: {
    width: 40,
    height: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },

  verifyButton: {
    width: 180,
    alignSelf: "center",
    borderRadius: 26,
    overflow: "hidden",
  },

  verifyGradient: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 26,
  },

  verifyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Insignia",
  },

  resendButton: {
    backgroundColor: "rgba(255, 255, 255, 0.26)",
    marginTop: 20,
    width: 180,
    height: 45,
    alignSelf: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    shadowColor: "#000000ff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    alignContent: "center",
    justifyContent: "center",
  },

  resend: {
    textAlign: "center",
    color: "#ffffffff",
    fontSize: 15,
    fontFamily: "Insignia",
  },
});