import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, SectionList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import useRouter from 'expo-router';
import { supabase } from '../supabase'; // Import Supabase client

interface SettingItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  action?: () => void;
  isCollapsable?: boolean;
  content?: React.ReactNode;
}

interface SettingSection {
  title: string;
  data: SettingItem[];
}

export default function SettingsScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      const user = supabase.auth.user();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching username:", error);
          setUsername('Guest');
        } else {
          setUsername(data?.username || 'Guest');
        }
      }
    };

    fetchUsername();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Error", "There was an issue logging you out. Please try again.");
      } else {
        Alert.alert("Success", "You have been logged out.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    const user = supabase.auth.user();
    if (!user) return;

    Alert.alert(
      "Delete Account",
      "Deleting your account will erase all your data permanently. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

              if (fetchError) {
                Alert.alert("Error", "Failed to fetch user data. Please try again.");
                return;
              }

              const { error: deleteError } = await supabase
                .from('formerUsers')
                .insert(data);

              if (deleteError) {
                Alert.alert("Error", "Failed to archive user data. Please try again.");
                return;
              }

              const { error: removeError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

              if (removeError) {
                Alert.alert("Error", "Failed to delete user data. Please try again.");
                return;
              }

              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) {
                Alert.alert("Error", "Failed to log out after account deletion.");
              }

              const keysToRemove = [
                "expoPushToken",
                "isVerified",
              ];
              await AsyncStorage.multiRemove(keysToRemove);

              Alert.alert("Success", "Your account has been deleted.", [{ text: "OK" }]);
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", "An unexpected error occurred. Please try again.");
            }
          },
        },
      ]
    );
  };

  const settingsSections: SettingSection[] = [
    {
      title: 'Account',
      data: [
        { key: 'username', title: `Username: ${username || 'Guest'}`, icon: <MaterialIcons name="person" size={20} color="#555" />, action: () => {} },
        { key: 'logout', title: 'Logout', icon: <Feather name="log-out" size={20} color="#555" />, action: handleLogout },
        { key: 'deleteAccount', title: 'Delete Account', icon: <MaterialIcons name="delete" size={20} color="red" />, action: handleDeleteAccount },
      ],
    },
    {
      title: 'Get in Touch',
      data: [
        { key: 'contactUs', title: 'Contact Us', icon: <FontAwesome name="envelope" size={20} color="#555" />, action: () => router.navigate('contact')},
      ],
    },
    {
      title: 'Support',
      data: [
        { key: 'privacyPolicy', title: 'Privacy Policy', icon: <MaterialIcons name="privacy-tip" size={20} color="#555" />, action: () => router.navigate('privacy_policy')},
        { key: 'termsOfService', title: 'Terms of Service', icon: <MaterialIcons name="description" size={20} color="#555" />, action: () => router.navigate('terms_of_service')},
        { key: 'faq', title: 'FAQ', icon: <MaterialIcons name="help" size={20} color="#555" />, action: () => router.navigate('faq')},
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={settingsSections}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity onPress={item.action} style={styles.settingItem}>
              {item.icon}
              <Text
                style={[
                  styles.settingItemText,
                  item.key === 'deleteAccount' && { color: 'red' },
                  item.key === 'username' && { fontWeight: 'bold' },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
            {item.isCollapsable && item.content}
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.version}>App Version: 1.0.0</Text>
        <Text style={styles.copyright}>© 2025 FoodHack. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  username: {
    fontSize: 20,
    color: '#373434',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  settingItemText: {
    fontSize: 16,
    color: '#373434',
  },
  sectionHeader: {
    fontSize: 18,
    color: '#373434',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'flex-start',
    marginTop: 'auto',
    paddingVertical: 10,
  },
  version: {
    fontSize: 16,
    color: '#888',
  },
  copyright: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    marginBottom: 20,
  },
  blockedUsersList: {
    flex: 1,
    width: '100%',
  },
  blockedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  usernameText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#555',
  },
});
