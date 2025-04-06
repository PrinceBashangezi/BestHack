import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text } from 'react-native'
import { firestore, auth } from '../supabase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Button, Input } from '@rneui/themed'
import { useEffect } from 'react'
import { setDoc, doc, query, collection, orderBy, getDocs, limit } from "firebase/firestore"

export default function HomeScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [healthGoals, setHealthGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [showHealthInfo, setShowHealthInfo] = useState(false)
  const [latestMeal, setLatestMeal] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => async () => {
      if (user) {
        setIsLoggedIn(true)
        await fetchLatestMeal(user.uid)
      } else {
        setIsLoggedIn(false)
      }
    })
    return () => unsubscribe()
  }, [])

  async function fetchLatestMeal(userId: string) {
    try {
      const mealsRef = collection(firestore, "Users", userId, "mealsTaken")
      const q = query(mealsRef, orderBy("takenAt", "desc"), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        setLatestMeal({
          id: doc.id,
          ...doc.data()
        })
      } else {
        setLatestMeal(null)
      }
    } catch (error) {
      console.error("Error fetching latest meal:", error)
    }
  }

  async function signInWithEmail() {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setIsLoggedIn(true)
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password')
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
    } catch (error) {
      Alert.alert('Error', 'Failed to create account')
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
          healthGoals: healthGoals
        }
      });
      setIsLoggedIn(true)
      setShowHealthInfo(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to save health information')
    } finally {
      setLoading(false)
    }
  }


  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View>
          <Text>Welcome {firstName || 'User'}!</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Latest Meal</Text>
            {latestMeal ? (
              <View style={styles.mealCard}>
                <Text style={styles.mealType}>{latestMeal.mealType}</Text>
                <Text style={styles.mealDetails}>{latestMeal.mealTaken}</Text>
                <Text style={styles.mealTime}>
                  {new Date(latestMeal.takenAt?.seconds * 1000).toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.noMealsText}>No meals recorded yet</Text>
            )}
          </View>
        </View>
      ) : showHealthInfo ? (
        <View>
          <Text style={styles.title}>Health Information</Text>
          <View style={styles.verticallySpaced}>
            <Input
              label="Age"
              onChangeText={setAge}
              value={age}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Weight (lbs)"
              onChangeText={setWeight}
              value={weight}
              placeholder="Enter your weight"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Height"
              onChangeText={setHeight}
              value={height}
              placeholder="Enter your height (e.g., 5'9\)"            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Dietary Restrictions"
              onChangeText={setDietaryRestrictions}
              value={dietaryRestrictions}
              placeholder="Any food allergies or restrictions"
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Health Goals"
              onChangeText={setHealthGoals}
              value={healthGoals}
              placeholder="Your fitness or health objectives"
            />
          </View>
          <Button 
            title="Save Information" 
            disabled={loading} 
            onPress={saveHealthInfo} 
          />
        </View>
      ) : isSigningUp ? (
        <>
          <View style={styles.verticallySpaced}>
            <Input
              label="First Name"
              onChangeText={setFirstName}
              value={firstName}
              placeholder="Enter your first name"
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Email"
              leftIcon={{ type: 'font-awesome', name: 'envelope' }}
              onChangeText={setEmail}
              value={email}
              placeholder="foodhack@gmail.com"
              autoCapitalize={'none'}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Password"
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={'none'}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Confirm Password"
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              secureTextEntry={true}
              placeholder="Confirm Password"
              autoCapitalize={'none'}
            />
          </View>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Button 
              title="Sign Up" 
              disabled={loading} 
              onPress={signUpWithEmail} 
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Button 
              title="Back to Sign In" 
              type="outline" 
              onPress={() => setIsSigningUp(false)} 
            />
          </View>
        </>
      ) : (
        <>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Input
              label="Email"
              leftIcon={{ type: 'font-awesome', name: 'envelope' }}
              onChangeText={setEmail}
              value={email}
              placeholder="foodhack@gmail.com"
              autoCapitalize={'none'}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Password"
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={'none'}
            />
          </View>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Button 
              title="Sign In" 
              disabled={loading} color={'forestgreen'}
              onPress={signInWithEmail} 
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Button 
              title=" Don't have an account? Sign Up" 
              type="outline" 
              onPress={() => setIsSigningUp(true)} 
            />
          </View>
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
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 20,
    backgroundColor: 'red',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  mealCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealDetails: {
    fontSize: 14,
    marginVertical: 5,
    color: '#555',
  },
  mealTime: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  noMealsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
})