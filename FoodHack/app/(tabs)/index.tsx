import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TextInput } from 'react-native'
import { firestore, auth } from '../supabase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from '@rneui/themed'
import { useEffect } from 'react'
import { setDoc, doc } from "firebase/firestore"
import { useRouter } from 'expo-router'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [healthGoals, setHealthGoals] = useState('')
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [showHealthInfo, setShowHealthInfo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => async () => {
      if (user) {
        router.navigate('/homepage')
      }
    })
    return () => unsubscribe()
  }, [])

  async function signInWithEmail() {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.navigate('/homepage')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function signUpWithEmail() {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Show health information form after successful signup
      setShowHealthInfo(true)
    } catch (error: any) {
      Alert.alert('Error', error.message)
      setLoading(false)
    }
  }

  async function saveHealthInfo() {
    if (!auth.currentUser) return

    setLoading(true)
    try {
      await setDoc(doc(firestore, "Users", auth.currentUser.uid), {
        email: email,
        firstName: firstName,
        healthInfo: {
          age: age,
          weight: weight,
          height: height,
          dietaryRestrictions: dietaryRestrictions,
          healthGoals: healthGoals,
          dailyCalorieTarget: dailyCalorieTarget
        }
      });
      setShowHealthInfo(false)
      router.navigate('/homepage')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <View style={styles.container}>
      { showHealthInfo ? (
        <View>
          <Text style={styles.title}>Health Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge} // Correct usage of setState
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your weight"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight} // Correct usage of setState
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your height (e.g., 5'9)"
            placeholderTextColor="#888"
            value={height}
            onChangeText={setHeight} // Correct usage of setState
          />
          <TextInput
            style={styles.input}
            placeholder="Any food allergies or restrictions"
            placeholderTextColor="#888"
            multiline
            value={dietaryRestrictions}
            onChangeText={setDietaryRestrictions} // Correct usage of setState
          />
          <TextInput
            style={styles.input}
            placeholder="Your fitness or health objectives"
            placeholderTextColor="#888"
            multiline
            value={healthGoals}
            onChangeText={setHealthGoals} // Correct usage of setState
          />
          <TextInput
            style={styles.input}
            placeholder="Your daily calorie target"
            placeholderTextColor="#888"
             keyboardType="numeric"
            value={dailyCalorieTarget}
            onChangeText={setDailyCalorieTarget} // Correct usage of setState
          />
          <Button 
            title="Save Information"
            color={'forestgreen'}
            onPress={saveHealthInfo} 
          />
        </View>
      ) : isSigningUp ? (
        <>
        <Text style={styles.title}>Sign Up</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="foodhack@gmail.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button 
            title="Sign Up" 
            color={'forestgreen'}
            disabled={loading} 
            onPress={signUpWithEmail} 
            buttonStyle={styles.roundedButton}
          />
          <Button 
            title="Back to Sign In" 
            type="outline" 
            onPress={() => setIsSigningUp(false)} 
          />
        </>
      ) : (
        <>
         <Text style={styles.title}>Sign In</Text>
          <TextInput
            style={styles.input}
            placeholder="foodhack@gmail.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button 
            title="Sign In" 
            disabled={loading} 
            color={'forestgreen'}
            onPress={signInWithEmail} 
            buttonStyle={styles.roundedButton}
          />
          <Button 
            title="Don't have an account? Sign Up" 
            type="outline" 
            onPress={() => setIsSigningUp(true)} 
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'forestgreen',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  roundedButton: {
    borderRadius: 10,
    width: 200, // Set a smaller width for the buttons
    alignSelf: 'center', // Center the buttons horizontally
  },
});