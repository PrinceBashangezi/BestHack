import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { auth } from '../supabase';
import { onAuthStateChanged } from 'firebase/auth';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
    });
    unsubscribeAuth();
    // Cleanup listeners on unmount
    return () => {
      unsubscribeAuth();
    };
  }, []);


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
          title: 'Home',
          headerTitle: 'FoodHack',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={30} />
          ),
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
          href: !isLoggedIn ? null : '/anylyze', // Hide when logged in
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