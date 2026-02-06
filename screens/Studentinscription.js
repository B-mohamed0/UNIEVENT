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

const { width, height } = Dimensions.get("window");

export default function Studentinscription() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.2}
      >
        <Ionicons name="chevron-back" size={30} color="#ffffffff" />
      </TouchableOpacity>
      {/* BACKGROUND */}
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

      {/* CONTENU */}
      <View style={styles.content}>
        {/* LOGO */}
        <Image
          source={require("../assets/project/boy.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* GLASS FORM */}
        <BlurView intensity={25} tint="light" style={styles.glassCard}>
          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="username"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="user name"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.loginButton}>
            <LinearGradient
              colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>s'inscrire</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgot}>forget password ?</Text>
          </TouchableOpacity>
        </BlurView>

        {/* SIGN UP */}
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupText}>sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backButton: {
    position: "absolute",
    top: 50, // ajuste si besoin
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.29)", // effet glass
    justifyContent: "center",
    alignItems: "center",
    // ombre (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 3,
    shadowRadius: 10,

    // ombre Android
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
    width: 550,
    height: 400,
    marginTop: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 1,
    alignSelf: "center",
    paddingLeft: 50,
    shadowRadius: 8.65,
    elevation: 8,
  },

  glassCard: {
    width: 320,
    height: 360,
    borderRadius: 30,
    padding: 25,
    paddingTop: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginTop: 230,
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
  marginBottom: 30,
},

  loginButton: {
    marginTop: 10,
    width: 180, // 👈 largeur plus petite
    alignSelf: "center", // 👈 centré horizontalement
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

  forgot: {
    marginTop: 25,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "HeyComic",
  },

  signupButton: {
    marginTop: 40,
    backgroundColor: "#E6E6E6",
    borderRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 10,
  },

  signupText: {
    fontSize: 22,
    color: "#000",
    fontFamily: "ALMASBold",
  },



});
