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

import ProfHomeScreen from "./screens/ProfHomeScreen";
import ProfEventinfo from "./screens/ProfEventinfo";
import ProfEventsscreen from "./screens/ProfEventsscreen";
import ProfStats from "./screens/ProfStats";
import ProfProfile from "./screens/ProfProfile";
import ProfEditProfile from "./screens/ProfEditProfile";
import ProfScanner from "./screens/ProfScanner";
import ProfInscription from "./screens/ProfInscription";
import ProfNotificationsScreen from "./screens/ProfNotificationsScreen";
import { NavbarProvider } from "./context/NavbarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import inscription from "./screens/inscription";
import Scanner from "./screens/Scanner";
import NotificationsScreen from "./screens/NotificationsScreen";

import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";

const Stack = createNativeStackNavigator();

function UserNotificationWrapper({ children }) {
  const { user } = useAuth();
  const studentId = user?.role === "STUDENT" ? user.id : null;
  const profId = user?.role === "PROFESSOR" ? user.id : null;
  return (
    <NotificationProvider studentId={studentId} profId={profId}>
      {children}
    </NotificationProvider>
  );
}

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
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
          ) : user?.role === "PROFESSOR" ? (
            <>
              <Stack.Screen
                name="ProfHome"
                component={ProfHomeScreen}
                initialParams={{ id: user.id, nom: user.nom }}
              />
              <Stack.Screen name="ProfEventinfo" component={ProfEventinfo} />
              <Stack.Screen name="ProfEventsscreen" component={ProfEventsscreen} />
              <Stack.Screen name="ProfStats" component={ProfStats} />
              <Stack.Screen name="ProfProfile" component={ProfProfile} />
              <Stack.Screen name="ProfEditProfile" component={ProfEditProfile} />
              <Stack.Screen name="ProfScanner" component={ProfScanner} />
              <Stack.Screen name="ProfInscription" component={ProfInscription} />
              <Stack.Screen name="ProfNotifications" component={ProfNotificationsScreen} />
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
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
            </>
          )}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
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
            <UserNotificationWrapper>
              <RootNavigator />
            </UserNotificationWrapper>
          </NavigationContainer>
        </NavbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
