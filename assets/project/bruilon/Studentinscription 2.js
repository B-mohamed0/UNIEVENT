import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const API_BASE = "http://localhost:3000/api/auth";

export default function Studentinscription() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Anti-spam
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const passwordRef = useRef(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [cne, setCne] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const animateTransition = (nextStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      setError("");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // ✅ VALIDATIONS ET NETTOYAGE (Anti-XSS côté client)
  const validate = () => {
    // Supprimer les espaces inutiles et les balises suspectes
    const cleanNom = nom.trim().replace(/[<>]/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const cleanCne = cne.trim().toUpperCase();

    if (step === 1) {
      if (cleanNom.length < 3) {
        setError("Nom invalide.");
        return false;
      }
      setNom(cleanNom);
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError("Email non valide.");
        return false;
      }
      setEmail(cleanEmail);
    }
    if (step === 3) {
      if (!/^[A-Z][0-9]{9}$/.test(cleanCne)) {
        setError("CNE invalide (Ex: G123456789).");
        return false;
      }
      setCne(cleanCne);
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      if (step < 4) animateTransition(step + 1);
      else handleRegister();
    }
  };

  const handleRegister = async () => {
    if (isSubmitting) return; // Empêche le double-clic

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Le mot de passe doit être plus complexe.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/inscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // On envoie les données nettoyées
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          cne: cne.trim().toUpperCase(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Succès", `Bienvenue ${data.user.nom} !`);
        navigation.navigate("Home", { nom: data.user.nom, cne: data.user.cne });
      } else {
        setError(data.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      Alert.alert("Sécurité", "Erreur de connexion sécurisée au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force du mot de passe
  const strength =
    password.length === 0
      ? 0
      : password.length > 7 && /[A-Z]/.test(password) && /[0-9]/.test(password)
        ? 3
        : password.length > 5
          ? 2
          : 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ImageBackground
        source={require("../assets/project/est.png")}
        style={styles.background}
      />
      <View style={styles.whiteTriangle} />
      <LinearGradient
        colors={["#143287", "#6279D8"]}
        style={styles.gradientTriangle}
      />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={30} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Étape {step} / 4</Text>
        <Image
          source={
            showPassword
              ? require("../assets/project/boypass.png")
              : require("../assets/project/boy.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <Animated.View style={{ opacity: fadeAnim, zIndex: 1 }}>
          <BlurView intensity={40} tint="light" style={styles.glassCard}>
            {step === 1 && (
              <View>
                <Text style={styles.label}>NOM COMPLET</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    error ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    placeholder="Votre nom"
                    value={nom}
                    onChangeText={setNom}
                    style={styles.input}
                    maxLength={40}
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.label}>EMAIL</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    error ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.label}>CNE</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    error ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    placeholder="Ex: G123456789"
                    value={cne}
                    onChangeText={setCne}
                    autoCapitalize="characters"
                    style={styles.input}
                    maxLength={10}
                  />
                </View>
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={styles.label}>MOT DE PASSE</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    error ? styles.inputWrapperError : null,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#02047fff"
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    {!showPassword && (
                      <TextInput
                        ref={passwordRef}
                        placeholder="Mot de passe"
                        secureTextEntry={true}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                    )}

                    {showPassword && (
                      <TextInput
                        ref={passwordRef}
                        placeholder="Mot de passe"
                        secureTextEntry={false}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                    )}
                  </View>
                </View>
                <View style={styles.strengthRow}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor:
                          strength >= 1 ? "#ff4d4d" : "#ffffff50",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor:
                          strength >= 2 ? "#ffcc00" : "#ffffff50",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor:
                          strength >= 3 ? "#00cc66" : "#ffffff50",
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.btnRow}>
              {step > 1 && (
                <TouchableOpacity
                  onPress={() => animateTransition(step - 1)}
                  activeOpacity={0.8}
                >
                  <BlurView
                    intensity={30}
                    tint="light"
                    style={styles.glassBackBtn}
                  >
                    <Text style={styles.glassBackText}>Retour</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleNext}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={["#183282", "#4a5eaf"]}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginText}>
                    {isSubmitting
                      ? "CHARGEMENT..."
                      : step === 4
                        ? "S'inscrire"
                        : "Suivant"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate("Student")}
          >
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: { position: "absolute", width: "100%", height: "100%" },
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
    borderRightColor: "#f0f0f0ff",
  },
  gradientTriangle: {
    position: "absolute",
    right: 0,
    bottom: -150,
    width,
    height: height * 0.5,
    transform: [{ skewX: "20deg" }, { rotate: "20deg" }],
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
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

  logo: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 100,
    width: 500,
    height: 350,
    marginTop: 90,
    shadowColor: "#000",
    shadowOffset: {
      width: -10,
      height: 9,
    },
    shadowOpacity: 1,
    alignSelf: "center",
    paddingLeft: 40,
    shadowRadius: 13,
    elevation: 8,
  },

  glassCard: {
    width: 320,
    minHeight: 270,
    borderRadius: 30,
    padding: 25,
    paddingTop: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.13)",
    marginTop: 180,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "600",
    fontFamily: "Insignia",
  },

  input: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
  },

  inputWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 15,
    height: 45,
    alignItems: "center",
    paddingHorizontal: 10,
    shadowColor: "#0000005b",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 5,
  },

  stepIndicator: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 20,
    fontFamily: "Insignia",
  },
  inputWrapperError: { borderWidth: 2, borderColor: "#f45252ff" },
  eyeIcon: { marginLeft: 5 },
  errorText: {
    color: "#ff1919ff",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 10,
  },
  strengthRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bar: {
    height: 7,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    marginTop: 20,
  },
  btnRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  loginText: {
    fontSize: 18,
    color: "#ffffffff",
    fontFamily: "ALMASBold",
    alignSelf: "center",
  },
  glassBackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    fontFamily: "ALMASBold",
  },

  glassBackText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },

  nextBtn: { flex: 2.5, borderRadius: 25, overflow: "hidden" },

  loginGradient: {
    backgroundColor: "rgba(255, 255, 255, 0.31)",
    borderRadius: 30,
    paddingVertical: 10,
    alignSelf: "center",
    width: 200,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000000ff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  nextText: { color: "white", fontWeight: "bold", fontSize: 16 },
  signupButton: {
    marginTop: 50,
    backgroundColor: "rgba(255, 255, 255, 0.31)",
    borderRadius: 30,
    paddingVertical: 10,
    alignSelf: "center",
    width: 200,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000000ff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  signupText: {
    fontSize: 22,
    color: "#000",
    fontFamily: "ALMASBold",
    alignSelf: "center",
  },
});




