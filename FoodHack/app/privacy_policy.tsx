import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.content}>
        At FoodHack, we value your privacy. We collect and use your data only to provide personalized recommendations and improve our services. 
        Your data is stored securely and never shared with third parties without your consent.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
});
