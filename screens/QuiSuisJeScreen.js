import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

export default function QuiSuisJeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* DÉCOR FIXE */}
      <View style={styles.backgroundLayer}>
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
      </View>

      {/* CONTENU */}
      <View style={styles.contentLayer}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/project/ESTC.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* TEXTE */}
        <Text style={styles.subtitle}>je suis un</Text>

        <BlurView intensity={20} tint="light" style={styles.glassRectangle}>
          <View style={styles.buttonsContainer}>
            {[
              { label: "étudiant", route: "Student" },
              { label: "professeur", route: "Teacher" },
              { label: "organisateur", route: "Organizer" },
              { label: "administrateur", route: "Admin" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.route)}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    pointerEvents: "none",
  },

  contentLayer: {
    flex: 1,
    zIndex: 1,
  },

  container: {
    flex: 1,
  },

  background: {
    width: "100%",
    height: "100%",
  },

  /* Triangle blanc à droite au centre */
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

  /* Triangle rectangle dégradé bas droite */
  gradientTriangle: {
    position: "absolute",
    right: 0,
    bottom: -150,
    width: width * 1,
    height: height * 0.5,

    transform: [{ skewX: "20deg" }, { rotate: "20deg" }],

    // DROP SHADOW
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  logoContainer: {
    marginTop: 50,
    marginBottom: 30,
    alignItems: "center",
    right: 15,
  },

  logo: {
    width: 280,
    height: 100,
  },

  subtitle: {
    marginTop: 30,
    marginBottom: 40,
    textAlign: "center",
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "500",
    fontFamily: "Insignia",
  },

  glassRectangle: {
    width: 310,
    height: 460,
    borderRadius: 30,
    alignSelf: "center",
    marginTop: 0,

    // OBLIGATOIRE pour le blur
    overflow: "hidden",
    // glass border léger
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  buttonsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },

  buttonWrapper: {
    width: 220,
    height: 55,
    borderRadius: 26,
    // DROP SHADOW
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },

  button: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 26,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Insignia",
  },
});
