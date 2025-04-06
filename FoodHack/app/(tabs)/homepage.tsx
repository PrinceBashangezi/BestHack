import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { firestore, auth } from '../supabase'
import { useEffect } from 'react'
import { query, collection, orderBy, getDocs, limit } from "firebase/firestore"



export default function HomePage() {
    const [latestMeal, setLatestMeal] = useState<any>(null)
    const [firstName, setFirstName] = useState<string | null>(null)
    
    useEffect(() => {
        const user = auth.currentUser
        if (user) {
        fetchLatestMeal(user.uid)
        setFirstName(user.displayName || null)
        }
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

    return (
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
        fontSize: 16,
        color: '#888',
    },
})