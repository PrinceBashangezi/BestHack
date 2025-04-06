import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.content}>
        By using FoodHack, you agree to our terms of service. We provide recommendations based on the information you provide, 
        and we are not responsible for any adverse effects resulting from the use of our recommendations.
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
