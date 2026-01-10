/*
  (mobile/App.js) — Navigation overview for Doula App (Expo + FastAPI)

  - Combines Bottom Tabs (Home, Doulas) with a nested Stack Navigator for deeper screens.
  - "Doulas" tab contains:
      - Browse (list and filters)
      - Details (individual doula profile)
      - AddBooking (consultation booking form)
      - AddDoula (add new doula form)
  - When tapping the Doulas tab again, it auto-resets to the main Browse screen.
  - Each sub-screen is unmounted or retained based on navigation context.
  - FastAPI backend serves static files and APIs; Expo uses LAN IP as PUBLIC_BASE for compatibility.

  References:
    - React Navigation Docs: https://reactnavigation.org/docs/getting-started
    - Stack Navigator and tab screen: https://www.youtube.com/watch?v=s7ackFpN-GU
    - Icons for bottom navigation - https://www.youtube.com/watch?v=AnjyzruZ36E
*/
import "react-native-gesture-handler";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// --- Auth gate + login ---
import AppGate from "./components/AppGate";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";


// --- Homes (role based) ---
import HomeScreen from "./components/HomeScreen";   // Mother home (your original)
import HomeDoula from "./components/HomeDoula";     // Doula home

// --- Your existing screens ---
import UsersMobile from "./components/UsersMobile";
import AddUserFormMobile from "./components/AddUserFormMobile";
import DoulaDetails from "./components/DoulaDetails";
import BookingScreen from "./components/BookingScreen";
import MyBookingsScreen from "./components/MyBookingsScreen";
import MotherBookingsScreen from "./components/MotherBookingsScreen";
import ChatScreen from "./components/ChatScreen";
import HelpScreen from "./components/HelpScreen";
import PostpartumTipsScreen from "./components/PostpartumTipsScreen";
import LeaveReview from "./components/LeaveReview";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Root = createNativeStackNavigator();

/**
 * Stack inside the Doulas tab
 */
function DoulasStackScreen() {
  return (
    <Stack.Navigator initialRouteName="Browse">
      <Stack.Screen
        name="Browse"
        component={UsersMobile}
        options={{ title: "Browse Doulas" }}
      />
      <Stack.Screen
        name="Details"
        component={DoulaDetails}
        options={{ title: "Doula" }}
      />
      <Stack.Screen
        name="AddBooking"
        component={BookingScreen}
        options={{ title: "Book Consultation" }}
      />
      <Stack.Screen
        name="AddDoula"
        component={AddUserFormMobile}
        options={{ title: "Add Doula", unmountOnBlur: true }}
      />

      <Stack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: "My Bookings" }}
      />
      <Stack.Screen
        name="MotherBookings"
        component={MotherBookingsScreen}
        options={{ title: "My Bookings" }}
      />

      <Stack.Screen
        name="CommunityChat"
        component={ChatScreen}
        options={{ title: "Community Chat" }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ title: "Helplines & Support" }}
      />
      <Stack.Screen
        name="PostpartumTips"
        component={PostpartumTipsScreen}
        options={{ title: "Postpartum Tips" }}
      />

      <Stack.Screen
        name="LeaveReview"
        component={LeaveReview}
        options={{ title: "Leave a Review" }}
      />
    </Stack.Navigator>
  );
}

/**
 * Bottom tabs AFTER login
 * - Home tab is role-based: MotherHome vs DoulaHome
 */
function MainTabs({ route }) {
  const role = route?.params?.role; // "mother" | "doula"
  const HomeComponent = role === "doula" ? HomeDoula : HomeScreen;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          if (route.name === "Doulas") iconName = focused ? "people" : "people-outline";
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: "#8C6A86",
        tabBarInactiveTintColor: "#C2B4BE",
        tabBarStyle: {
          backgroundColor: "#FFF",
          height: 60,
          paddingTop: 6,
          paddingBottom: 6,
        },
      })}
      backBehavior="initialRoute"
    >
      <Tab.Screen
        name="Home"
        component={HomeComponent}
        initialParams={{ role }}
      />

      <Tab.Screen
        name="Doulas"
        component={DoulasStackScreen}
        options={{ unmountOnBlur: false }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("Doulas", { screen: "Browse" });
          },
        })}
      />
    </Tab.Navigator>
  );
}


/**
 * Root navigator:
 * AppGate -> Login -> MainTabs
 */
export default function App() {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
  <Root.Screen name="AppGate" component={AppGate} />
  <Root.Screen name="Login" component={LoginScreen} />
  <Root.Screen name="Register" component={RegisterScreen} />
  <Root.Screen name="MainTabs" component={MainTabs} />
</Root.Navigator>

    </NavigationContainer>
  );
}
