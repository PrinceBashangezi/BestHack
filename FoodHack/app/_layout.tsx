import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const stackScreenOptions = {

  };

  return (
      <Stack>
        <Stack.Screen name="(tabs)" 
        options={{ 
          headerShown: false}} />

        <Stack.Screen name="about" 
        options= {{ 
          title: "About FoodHack", 
          headerBackTitle: 'Back', // Customize the back button title
          headerTintColor: 'white', // Set the back button color to black
          headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
          }}/>

        <Stack.Screen name="contact" 
        options= {{
          title: "Contact Us",
          headerBackTitle: 'Back', // Customize the back button title
          headerTintColor: 'white', // Set the back button color to black
          headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
          }}/>

        <Stack.Screen name="privacy-policy" 
        options= {{
          title: "Privacy Policy",
          headerBackTitle: 'Back', // Customize the back button title
          headerTintColor: 'white', // Set the back button color to black
          headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
         }}/>

        <Stack.Screen name="terms_of_services" 
        options= {{
          title: "Terms of Service",
          headerBackTitle: 'Back', // Customize the back button title
          headerTintColor: 'white', // Set the back button color to black
          headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
          }}/>

        <Stack.Screen name="faq" 
        options= {{
          title: "FAQ",
          headerBackTitle: 'Back', // Customize the back button title
          headerTintColor: 'white', // Set the back button color to black
          headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
          }}/>
      </Stack>  
  );
}
