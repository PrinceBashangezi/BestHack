import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, SectionList } from 'react-native';
import { MaterialIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, firestore } from '../supabase'; // Import Supabase client
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'; // Import Firestore methods
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';


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
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(firestore, 'users', user.uid);
          const actualUnsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.data();
              setUsername(userData.username || 'Guest');
            }
          }, (error) => {
          });
          unsubscribeRef.current = actualUnsubscribe;
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
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No user is logged in.");
      return;
    }
    const userRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        discoverable: false,
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        Alert.alert("Error", "You do not have permission to update your profile.");
      } else {
        Alert.alert("Error", "There was an issue updating your profile. You will still be logged out.");
      }
    }
    if (unsubscribeRef) {
      unsubscribeRef; // Stop the listener
    }
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Error", "There was an issue logging you out. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    // For email/password users only - adjust if you have other auth providers
    Alert.prompt(
      "Delete Account",
      "This will permanently delete all your data. To confirm, please enter your password:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async (password) => {
            if (!password) {
              Alert.alert("Error", "Password is required to delete your account.");
              return;
            }
  
            try {
              // Create credential and reauthenticate
              if (!user.email) {
                Alert.alert("Error", "User email is not available.");
                return;
              }
              const credential = EmailAuthProvider.credential(user.email, password);
              await reauthenticateWithCredential(user, credential);
  
              // Proceed with deletion
              const userRef = doc(firestore, 'users', user.uid);
              await deleteDoc(userRef);
              await deleteUser(user);
              await signOut(auth);
              
              Alert.alert("Success", "Your account has been deleted.");
            } catch (error: any) {
              console.error("Deletion error:", error);
              let errorMessage = "Failed to delete account. Please try again.";
              
              if (error.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
              } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = "Session expired. Please log in again before deleting.";
              }
              
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ],
      'secure-text'
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
        { key: 'contactUs', title: 'Contact Us', icon: <FontAwesome name="envelope" size={20} color="#555" />, action: () => router.navigate('../contact') },
      ],
    },
    {
      title: 'Support',
      data: [
        { key: 'privacyPolicy', title: 'Privacy Policy', icon: <MaterialIcons name="privacy-tip" size={20} color="#555" />, action: () => router.navigate('../privacy_policy')},
        { key: 'termsOfService', title: 'Terms of Service', icon: <MaterialIcons name="description" size={20} color="#555" />, action: () => router.navigate('../terms_of_service')},
        { key: 'faq', title: 'FAQ', icon: <MaterialIcons name="help" size={20} color="#555" />, action: () => router.navigate('../faq')},
        { key: 'about', title: 'About FoodHack', icon: <Ionicons name={ "information-circle-sharp"} size={20} color="#555" />, action: () => router.navigate('../faq')},
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
