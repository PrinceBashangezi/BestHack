import { StyleSheet, View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Import Supabase client

interface FoodHistoryItem {
  id: number;
  recommendation: string;
  created_at: string;
}


export default function FoodHistory() {
  const [foodHistory, setFoodHistory] =useState<FoodHistoryItem[]>([]);
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
      <ActivityIndicator size="large" color="forestgreen" />
    ) : (
      <FlatList
        data={foodHistory}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
            <Text>{item.recommendation}</Text>
            <Text>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
      />
    )
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
