import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Image, ImageBackground, TextInput,
  TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Animated, Alert,
  ScrollView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// 🔗 URL BACKEND (Assurez-vous que l'IP est correcte)
const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/auth`;

export default function Studentinscription() {
  const navigation = useNavigation();
  // Passage à 5 étapes : 1:Nom, 2:Email, 3:Vérification OTP, 4:CNE, 5:Password
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputsRef = useRef([]);

  // États des champs
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Pour le code à 6 chiffres
  const [cne, setCne] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const animateTransition = (nextStep) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      setError("");
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Gestion de la saisie OTP (Auto-focus)
  const handleOtpChange = (text, index) => {
    if (!/^[0-9]?$/.test(text)) return;
    if (text.length > 1) return;
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text !== "" && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  // ✅ VALIDATIONS PAR ÉTAPE
  const validate = async () => {
    if (step === 1) {
      if (nom.trim().length < 3) { setError("Nom trop court."); return false; }
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Email invalide."); return false; }
      return await handleSendOTP(); // Appelle l'envoi du mail
    }
    if (step === 3) {
      if (otp.join("").length < 6) { setError("Code incomplet."); return false; }
      return await handleVerifyOTP(); // Vérifie le code
    }
    if (step === 4) {
      if (!/^[A-Z][0-9]{9}$/.test(cne.toUpperCase())) { setError("CNE invalide (Ex: G123456789)."); return false; }
    }
    return true;
  };

  // Envoyer le code OTP via le Backend
  const handleSendOTP = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (response.ok) {
        animateTransition(3);
        return false; // On arrête handleNext car animateTransition gère le changement
      } else {
        const data = await response.json();
        setError(data.message || "Erreur d'envoi");
        return false;
      }
    } catch (err) {
      setError("Serveur injoignable");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier le code OTP via le Backend
  const handleVerifyOTP = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.join("") }),
      });
      if (response.ok) {
        animateTransition(4);
        return false;
      } else {
        setError("Code incorrect ou expiré");
        return false;
      }
    } catch (err) {
      setError("Erreur de vérification");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const isValid = await validate();
    if (isValid) {
      if (step < 5) animateTransition(step + 1);
      else handleRegister();
    }
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Mot de passe : 8 caractères, 1 Majuscule, 1 Chiffre.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/inscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, cne: cne.toUpperCase(), password }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Succès", `Bienvenue ${data.user.nom} !`);
        navigation.navigate("Home", { nom: data.user.nom, cne: data.user.cne });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = password.length === 0 ? 0 : (password.length > 7 && /[A-Z]/.test(password) && /[0-9]/.test(password)) ? 3 : (password.length > 5) ? 2 : 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => step > 1 ? animateTransition(step - 1) : navigation.goBack()}
        activeOpacity={0.2}
      >
        <Ionicons name="chevron-back" size={25} color="#fff" />
      </TouchableOpacity>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, width: "100%" }}>
          <ImageBackground source={require("../assets/project/est.png")} style={styles.background} />
          <View style={styles.whiteTriangle} />
          <LinearGradient colors={["#143287", "#6279D8"]} style={styles.gradientTriangle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Image
                source={
                  step === 3
                    ? require("../assets/project/verif.png")
                    : (step === 5 ? require("../assets/project/boypass.png") : require("../assets/project/boy.png"))
                }
                style={styles.logo}
                resizeMode="contain"
              />
              <Animated.View style={{ opacity: fadeAnim, zIndex: 1 }}>
                <Text style={styles.stepIndicator}>Étape {step} / 5</Text>
                <BlurView intensity={25} style={styles.glassCard}>

                  {step === 1 && (
                    <View>
                      <Text style={styles.label}>NOM COMPLET</Text>
                      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                        <TextInput placeholder="Votre nom" value={nom} onChangeText={setNom} style={styles.input} placeholderTextColor="#999" />
                      </View>
                    </View>
                  )}

                  {step === 2 && (
                    <View>
                      <Text style={styles.label}>EMAIL</Text>
                      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                        <TextInput placeholder="Email étudiant" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholderTextColor="#999" />
                      </View>
                    </View>
                  )}

                  {step === 3 && (
                    <View>
                      <Text style={styles.title}>Vérification</Text>
                      <Text style={styles.subtitle}>
                        Entrez le code envoyé à votre email
                      </Text>

                      <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputsRef.current[index] = ref)}
                            style={styles.otpInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={({ nativeEvent }) => {
                              if (
                                nativeEvent.key === "Backspace" &&
                                otp[index] === "" &&
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
                        onPress={handleNext}
                        disabled={isSubmitting}
                      >
                        <LinearGradient
                          colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
                          style={styles.verifyGradient}
                        >
                          <Text style={styles.verifyText}>
                            {isSubmitting ? "ATTENTE..." : "Vérifier"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleSendOTP}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.resend}>Renvoyer le code</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {step === 4 && (
                    <View>
                      <Text style={styles.label}>CNE</Text>
                      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                        <TextInput placeholder="Ex: G123456789" value={cne} onChangeText={setCne} autoCapitalize="characters" style={styles.input} placeholderTextColor="#999" />
                      </View>
                    </View>
                  )}

                  {step === 5 && (
                    <View>
                      <Text style={styles.label}>MOT DE PASSE</Text>
                      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                        <TextInput
                          placeholder="Mot de passe"
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                          style={styles.input}
                          placeholderTextColor="#999"
                          autoCapitalize="none"
                          autoCorrect={false}
                          textContentType="password"
                          autoComplete="password"
                          importantForAutofill="yes"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                          <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#143287" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.strengthRow}>
                        <View style={[styles.bar, { backgroundColor: strength >= 1 ? '#ff4d4d' : '#ffffff50' }]} />
                        <View style={[styles.bar, { backgroundColor: strength >= 2 ? '#ffcc00' : '#ffffff50' }]} />
                        <View style={[styles.bar, { backgroundColor: strength >= 3 ? '#00cc66' : '#ffffff50' }]} />
                      </View>
                    </View>
                  )}

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {step !== 3 && (
                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                        onPress={handleNext}
                        disabled={isSubmitting}
                      >
                        <LinearGradient colors={["#183282", "#4a5eaf"]} style={styles.nextGradient}>
                          <Text style={styles.nextText}>
                            {isSubmitting ? "Attente..." : (step === 2 ? "Envoyer" : step === 5 ? "S'inscrire" : "Suivant")}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </BlurView>
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

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
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },

  scrollContent: {
    flexGrow: 1,
  },

  logo: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 100,
    width: 500,
    height: 380,
    marginTop: 95,
    shadowColor: "#000",
    shadowOffset: {
      width: -10,
      height: 9,
    },
    shadowOpacity: 1,
    alignSelf: "center",
    paddingLeft: 110,
    shadowRadius: 13,
    elevation: 8,
  },

  glassCard: {
    width: 320,
    minHeight: 230,
    borderRadius: 30,
    padding: 25,
    paddingTop: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.13)",
    marginTop: 200,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "almas",
  },

  subtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  otpInput: {
    width: 38,
    height: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#143287",
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

  stepIndicator: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 20,
    fontFamily: "Insignia",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
  inputWrapper: { flexDirection: 'row', backgroundColor: "#FFF", borderRadius: 12, height: 45, alignItems: 'center', paddingHorizontal: 15 },
  inputWrapperError: { borderWidth: 2, borderColor: '#ff4d4d' },
  input: { flex: 1, paddingVertical: 10, color: "#000", fontSize: 16 },
  eyeIcon: { marginLeft: 10 },
  errorText: { color: '#ff7070', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: 'bold' },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  bar: { height: 5, flex: 1, marginHorizontal: 2, borderRadius: 10 },
  btnRow: { flexDirection: 'row', marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { width: 180, borderRadius: 26, overflow: 'hidden' },
  nextGradient: { height: 45, justifyContent: 'center', alignItems: 'center' },
  nextText: {
    fontSize: 19,
    color: "#ffffffff",
    fontFamily: "ALMASBold",
    alignSelf: "center",
  },
});