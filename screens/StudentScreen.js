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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";



const { width, height } = Dimensions.get("window");

/* 🔗 URL BACKEND */
const API_BASE = `${API_URL}/auth`;

export default function StudentScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = email, 2 = password
  const emailAnim = useState(new Animated.Value(0))[0];
  const passwordAnim = useState(new Animated.Value(50))[0];
  const goBackToEmail = () => {
    setStep(1);

    emailAnim.setValue(0);
    passwordAnim.setValue(50);
  };

  const goToPassword = () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }

    Animated.parallel([
      Animated.timing(emailAnim, {
        toValue: 100,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(passwordAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
    ]).start(() => {
      setStep(2);
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("USER:", data.user);
        await login(data.user, data.token);
      } else {
        Alert.alert("Erreur", data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Connexion impossible au serveur");
    }
  };
  return (
    <View style={styles.container}>
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
          source={
            password.length > 0
              ? require("../assets/project/boypass.png")
              : require("../assets/project/boy.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <BlurView
          intensity={25}
          tint="light"
          style={[styles.glassCard, step === 1 && { height: 240 }]}
        >
          {/* EMAIL INPUT */}
          {step === 1 && (
            <Animated.View
              style={{
                transform: [{ translateY: emailAnim }],
                opacity: emailAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [1, 0],
                }),
              }}
            >
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="entrez votre email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  onSubmitEditing={goToPassword}
                  blurOnSubmit={false}
                />
              </View>
            </Animated.View>
          )}

          {/* PASSWORD INPUT */}
          {step === 2 && (
            <Animated.View
              style={{
                transform: [{ translateY: passwordAnim }],
                opacity: passwordAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0],
                }),
              }}
            >
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="entrez votre password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: 25 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#000000ff"
                  />
                </TouchableOpacity>
              </View>
              {step === 2 && (
                <TouchableOpacity onPress={goBackToEmail}>
                  <Text
                    style={{
                      marginBottom: 15,
                      fontSize: 15,
                      fontWeight: "bold",
                      alignSelf: "center",
                      color: "#ffffffff",
                      paddingright: 10,
                    }}
                  >
                    ← Modifier l'email
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={step === 1 ? goToPassword : handleLogin}
          >
            <LinearGradient
              colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>
                {step === 1 ? "Suivant" : "Se connecter"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {step === 2 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgot}>forget password ?</Text>
            </TouchableOpacity>
          )}
        </BlurView>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate("Studentinscription")}
        >
          <Text style={styles.signupText}>sign up</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.2}
      >
        <Ionicons name="chevron-back" size={25} color="#ffffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 3,
    shadowRadius: 10,
    zIndex: 50,

    elevation: 8,
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
  /////////////////////////////////////////
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },

  logo: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 100,
    width: 600,
    height: 400,
    marginTop: 70,
    shadowColor: "#000",
    shadowOffset: {
      width: -10,
      height: 9,
    },
    shadowOpacity: 1,
    alignSelf: "center",
    paddingLeft: 130,
    shadowRadius: 13,
    elevation: 8,
  },

  glassCard: {
    width: 320,
    height: 300,
    borderRadius: 30,
    padding: 25,
    paddingTop: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.13)",
    marginTop: 230,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "600",
    fontFamily: "Insignia",
  },

  input: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
  },

  loginButton: {
    marginTop: 10,
    width: 180,
    alignSelf: "center",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
  },

  loginGradient: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 26,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Insignia",
  },

  forgot: {
    marginTop: 25,
    textAlign: "center",
    color: "#4d7ab8ff",
    fontSize: 14,
    fontFamily: "HeyComic",
  },

  signupButton: {
    marginTop: 70,
    backgroundColor: "rgba(255, 255, 255, 0.26)",
    borderRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    shadowColor: "#000000ff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },

  signupText: {
    fontSize: 22,
    color: "#ffffffff",
    fontFamily: "ALMASBold",
  },
});
