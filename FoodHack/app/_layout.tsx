import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
      <Stack>
        <Stack.Screen name="(tabs)" 
          options={{ 
            headerShown: false}} 
        />
        <Stack.Screen name="about" 
          options= {{ 
            title: "About FoodHack", 
            headerBackTitle: 'Back', // Customize the back button title
            headerTintColor: 'white', // Set the back button color to black
            headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
            }}
          />

        <Stack.Screen name="contact" 
          options= {{
            title: "Contact Us",
            headerBackTitle: 'Back', // Customize the back button title
            headerTintColor: 'white', // Set the back button color to black
            headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
            }}
          />

        <Stack.Screen name="faq" 
          options= {{
            title: "FAQ",
            headerBackTitle: 'Back', // Customize the back button title
            headerTintColor: 'white', // Set the back button color to black
            headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
            }}
          />

        <Stack.Screen name="privacy_policy" 
          options= {{
            title: "Privacy Policy",
            headerBackTitle: 'Back', // Customize the back button title
            headerTintColor: 'white', // Set the back button color to black
            headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
          }}
         />

        <Stack.Screen name="terms_of_service" 
          options= {{
            title: "Terms of Service",
            headerBackTitle: 'Back', // Customize the back button title
            headerTintColor: 'white', // Set the back button color to black
            headerStyle: { backgroundColor: 'forestgreen' }, // Set the header background color
            }}
          />
      </Stack>  
  );
}
