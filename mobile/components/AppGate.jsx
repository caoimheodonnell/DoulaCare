/*
  AppGate - Authentication and Role Routing Gate

  What this component does:
  - Runs once on app launch after login.
  - Checks if a user is authenticated and retrieves their role.
  - Redirects unauthenticated users to Login.
  - Redirects authenticated users to MainTabs with role-based navigation.

  Similar patterns:

  - Uses React Navigation reset() to prevent back navigation to auth screens.

  References used:
  - React useEffect (run logic on mount):
    https://react.dev/reference/react/useEffect
  - React Navigation reset action:
    https://reactnavigation.org/docs/navigation-actions/#reset
  - Supabase Auth session and user metadata:
    https://supabase.com/docs/guides/auth/auth-email
    https://supabase.com/docs/guides/auth/managing-user-data
  - React Native ActivityIndicator:
    https://reactnative.dev/docs/activityindicator
*/

// components/AppGate.jsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { getMyRole } from "../auth";

export default function AppGate({ navigation }) {
  useEffect(() => {
    let alive = true;

    // Run an async check as soon as the app loads this screen
    (async () => {
      // Ask the auth layer if the current user has a role
      // (role is stored in auth metadata)
      const role = await getMyRole();

      if (!alive) return;

        // If no role is found, the user is not properly logged in
      // Send them back to the Login screen
      if (!role) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
// If a role exists, the user is authenticated
      // Send them into the main app and pass the role along
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { role } }],
      });
    })();

    return () => {
      alive = false;
    };
  }, [navigation]);

   // While checking auth state, show a loading spinner
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}





