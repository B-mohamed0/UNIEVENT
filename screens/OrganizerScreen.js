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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function OrganizerScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "ORGANIZER" }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.user, data.token);
      } else {
        alert(data.message || "Erreur de connexion");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Erreur serveur : " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/project/est.png")}
        style={styles.background}
        resizeMode="cover"
      />

      {/* TRIANGLE BLANC */}
      <View style={styles.whiteTriangle} />

      {/* TRIANGLE DÉGRADÉ */}
      <LinearGradient
        colors={["#143287", "#6279D8"]}
        style={styles.gradientTriangle}
      />

      <View style={styles.content}>
        <Image
          source={require("../assets/project/orga.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* GLASS FORM */}
        <BlurView intensity={25} tint="light" style={styles.glassCard}>
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="votre email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="votre mot de passe"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              ref={passwordRef}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <LinearGradient
              colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>se connecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.2}
      >
        <Ionicons name="chevron-back" size={30} color="#ffffffff" />
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
    pointerEvents: "none",
    width: 300,
    height: 300,
    marginTop: -40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -9,
    },
    shadowOpacity: 1,
    alignSelf: "center",
    shadowRadius: 20,
    elevation: 8,
  },

  glassCard: {
    width: 320,
    minHeight: 250,
    borderRadius: 30,
    padding: 25,
    paddingTop: 27,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.13)",
    marginTop: -20,
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
    marginBottom: 20,
  },

  loginButton: {
    marginTop: 10,
    width: 180,
    alignSelf: "center",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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
});
