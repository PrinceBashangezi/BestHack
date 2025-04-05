import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FAQScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frequently Asked Questions</Text>
      <Text style={styles.question}>Q: How does FoodHack work?</Text>
      <Text style={styles.answer}>
        A: FoodHack uses advanced AI to provide personalized food recommendations based on your BMI, health goals, and preferences.
      </Text>
      <Text style={styles.question}>Q: Is FoodHack free to use?</Text>
      <Text style={styles.answer}>
        A: Yes, FoodHack is free to use. Some premium features may require a subscription.
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
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
});
