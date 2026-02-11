import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";

const API_BASE = "http://192.168.1.2:3000";

export default function HomeScreen({ route, navigation }) {
  const { nom,cne } = route.params; // valeur envoyée par l'écran précédent

  const [userNom, setUserNom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/${nom}`)
      .then((res) => res.json())
      .then((data) => {
        setUserNom(data.nom);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4c6ef5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>Bonjour 👋</Text>
      <Text style={styles.name}>{nom}</Text>
      <Text style={styles.email}>{cne}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hello: {
    fontSize: 22,
    fontWeight: "600",
  },
  name: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 10,
  },
  email: {
    marginTop: 10,
    fontSize: 14,
    color: "gray",
  },
});
