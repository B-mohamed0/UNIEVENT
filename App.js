import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";

import SplashScreen from "./screens/SplashScreen";
import QuiSuisJeScreen from "./screens/QuiSuisJeScreen";
import StudentScreen from "./screens/StudentScreen";
import TeacherScreen from "./screens/TeacherScreen";
import OrganizerScreen from "./screens/OrganizerScreen";
import AdminScreen from "./screens/AdminScreen";
import Studentinscription from "./screens/Studentinscription";
import HomeScreen from "./screens/HomeScreen";
import Verificationemail from "./screens/Verificationemail";
import Eventsscreen from "./screens/Eventsscreen";
import Eventinfo from "./screens/Eventinfo";
import OrganizerDashboard from "./screens/OrganizerDashboard";
import OrganizerEvents from "./screens/OrganizerEvents";
import CreateEvent from "./screens/CreateEvent";
import ManageEvent from "./screens/ManageEvent";
import OrganizerEventDetails from "./screens/OrganizerEventDetails";
import OrganizerStats from "./screens/OrganizerStats";
import OrganizerProfile from "./screens/OrganizerProfile";
import StudentStats from "./screens/StudentStats";
import StudentProfile from "./screens/StudentProfile";
import EditProfile from "./screens/EditProfile";
import { NavbarProvider } from "./context/NavbarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import inscription from "./screens/inscription";
import Scanner from "./screens/Scanner";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172aff" }}>
        <ActivityIndicator size="large" color="#143287" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {!token ? (
        // Auth Stack
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="QuiSuisJe" component={QuiSuisJeScreen} />
          <Stack.Screen name="Student" component={StudentScreen} />
          <Stack.Screen name="Teacher" component={TeacherScreen} />
          <Stack.Screen name="Organizer" component={OrganizerScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Studentinscription" component={Studentinscription} />
          <Stack.Screen name="Verificationemail" component={Verificationemail} />
          <Stack.Screen name="inscription" component={inscription} />
        </>
      ) : (
        // App Stack
        <>
          {user?.role === "ORGANIZER" ? (
            <>
              <Stack.Screen
                name="OrganizerDashboard"
                component={OrganizerDashboard}
                initialParams={{ id: user.id, nom: user.nom }}
              />
              <Stack.Screen name="OrganizerEvents" component={OrganizerEvents} />
              <Stack.Screen name="CreateEvent" component={CreateEvent} />
              <Stack.Screen name="ManageEvent" component={ManageEvent} options={{ headerShown: false }} />
              <Stack.Screen name="OrganizerEventDetails" component={OrganizerEventDetails} options={{ headerShown: false }} />
              <Stack.Screen name="Scanner" component={Scanner} />
              <Stack.Screen name="OrganizerStats" component={OrganizerStats} />
              <Stack.Screen name="OrganizerProfile" component={OrganizerProfile} />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                initialParams={{ id: user.id, nom: user.nom }}
              />
              <Stack.Screen name="Eventinfo" component={Eventinfo} />
              <Stack.Screen name="Eventsscreen" component={Eventsscreen} />
              <Stack.Screen name="StudentStats" component={StudentStats} />
              <Stack.Screen name="StudentProfile" component={StudentProfile} />
              <Stack.Screen name="EditProfile" component={EditProfile} />
              <Stack.Screen name="Scanner" component={Scanner} />
              <Stack.Screen name="inscription" component={inscription} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Lobster: require("./fonts/Lobster.ttf"),
    Comicy: require("./fonts/Comicy.ttf"),
    HeyComic: require("./fonts/Hey Comic.otf"),
    Insignia: require("./fonts/Insignia Regular.otf"),
    ALMASBold: require("./fonts/ALMAS-Bold.ttf"),
    araalm: require("./fonts/AraAlmBon-Regular.otf"),
    jokeyone: require("./fonts/JockeyOne-Regular.ttf"),
    babyu: require("./fonts/BABYU.ttf"),
    daretro: require("./fonts/Daretro Mandra.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavbarProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </NavbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
