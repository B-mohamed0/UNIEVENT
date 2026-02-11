import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Image, ImageBackground, TextInput,
  TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Animated, Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const API_BASE = "http://192.168.1.2:3000/api/auth";

export default function Studentinscription() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Anti-spam
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
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

  // ✅ VALIDATIONS ET NETTOYAGE (Anti-XSS côté client)
  const validate = () => {
    // Supprimer les espaces inutiles et les balises suspectes
    const cleanNom = nom.trim().replace(/[<>]/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const cleanCne = cne.trim().toUpperCase();

    if (step === 1) {
      if (cleanNom.length < 3) { setError("Nom invalide."); return false; }
      setNom(cleanNom);
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Email non valide."); return false; }
      setEmail(cleanEmail);
    }
    if (step === 3) {
      if (!/^[A-Z][0-9]{9}$/.test(cleanCne)) { setError("CNE invalide (Ex: G123456789)."); return false; }
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
          "Accept": "application/json"
        },
        // On envoie les données nettoyées
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          cne: cne.trim().toUpperCase(),
          password
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
  const strength = password.length === 0 ? 0 : (password.length > 7 && /[A-Z]/.test(password) && /[0-9]/.test(password)) ? 3 : (password.length > 5) ? 2 : 1;

  return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ImageBackground source={require("../assets/project/est.png")} style={styles.background} />
        <View style={styles.whiteTriangle} />
        <LinearGradient colors={["#143287", "#6279D8"]} style={styles.gradientTriangle} />

        <View style={styles.content}>
          <Image source={require("../assets/project/boy.png")} style={styles.logo} resizeMode="contain" />

          <Animated.View style={{ opacity: fadeAnim, zIndex: 1 }}>
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <Text style={styles.stepIndicator}>Étape {step} / 4</Text>

              {step === 1 && (
                  <View>
                    <Text style={styles.label}>NOM COMPLET</Text>
                    <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                      <TextInput placeholder="Votre nom" value={nom} onChangeText={setNom} style={styles.input} maxLength={40} />
                    </View>
                  </View>
              )}

              {step === 2 && (
                  <View>
                    <Text style={styles.label}>EMAIL</Text>
                    <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                      <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                    </View>
                  </View>
              )}

              {step === 3 && (
                  <View>
                    <Text style={styles.label}>CNE</Text>
                    <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                      <TextInput placeholder="Ex: G123456789" value={cne} onChangeText={setCne} autoCapitalize="characters" style={styles.input} maxLength={10} />
                    </View>
                  </View>
              )}

              {step === 4 && (
                  <View>
                    <Text style={styles.label}>MOT DE PASSE</Text>
                    <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                      <TextInput placeholder="Mot de passe" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} />
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

              <View style={styles.btnRow}>
                {step > 1 && (
                    <TouchableOpacity onPress={() => animateTransition(step - 1)} style={styles.backBtn}>
                      <Text style={styles.backBtnText}>RETOUR</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleNext}
                    disabled={isSubmitting}
                >
                  <LinearGradient colors={["#183282", "#4a5eaf"]} style={styles.nextGradient}>
                    <Text style={styles.nextText}>{isSubmitting ? "CHARGEMENT..." : (step === 4 ? "S'INSCRIRE" : "SUIVANT")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: { position: "absolute", width: "100%", height: "100%" },
  whiteTriangle: { position: "absolute", right: 0, top: height * 0.4, width: 0, height: 0, borderTopWidth: 200, borderBottomWidth: 300, borderRightWidth: 400, borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: "#FFFFFF" },
  gradientTriangle: { position: "absolute", right: 0, bottom: -150, width, height: height * 0.5, transform: [{ skewX: "20deg" }, { rotate: "20deg" }] },
  content: { flex: 1, alignItems: "center", justifyContent: 'center' },
  logo: { width: 290, height: 290, marginBottom: -130, zIndex: 10 },
  glassCard: { width: 350, borderRadius: 45, padding: 28, paddingTop: 85, backgroundColor: "rgba(255, 255, 255, 0.12)", borderWidth: 1.2, borderColor: "rgba(255,255,255,0.35)", elevation: 20, overflow: 'hidden' },
  stepIndicator: { color: "white", fontSize: 16, fontWeight: "bold", textAlign: 'center', marginBottom: 20, opacity: 0.8 },
  label: { color: "#FFF", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', backgroundColor: "#FFF", borderRadius: 15, height: 52, alignItems: 'center', paddingHorizontal: 15 },
  inputWrapperError: { borderWidth: 2, borderColor: '#ff4d4d' },
  input: { flex: 1, height: "100%", color: "#000", fontSize: 15 },
  eyeIcon: { marginLeft: 10 },
  errorText: { color: '#ff7070', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: 'bold' },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  bar: { height: 5, flex: 1, marginHorizontal: 2, borderRadius: 10 },
  btnRow: { flexDirection: 'row', marginTop: 30, justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flex: 1, alignItems: 'center' },
  backBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13, opacity: 0.7 },
  nextBtn: { flex: 2.5, borderRadius: 22, overflow: 'hidden' },
  nextGradient: { height: 50, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});