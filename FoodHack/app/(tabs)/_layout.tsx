import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {

  const tabScreenOptions = {
    tabBarActiveTintColor: 'green ',
    headerShown: false,
    headerStyle: { backgroundColor: 'blue' },
    headerShadowVisible: false,
    headerTintColor: 'green',
    tabBarStyle: { backgroundColor: 'blue' },
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
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={30} />
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
