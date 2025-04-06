import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {

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
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "camera" : "camera-outline"} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu Scanner',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "fast-food" : "fast-food-outline"} color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={30} />
          ),
        }}
      />
    </Tabs>
  );
}