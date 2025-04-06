import { StyleSheet, View, FlatList, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { firestore, auth } from '../supabase';
import { collection, query, getDocs, orderBy, doc } from 'firebase/firestore';

interface Recommendation {
  id: string;
  recommendation: string;
  recommendedAt: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface MealTaken {
  id: string;
  mealTaken: string;
  takenAt: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface DayGroup {
  date: string;
  meals: {
    [mealType: string]: {
      recommendation?: Recommendation;
      mealTaken?: MealTaken;
    };
  };
}

export default function FoodHistory() {
  const [groupedMeals, setGroupedMeals] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFoodHistory = async () => {
      if (!user?.uid) return;

      try {
        // Get references to the subcollections
        const userRef = doc(firestore, 'Users', user.uid);
        const recommendationsRef = collection(userRef, 'recommendations');
        const mealsTakenRef = collection(userRef, 'mealsTaken');

        // Fetch recommendations
        const recommendationsQuery = query(
          recommendationsRef,
          orderBy('recommendedAt', 'desc')
        );
        const recommendationsSnapshot = await getDocs(recommendationsQuery);
        const recommendations: Recommendation[] = recommendationsSnapshot.docs.map(doc => ({
          recommendedAt: doc.data().recommendedAt.toDate(),
          recommendation: doc.data().recommendation,
          mealType: doc.data().mealType,
          id: doc.id

        }));

        // Fetch meals taken
        const mealsTakenQuery = query(
          mealsTakenRef,
          orderBy('takenAt', 'desc')
        );
        const mealsTakenSnapshot = await getDocs(mealsTakenQuery);
        const mealsTaken: MealTaken[] = mealsTakenSnapshot.docs.map(doc => ({
          id: doc.id,
          mealTaken: doc.data().mealTaken,
          mealType: doc.data().mealType,
          takenAt: doc.data().takenAt.toDate()
        }));

        // Group by date and meal type
        const grouped: Record<string, DayGroup['meals']> = {};

        // Process recommendations
        recommendations.forEach(rec => {
          const dateKey = rec.recommendedAt.toISOString().split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = {};
          if (!grouped[dateKey][rec.mealType]) grouped[dateKey][rec.mealType] = {};
          grouped[dateKey][rec.mealType].recommendation = rec;
        });

        // Process meals taken
        mealsTaken.forEach(meal => {
          const dateKey = meal.takenAt.toISOString().split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = {};
          if (!grouped[dateKey][meal.mealType]) grouped[dateKey][meal.mealType] = {};
          grouped[dateKey][meal.mealType].mealTaken = meal;
        });

        // Convert to array format for FlatList
        const groupedArray = Object.keys(grouped).map(date => ({
          date,
          meals: grouped[date]
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setGroupedMeals(groupedArray);
      } catch (error) {
        console.error('Error fetching food history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodHistory();
  }, [user?.uid]);

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const toggleMealExpansion = (mealKey: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealKey]: !prev[mealKey]
    }));
  };

  const renderMealType = (type: string) => {
    switch (type) {
      case 'breakfast': return '🍳 Breakfast';
      case 'lunch': return '🍲 Lunch';
      case 'dinner': return '🍽️ Dinner';
      default: return type;
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="forestgreen" />;
  }

  if (groupedMeals.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No meals yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groupedMeals}
      keyExtractor={(item) => item.date}
      renderItem={({ item: dayGroup }) => (
        <View style={styles.dayContainer}>
          <TouchableOpacity onPress={() => toggleDayExpansion(dayGroup.date)}>
            <Text style={styles.dateHeader}>
              {new Date(dayGroup.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          
          {expandedDays[dayGroup.date] && Object.entries(dayGroup.meals).map(([mealType, mealData]) => {
            const mealKey = `${dayGroup.date}-${mealType}`;
            return (
              <View key={mealKey} style={styles.mealContainer}>
                <TouchableOpacity 
                  onPress={() => toggleMealExpansion(mealKey)}
                  style={styles.mealHeader}
                >
                  <Text style={styles.mealTypeText}>
                    {renderMealType(mealType)}
                  </Text>
                </TouchableOpacity>
                
                {expandedMeals[mealKey] && (
                  <View style={styles.mealContent}>
                    {mealData.recommendation && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recommendation</Text>
                        <Text style={styles.sectionText}>
                          {mealData.recommendation.recommendation}
                        </Text>
                        <Text style={styles.sectionTime}>
                          Recommended at: {mealData.recommendation.recommendedAt.toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                    
                    {mealData.mealTaken && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What You Ate</Text>
                        <Text style={styles.sectionText}>
                          {mealData.mealTaken.mealTaken}
                        </Text>
                        <Text style={styles.sectionTime}>
                          Taken at: {mealData.mealTaken.takenAt.toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  mealContainer: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    marginLeft: 10,
  },
  mealHeader: {
    padding: 15,
    backgroundColor: '#e9e9e9',
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealContent: {
    padding: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  sectionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  sectionTime: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'forestgreen',
    textAlign: 'center',
  },
});