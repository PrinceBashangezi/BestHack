import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Platform,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@rneui/themed';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { collection, addDoc } from "firebase/firestore";
import { firestore, auth } from '../supabase';

// Updated API URL - you might need to adjust this based on your network setup
const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/upload'  // Android emulator 
  : 'https://79ab-134-173-248-4.ngrok-free.app/upload'; // iOS simulator

export default function FoodAnalysisScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Take a photo with the camera
  const takePhoto = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Camera Error', 'Could not take photo. Please try again.');
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Media library permission is required to select photos');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gallery Error', 'Could not select photo. Please try again.');
    }
  };

  // Upload image to server and get analysis
  const analyzeImage = async () => {
    if (!image) return;
    
    setLoading(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      const imageUri = image;
      const filename = imageUri.split('/').pop() || `food_${Date.now()}.jpg`;
      
      // Append the image to form data
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      
      console.log(`Uploading image to ${API_URL}...`);
      
      // API call to server
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No details available');
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Analysis received successfully');
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Analysis Failed',
        `Could not analyze your food image: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Format nutritional value safely with proper type handling
  const NutritionItem = ({ label, value }: { label: string, value: any }) => {
    let displayValue: string;
    
    if (value === null || value === undefined) {
      displayValue = "N/A";
    } else if (typeof value === 'object') {
      // Handle objects like {range: "200-300 kcal", notes: "..."}
      if (value.range) {
        displayValue = value.range;
      } else {
        try {
          displayValue = JSON.stringify(value);
        } catch (e) {
          displayValue = "Complex value";
        }
      }
    } else {
      // Simple string, number, etc
      displayValue = String(value);
    }
    
    return (
      <View style={styles.nutritionItem}>
        <ThemedText style={styles.nutritionLabel}>{label}:</ThemedText>
        <ThemedText style={styles.nutritionValue}>{displayValue}</ThemedText>
      </View>
    );
  };

  // Simplified display component for nutrition sections
  const NutritionSection = ({ title, data, filter = () => true }) => {
    if (!data) return null;
    
    return (
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {Object.entries(data)
          .filter(([key]) => key !== 'notes' && filter(key))
          .map(([key, value]) => {
            const formattedKey = key.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            return (
              <NutritionItem 
                key={key} 
                label={formattedKey} 
                value={value} 
              />
            );
          })}
        {data.notes && (
          <ThemedText style={styles.notesText}>{data.notes}</ThemedText>
        )}
      </ThemedView>
    );
  };

  const storeMeal = async (data: any) => {
    if (!auth.currentUser) return;

    try {
        // Determine meal type based on the current time
        const currentHour = new Date().getHours();
        let mealType: 'breakfast' | 'lunch' | 'dinner';
        if (currentHour < 11) {
          mealType = 'breakfast';
        } else if (currentHour < 17) {
          mealType = 'lunch';
        } else {
          mealType = 'dinner';
        }

        // Extract recommendation from analysis data
        const mealTaken = data?.nutrition_analysis.nutritional_analysis.recommendations_for_a_healthier_meal || 'No specific meal analysis available';

        // Store the recommendation in the user's recommendations subcollection
        const mealRef = collection(firestore, `Users/${auth.currentUser.uid}/mealsTaken`);
        await addDoc(mealRef, {
          mealTaken,
          takenAt: new Date(),
          mealType,
        });
        console.log('Meal stored successfully in Firestore.');
      
    } catch (error) {
      console.error('Error storing recommendation:', error);
    }
  };


  // Main screen
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Food Analysis</ThemedText>
        <ThemedText>Take a photo of your meal to get nutritional information</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>
        <Button 
          title="Take Photo" 
          onPress={takePhoto} 
          icon={{ name: 'camera', type: 'font-awesome', color: 'white', size: 18 }}
          buttonStyle={[styles.button, styles.cameraButtonStyle]}
        />
        <Button 
          title="Gallery" 
          onPress={pickImage} 
          icon={{ name: 'image', type: 'font-awesome', color: 'white', size: 18 }}
          buttonStyle={[styles.button, styles.galleryButtonStyle]}
        />
      </ThemedView>
      
      {image && (
        <ThemedView style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.foodImage} />
          <Button 
            title="Analyze Food" 
            onPress={analyzeImage} 
            loading={loading}
            disabled={loading}
            buttonStyle={styles.analyzeButton}
          />
        </ThemedView>
      )}
      
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Analyzing your meal...</ThemedText>
        </ThemedView>
      )}
      
      {analysis && (
        <ThemedView style={styles.resultsContainer}>
          <ThemedText type="subtitle" style={styles.resultsTitle}>Nutritional Analysis</ThemedText>

          
          {/* Calorie Information - Handle specially */}
          {analysis.nutrition_analysis.nutritional_analysis?.estimated_calories && (
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Estimated Calories</ThemedText>
              <ThemedText style={styles.caloriesValue}>
                {typeof analysis.nutrition_analysis.nutritional_analysis.estimated_calories === 'object'
                  ? analysis.nutrition_analysis.nutritional_analysis.estimated_calories.range || 'Not specified'
                  : analysis.nutrition_analysis.nutritional_analysis.estimated_calories}
              </ThemedText>
              {typeof analysis.nutrition_analysis.nutritional_analysis.estimated_calories === 'object' &&
                analysis.nutrition_analysis.nutritional_analysis.estimated_calories.notes && (
                <ThemedText style={styles.notesText}>
                  {analysis.nutrition_analysis.nutritional_analysis.estimated_calories.notes}
                </ThemedText>
              )}
            </ThemedView>
          )}
          
          {/* Use the simplified section component for other nutrition data */}
          <NutritionSection 
            title="Macronutrients" 
            data={analysis.nutrition_analysis.nutritional_analysis?.macronutrient_breakdown} 
          />
          
          <NutritionSection 
            title="Vitamins & Minerals" 
            data={analysis.nutrition_analysis.nutritional_analysis?.key_vitamins_and_minerals} 
          />
          
          {/* Health Benefits */}
          {analysis.nutrition_analysis.nutritional_analysis?.health_benefits && (
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Health Benefits</ThemedText>
              {Object.entries(analysis.nutrition_analysis.nutritional_analysis.health_benefits)
                .map(([key, value]) => (
                <View key={key} style={styles.benefitItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.benefitText}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </ThemedText>
                </View>
              ))}
            </ThemedView>
          )}
          
          {/* Recommendations */}
          {analysis.nutrition_analysis.nutritional_analysis?.recommendations_for_a_healthier_meal && (
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
              {Object.entries(analysis.nutrition_analysis.nutritional_analysis.recommendations_for_a_healthier_meal)
                .map(([key, value]) => (
                <View key={key} style={styles.recommendationItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.recommendationText}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </ThemedText>
                </View>
              ))}
            </ThemedView>
          )}
          {/* Store meal data */}
          <Button
            title="Store Meal"
            color={'forestgreen'}
            onPress={() => {
              storeMeal(analysis);
              setAnalysis(null);
              setImage(null);
            }}
            buttonStyle={styles.analyzeButton}
          />
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    gap: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
  },
  cameraButtonStyle: {
    backgroundColor: 'forestgreen',
    flex: 1,
    marginRight: 8,
  },
  galleryButtonStyle: {
    backgroundColor: '#4a6572',
    flex: 1,
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 16,
  },
  foodImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  analyzeButton: {
    marginTop: 16,
    backgroundColor: 'forestgreen',
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsContainer: {
    padding: 16,
    marginBottom: 20,
  },
  resultsTitle: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: Platform.OS === 'ios' ? '#f2f2f7' : '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  nutritionLabel: {
    flex: 1,
    fontWeight: '500',
  },
  nutritionValue: {
    flex: 2,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0a7ea4',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'forestgreen',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontWeight: '500',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a7ea4',
    marginTop: 8,
    marginRight: 8,
  },
  benefitText: {
    flex: 1,
  },
  recommendationText: {
    flex: 1,
  }
});