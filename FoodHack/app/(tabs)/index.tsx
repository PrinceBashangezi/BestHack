import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { firestore, auth } from '../supabase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword} from "firebase/auth";
import { Button, Input } from '@rneui/themed'
import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { setDoc, doc } from "firebase/firestore"

export default function HomeScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, signedIn] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        signedIn(true)
      } else {
        signedIn(false)
      }
    })

    return () => unsubscribe()

  }, [])

  async function signInWithEmail() {
    setLoading(true)
    await signInWithEmailAndPassword(auth, email, password)

    const user = auth.currentUser
    if (!user) {
      Alert.alert('Invalid email or password')
      signedIn(false)
    } else {
      signedIn(true)      
    }
  }

  async function signUpWithEmail() {
    setLoading(true)
    await createUserWithEmailAndPassword(auth, email,password)
    setLoading(false)
    const user = auth.currentUser
    if (user) {
      await setDoc(doc(firestore, "Users", user.uid), {
        email: email
      });
    }
  }


  return (
    <View style={styles.container}>
      {isLoggedIn? (
        <>
        <View>  
          
        </View>
        </>
        //insert expression
      ):(
        <> 
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
})