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
      recommendation?: Recommendation | Recommendation[];
      mealTaken?: string | MealTaken | Record<string, any>;
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

  const renderRecommendation = (recommendation: Recommendation | Recommendation[] | undefined) => {
    if (!recommendation) return null;

    if (Array.isArray(recommendation)) {
      return recommendation.map((rec, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <Text style={styles.sectionText}>{rec.recommendation}</Text>
          <Text style={styles.sectionTime}>
            Recommended at: {rec.recommendedAt.toLocaleTimeString()}
          </Text>
        </View>
      ));
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <Text style={styles.sectionText}>{recommendation.recommendation}</Text>
      </View>
    );
  };

  const renderMealTaken = (mealTaken: string | MealTaken | Record<string, any> | undefined) => {
    if (!mealTaken) return null;
  
    if (typeof mealTaken === 'string') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Ate</Text>
          <Text style={styles.sectionText}>{mealTaken}</Text>
        </View>
      );
    }
  
    // Handle object case (either MealTaken or a generic map)
    if (typeof mealTaken === 'object' && !Array.isArray(mealTaken)) {
      // If it's a MealTaken object with standard fields
      if ('mealTaken' in mealTaken && 'takenAt' in mealTaken) {
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You Ate</Text>
            <Text style={styles.sectionText}>{mealTaken.mealTaken}</Text>
          </View>
        );
      }
  
      // Handle generic map case where each key is a subsection
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Details</Text>
          {Object.entries(mealTaken).map(([key, value], index) => (
            <View key={index} style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                {key.split(/(?=[A-Z])/).join(' ')} {/* Split camelCase */}
              </Text>
              {typeof value === 'object' && !Array.isArray(value) ? (
                Object.entries(value).map(([subKey, subValue], subIndex) => (
                  <View key={subIndex} style={styles.mealDetailItem}>
                    <Text style={styles.mealDetailTitle}>
                      {subKey.charAt(0).toUpperCase() + subKey.slice(1)}:
                    </Text>
                    <Text style={styles.mealDetailContent}>
                      {typeof subValue === 'string' || typeof subValue === 'number' 
                        ? subValue 
                        : JSON.stringify(subValue)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.subsectionText}>
                  {typeof value === 'string' || typeof value === 'number' 
                    ? value 
                    : JSON.stringify(value)}
                </Text>
              )}
            </View>
          ))}
        </View>
      );
    }
  
    return null;
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
                    {renderRecommendation(mealData.recommendation)}
                    {renderMealTaken(mealData.mealTaken)}
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
  mealDetailItem: {
    marginBottom: 8,
  },
  mealDetailTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  mealDetailContent: {
    fontSize: 14,
    color: '#333',
  },
  subsection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#444',
    textTransform: 'capitalize',
  },
  subsectionText: {
    fontSize: 14,
    color: '#333',
  },
});