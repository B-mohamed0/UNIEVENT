import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function BackButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={25} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 28,
    backgroundColor: "rgba(173, 173, 173, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 5,
    shadowRadius: 10,
    zIndex: 50,
    elevation: 8,
  },
});
