import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();  
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    // Cleanup both auth and notification listeners on unmount
    return () => {
      unsubscribeAuth(); // Unsubscribe from auth state listener
    };
  }, []); // Empty dependency array since auth and firestore are stable

  const tabScreenOptions = {
    tabBarActiveTintColor: 'black',
    headerShown: true,
    headerStyle: { backgroundColor: 'forestgreen' },
    headerShadowVisible: false,
    headerTintColor: 'white',
    tabBarStyle: { backgroundColor: 'forestgreen' },
    headerBackTitle: 'Back',
    headerBackTitleVisible: true,
    tabBarInactiveTintColor: 'white',
  };

  return (
    <Tabs
      screenOptions={ tabScreenOptions }>

     <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          tabBarLabel: 'Home',
          headerTitle: 'FoodHack',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={30} />
          ),
          href: isLoggedIn ? null : '/(tabs)', // Hide when logged in
        }}
      />

      <Tabs.Screen
        name="homepage"
        options={{
          headerShown: true,
          tabBarLabel: 'Home',
          headerTitle: 'FoodHack',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={30} />
          ),
          href: isLoggedIn ? '/homepage' : null, // Show only when logged in
        }}
      />

      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Food Analysis',
          headerTitle: 'Food Analysis',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "camera" : "camera-outline"} color={color} size={28} />
          ),
          href: !isLoggedIn ? null : '/analyze', // Hide when logged in
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu Scanner',
          headerTitle: 'Menu Scanner',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} color={color} size={28} />
          ),
          href: !isLoggedIn ? null : '/menu', // Hide when logged in
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Meals',
          headerTitle: 'My Meals',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "fast-food" : "fast-food-outline"} color={color} size={30} />
          ),
          href: !isLoggedIn ? null : '/explore', // Hide when logged in
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={30} />
          ),
          href: !isLoggedIn ? null : '/settings', // Hide when logged in
        }}
      />

    </Tabs>
  );
}