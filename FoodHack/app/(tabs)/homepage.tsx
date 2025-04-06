import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { firestore, auth } from '../supabase'
import { useEffect } from 'react'
import { query, collection, orderBy, getDocs, limit, doc, getDoc, onSnapshot } from "firebase/firestore"


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


export default function HomePage() {
    const [latestMeal, setLatestMeal] = useState<any>(null)
    const [firstName, setFirstName] = useState<string | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    
    
    useEffect(() => {
        const user = auth.currentUser
        if (user) {
        fetchUsername(user.uid)
        fetchLatestMeal(user.uid)
        fetchProfile()
        setFirstName(user.displayName || null)
        }
    }, [])


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

    async function fetchUsername(userId: string) {
        try {
        const userRef = doc(firestore, "Users", userId)
        const docSnap = await getDoc(userRef)
        
        if (docSnap.exists()) {
            const data = docSnap.data()
            setFirstName(data.firstName || null)
        } else {
            console.log("No such document!")
        }
        } catch (error) {
        console.error("Error fetching username:", error)
        }
    }


    return (
        <View>
            <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome {firstName || 'User'}!</Text>
            </View>

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
                    <View>
                        <Text style={styles.noMealsText}>No meals recorded yet</Text>
                        <Text style={styles.noMealsText}>Eat healthy and waste little</Text>
                    </View>
                )}
            </View>

            {profile && (
                <View style={styles.healthInfoContainer}>
                    <Text style={styles.healthInfoText}>
                        Hello {profile.username}, you want to {profile.healthGoals.toLowerCase()}, 
                        and you have these dietary restrictions: {profile.dietaryRestrictions || 'None'}.
                    </Text>
                    <Text style={styles.healthInfoText}>
                        Keep up eating healthy and wasting little!
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    section: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    mealCard: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    mealType: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    mealDetails: {
        fontSize: 16,
        marginVertical: 5,
    },
    mealTime: {
        fontSize: 14,
        color: '#888',
    },
    noMealsText: {
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        fontSize: 20,
        color: '#888',
    },
    welcomeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'forestgreen',
        textAlign: 'center',
    },
    healthInfoContainer: {
        padding: 20,
        backgroundColor: '#e8f5e9',
        borderRadius: 10,
        marginTop: 20,
    },
    healthInfoText: {
        fontSize: 20,
        color: '#2e7d32',
        textAlign: 'center',
        marginBottom: 10,
    },
})