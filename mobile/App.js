/*
  DoulaCare — App.js
  - Uses React Navigation with a custom header (NavBarMobile)
  - Screen is UsersMobile (list + add + filtering)
  - Axios base config lives in mobile/api.js
*/

// App.js
import "react-native-gesture-handler";
import * as React from "react";
import { Image, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./components/HomeScreen";
import UsersMobile from "./components/UsersMobile";
import AddUserFormMobile from "./components/AddUserFormMobile";
import DoulaDetails from "./components/DoulaDetails";
import BookingScreen from "./components/BookingScreen";

//  use the helper you created
import { LOGO_URL, BASE_URL } from "./logoUrl";


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

function DoulasStackInline() {
  return (
    <Stack.Navigator
      initialRouteName="Browse"
      //  This applies to ALL screens in this stack
      screenOptions={({ navigation }) => ({
        headerTitle: "",
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate("Home")}
            style={{ paddingHorizontal: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
          >
            <Image
              source={{ uri: LOGO_URL }}   // e.g. http://localhost:8000/static/images/doulacare-logo.png
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ),
      })}
    >
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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      {/* We keep the tab header hidden, and show headers from the nested stack */}
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Doulas"
          component={DoulasStackInline}
          options={{ unmountOnBlur: true }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
