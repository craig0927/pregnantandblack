import React, { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";
import * as Font from "expo-font";
import { AuthProvider } from "./src/context/AuthContext";
import { ForumProvider } from "./src/context/ForumContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Poppins_400Regular: require("@expo-google-fonts/poppins/Poppins_400Regular.ttf"),
          Poppins_500Medium: require("@expo-google-fonts/poppins/Poppins_500Medium.ttf"),
          Poppins_600SemiBold: require("@expo-google-fonts/poppins/Poppins_600SemiBold.ttf"),
          Poppins_700Bold: require("@expo-google-fonts/poppins/Poppins_700Bold.ttf"),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn("Failed to load Poppins fonts:", error);
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ForumProvider>
          <AppNavigator />
        </ForumProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
