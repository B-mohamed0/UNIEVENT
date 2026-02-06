import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";

import SplashScreen from "./screens/SplashScreen";
import QuiSuisJeScreen from "./screens/QuiSuisJeScreen";
import StudentScreen from "./screens/StudentScreen";
import TeacherScreen from "./screens/TeacherScreen";
import OrganizerScreen from "./screens/OrganizerScreen";
import AdminScreen from "./screens/AdminScreen";
import Studentinscription from "./screens/Studentinscription";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Lobster: require("./fonts/Lobster.ttf"),
    Comicy: require("./fonts/Comicy.ttf"),
    HeyComic: require("./fonts/Hey Comic.otf"),
    Insignia: require("./fonts/Insignia Regular.otf"),
    ALMASBold: require("./fonts/ALMAS-Bold.ttf"),
  });

  // attendre que la font soit chargée
  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="QuiSuisJe" component={QuiSuisJeScreen} />
        <Stack.Screen name="Student" component={StudentScreen} />
        <Stack.Screen name="Teacher" component={TeacherScreen} />
        <Stack.Screen name="Organizer" component={OrganizerScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Studentinscription" component={Studentinscription} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
