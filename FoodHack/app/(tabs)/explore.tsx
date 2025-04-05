import { StyleSheet, View, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';


export default function FoodHistory() {
  const [foodHistory, setFoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch food history data from Supabase
    const fetchFoodHistory = async () => {
      const { data, error } = await supabase
        .from('food_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching food history:', error);
      } else {
        setFoodHistory(data);
        setLoading(false);
      }
    };
    fetchFoodHistory();
  }, []);

  return (
    (loading) ? (
      <ActivityIndicator size="large" color="#ffc0cb" />
    ) : (
      <FlatList>  
        data={foodHistory}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#ffc0cb']}
              tintColor="#ffc0cb"
            />
          }
        renderItem={({ item }) => (
          <View style={styles.titleContainer}>
            <Text>{item.food_item}</Text>
            <Text>{item.calories} kcal</Text>
          </View>
        )}
      </FlatList>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
