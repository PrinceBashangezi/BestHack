import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { firestore, auth } from './supabase'; // Import Firestore configuration
import { doc, onSnapshot } from 'firebase/firestore'; // Import Firestore methods

export default function ContactScreen() {
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
  
    if (!user) return; // Exit early if no user is logged in
  
    const userRef = doc(firestore, 'users', user.uid);
  
    // Subscribe to Firestore document changes
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        try {
          if (doc.exists()) {
            const data = doc.data();
  
            // Safeguard to check if email exists and is valid
            const userEmail = data?.email || null;
            setEmail(userEmail); // Set email or null if email is missing
          } else {
          }
        } catch (error) {
        }
      },
      (error) => {
      }
    );
  
    // Cleanup the subscription on unmount
    return () => unsubscribe();
  }, [firestore]); // Re-run effect when currentUser or firestore changes

  const handleSubmit = () => {
      if (!email || !title || !message) {
        Alert.alert('Erro', 'Please fill in all fields',
          [{ text: 'Health Eating' }]
        );
        return;
      }

      MailComposer.composeAsync({
        recipients: ['foodhack@gmail.com'],
        subject: title,
        body: `From: ${email}\n\n${message}`,
      }).then(result => {
        if (result.status === 'sent') {
          Alert.alert('Success', 'Message sent successfully!', [{ text: 'Health Eating' }]);
        } else {
          Alert.alert('Error', 'Failed to send the message.', [{ text: 'Health Eating' }]);
        }
      }).catch(error => {
        Alert.alert('Error sending email', error.message, [{ text: 'Health Eating' }]);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Your Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.textArea}
        placeholder="Message"
        placeholderTextColor="#888"
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9', // Light background for better readability
  },
  input: {
    height: 45,
    borderColor: 'forestgreen',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'white', // Light background for input
  },
  textArea: {
    height: 100,
    borderColor: 'forestgreen',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff', // Light background for textarea
  },
});
