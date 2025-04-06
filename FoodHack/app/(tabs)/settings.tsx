import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, SectionList, TextInput } from 'react-native';
import { MaterialIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, firestore } from '../supabase';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface Profile {
  email: string;
  username: string;
  age: number;
  height: number;
  weight: number;
  dietaryRestrictions: string;
  healthGoals: string;
  dailyCalorieTarget?: number;
}

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, 'Users', user.uid);
        const actualUnsubscribe = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            setProfile({
              email: userData.email || user.email || '',
              username: userData.firstName || 'Guest',
              age: userData.health?.age || 0,
              height: userData.healthInfo?.height || 0,
              weight: userData.healthInfo?.weight || 0,
              dietaryRestrictions: userData.healthInfo?.dietaryRestrictions || '',
              healthGoals: userData.healthInfo?.healthGoals || '',
              dailyCalorieTarget: userData.healthInfo?.dailyCalorieTarget || 0,
            });
          }
        }, (error) => {
        });
        unsubscribeRef.current = actualUnsubscribe;
      }
    };

    fetchProfile();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const toggleProfile = () => {
    setIsProfileExpanded(!isProfileExpanded);
    setEditingField(null); // Cancel any editing when collapsing
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.navigate('/(tabs)')
    } catch (error) {
      Alert.alert("Error", "There was an issue logging you out. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
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
              if (!user.email) {
                Alert.alert("Error", "User email is not available.");
                return;
              }
              const credential = EmailAuthProvider.credential(user.email, password);
              await reauthenticateWithCredential(user, credential);
  
              const userRef = doc(firestore, 'users', user.uid);
              await deleteDoc(userRef);
              await deleteUser(user);
              await signOut(auth);
              router.navigate('/(tabs)')
              
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

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value.toString());
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  const saveProfileChange = async () => {
    if (!editingField || !auth.currentUser) return;

    try {
      const userRef = doc(firestore, 'Users', auth.currentUser.uid);
      const updateData: any = {};

      if (editingField === 'username') {
        updateData.username = editValue;
      } else {
        updateData[`healthInfo.${editingField}`] = isNaN(Number(editValue)) ? editValue : Number(editValue);
      }

      await updateDoc(userRef, updateData);
      setEditingField(null);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    }
  };

  const renderProfileField = (label: string, value: string | number, field: string) => {
    const isEditable = field !== 'email'; // Email can't be edited here
    
    return (
      <View style={styles.profileField}>
        <Text style={styles.profileLabel}>{label}:</Text>
        {editingField === field ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType={field === 'username' || field === 'dietaryRestrictions' || field === 'healthGoals' ? 'default' : 'numeric'}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProfileChange}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.profileValue}>{value}</Text>
            {isEditable && (
              <TouchableOpacity onPress={() => startEditing(field, value.toString())}>
                <Feather name="edit-2" size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const profileContent = profile ? (
    <View style={styles.profileContent}>
      {renderProfileField('Username', profile.username, 'username')}
      {renderProfileField('Email', profile.email, 'email')}
      {renderProfileField('Age', profile.age, 'age')}
      {renderProfileField('Weight (lbs)', profile.weight, 'weight')}
      {renderProfileField('Height', profile.height, 'height')}
      {renderProfileField('Dietary Restrictions', profile.dietaryRestrictions, 'dietaryRestrictions')}
      {renderProfileField('Health Goals', profile.healthGoals, 'healthGoals')}
      {renderProfileField('Daily Calorie Target', profile.dailyCalorieTarget || 0, 'dailyCalorieTarget')}
    </View>
  ) : null;

  const settingsSections: SettingSection[] = [
    {
      title: 'Profile',
      data: [
        { 
          key: 'profile', 
          title: 'My Profile', 
          icon: <MaterialIcons name="account-circle" size={20} color="#555" />, 
          action: toggleProfile,
          isCollapsable: true,
          content: isProfileExpanded ? profileContent : null
        },
      ],
    },
    {
      title: 'Account',
      data: [
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
        { key: 'about', title: 'About FoodHack', icon: <Ionicons name="information-circle-sharp" size={20} color="#555" />, action: () => router.navigate('../about')},
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
                ]}
              >
                {item.title}
              </Text>
              {item.isCollapsable && (
                <MaterialIcons 
                  name={isProfileExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#555" 
                />
              )}
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
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItemText: {
    fontSize: 16,
    color: '#373434',
    marginLeft: 10,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    color: '#373434',
    backgroundColor: '#fff',
  },
  profileContent: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 40,
  },
  profileLabel: {
    width: 150,
    fontSize: 16,
    color: '#555',
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: 'forestgreen',
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  version: {
    fontSize: 14,
    color: '#888',
  },
  copyright: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});