import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Platform,
  Alert,
  Text
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@rneui/themed';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { firestore, auth } from '../supabase';

// Use the same API URL as in your analyze.tsx file
const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/analyze_menu'  // Android emulator 
  : 'https://79ab-134-173-248-4.ngrok-free.app/analyze_menu'; // iOS simulator

export default function MenuAnalysisScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // User preferences state
  const [age, setAge] = useState<number>(0);; // Placeholder, replace with actual age fetching logic
  const [weight, setWeight] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [healthGoal, setHealthGoal] = useState<string>('balanced');
  const [calorieTarget, setCalorieTarget] = useState<string>('moderate');

  useEffect(() => { 
    const user = auth.currentUser;
    if (user) {
      fetchUserHealthInfo(user.uid);
    }
  }, []);
  
  // Fetch user preferences from Firestore
  const fetchUserHealthInfo = async (userId: string) => {
    try {
      const userRef = doc(firestore, 'Users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data) {
          setAge(data.healthInfo.age || 0);
          setWeight(data.healthInfo.weight || 0);
          setHeight(data.healthInfo.height || 0);
          setDietaryRestrictions(data.healthInfo.dietaryRestrictions || '');
          setHealthGoal(data.healthInfo.healthGoals || 'balanced');
          setCalorieTarget(data.healthInfo.dailyCalorieTarget || 'moderate');
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };


  // Take a photo with the camera
  const takePhoto = async () => {
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

  // Upload menu image and get recommendations
  const analyzeMenu = async () => {
    if (!image) return;
    
    setLoading(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      const imageUri = image;
      const filename = imageUri.split('/').pop() || `menu_${Date.now()}.jpg`;
      
      // Append the image to form data
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      
      // Add user preferences to the request
      const preferences = {
        age: age,
        weight: weight,
        height: height,
        dietary_restrictions: dietaryRestrictions,
        health_goals: healthGoal,
        calories_target: calorieTarget
      };
      
      formData.append('preferences', JSON.stringify(preferences));
      
      console.log(`Uploading menu image to ${API_URL}...`);
      
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
      console.log('Menu analysis received successfully');
      setAnalysis(data);
    } catch (error: any) {
      console.error('Error analyzing menu:', error);
      Alert.alert(
        'Analysis Failed',
        `Could not analyze your menu image: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const storeRecommendation = async (data: any) => {
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
        const recommendation = data?.menu_recommendations?.recommendations || 'No specific recommendation';

        // Store the recommendation in the user's recommendations subcollection

        const recommendationsRef = collection(firestore, `Users/${auth.currentUser.uid}/recommendations`);
        await addDoc(recommendationsRef, {
          recommendation,
          recommendedAt: new Date(),
          mealType,
        });
        console.log('Recommendation stored successfully in Firestore.');
    } catch (error) {
      console.error('Error storing recommendation:', error);
    }
  };


  // Helper function to safely render text
  const safeRenderText = (text: any): string => {
    if (text === null || text === undefined) {
      return '';
    }
    if (typeof text === 'string') {
      return text;
    }
    if (typeof text === 'number' || typeof text === 'boolean') {
      return String(text);
    }
    return JSON.stringify(text);
  };

  // Render recommendations with safety checks
  const renderRecommendations = () => {
    // Check for error message first
    if (analysis?.menu_recommendations?.error) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {safeRenderText(analysis.menu_recommendations.error)}
          </ThemedText>
        </View>
      );
    }
  
    if (!analysis?.menu_recommendations?.recommendations) {
      return <ThemedText>No specific recommendations found.</ThemedText>;
    }
  
    const recommendations = analysis.menu_recommendations.recommendations;
  
    try {
      // Handle case where recommendations is an array
      if (Array.isArray(recommendations)) {
        return (
          <View style={styles.recommendationsContainer}>
            {recommendations.map((item, index) => {
              // Get the dish name using various possible properties
              let dishName = "Unknown Item";
              
              if (typeof item === 'object' && item !== null) {
                // Try different potential property names for dish names
                if ('dish_name' in item && item.dish_name) {
                  dishName = safeRenderText(item.dish_name);
                } else if ('menu_item' in item && item.menu_item) {
                  dishName = safeRenderText(item.menu_item);
                } else if ('name' in item && item.name) {
                  dishName = safeRenderText(item.name);
                } else if ('item' in item && item.item) {
                  dishName = safeRenderText(item.item);
                } else if ('food' in item && item.food) {
                  dishName = safeRenderText(item.food);
                }
              } else if (typeof item === 'string') {
                // If item is just a string, use it as dish name
                dishName = item;
              }
  
              return (
                <View key={index} style={styles.recommendationCard}>
                  <ThemedText style={styles.dishName}>
                    {dishName}
                  </ThemedText>
                  
                  {typeof item === 'object' && item !== null && 'reason' in item && (
                    <ThemedText style={styles.reasonText}>
                      {safeRenderText(item.reason)}
                    </ThemedText>
                  )}
                  
                  {typeof item === 'object' && 
                    item !== null && 
                    'modifications' in item && 
                    Array.isArray(item.modifications) && 
                    item.modifications.length > 0 && (
                    <View style={styles.modificationsContainer}>
                      <ThemedText style={styles.modificationTitle}>Suggested Modifications:</ThemedText>
                      {item.modifications.map((mod, modIndex) => (
                        <View key={modIndex} style={styles.modificationItem}>
                          <View style={styles.bulletPoint} />
                          <ThemedText style={styles.modificationText}>
                            {safeRenderText(mod)}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Alternative location for modifications if they're in healthier_modifications */}
                  {typeof item === 'object' && 
                    item !== null && 
                    'healthier_modifications' in item &&
                    item.healthier_modifications !== 'N/A' && (
                    <View style={styles.modificationsContainer}>
                      <ThemedText style={styles.modificationTitle}>Suggested Modifications:</ThemedText>
                      {Array.isArray(item.healthier_modifications) ? (
                        item.healthier_modifications.map((mod, modIndex) => (
                          <View key={modIndex} style={styles.modificationItem}>
                            <View style={styles.bulletPoint} />
                            <ThemedText style={styles.modificationText}>
                              {safeRenderText(mod)}
                            </ThemedText>
                          </View>
                        ))
                      ) : (
                        <View style={styles.modificationItem}>
                          <View style={styles.bulletPoint} />
                          <ThemedText style={styles.modificationText}>
                            {safeRenderText(item.healthier_modifications)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      } 
      
      // Handle case where recommendations is an object
      else if (typeof recommendations === 'object' && recommendations !== null) {
        return (
          <View style={styles.recommendationsContainer}>
            {Object.entries(recommendations).map(([key, value], index) => {
              // Try to extract a meaningful name from the key
              const dishName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
              
              return (
                <View key={index} style={styles.recommendationCard}>
                  <ThemedText style={styles.dishName}>{dishName}</ThemedText>
                  <ThemedText style={styles.reasonText}>
                    {safeRenderText(value)}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        );
      }
      
      // Handle unexpected format
      return <ThemedText>Recommendations available in unsupported format.</ThemedText>;
      
    } catch (error) {
      console.error("Error rendering recommendations:", error);
      return <ThemedText>Error displaying recommendations.</ThemedText>;
    }
  };

  // Render items to avoid with safety checks
  const renderItemsToAvoid = () => {
    if (!analysis?.menu_recommendations?.items_to_avoid) {
      return null;
    }

    const itemsToAvoid = analysis.menu_recommendations.items_to_avoid;
    
    try {
      if (Array.isArray(itemsToAvoid)) {
        return (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Items to Avoid</ThemedText>
            {itemsToAvoid.map((item, index) => (
              <View key={index} style={styles.avoidItem}>
                <View style={[styles.bulletPoint, { backgroundColor: '#e74c3c' }]} />
                <ThemedText style={styles.avoidText}>{safeRenderText(item)}</ThemedText>
              </View>
            ))}
          </ThemedView>
        );
      } else if (typeof itemsToAvoid === 'object' && itemsToAvoid !== null) {
        return (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Items to Avoid</ThemedText>
            {Object.entries(itemsToAvoid).map(([key, value], index) => (
              <View key={index} style={styles.avoidItem}>
                <View style={[styles.bulletPoint, { backgroundColor: '#e74c3c' }]} />
                <ThemedText style={styles.avoidText}>{safeRenderText(value)}</ThemedText>
              </View>
            ))}
          </ThemedView>
        );
      }
      
      return null;
    } catch (error) {
      console.error("Error rendering items to avoid:", error);
      return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Menu Analysis</ThemedText>
        <ThemedText>Take a photo of a menu to get personalized recommendations</ThemedText>
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
          <Image source={{ uri: image }} style={styles.menuImage} />
          <Button 
            title="Analyze Menu" 
            onPress={analyzeMenu} 
            loading={loading}
            disabled={loading}
            buttonStyle={styles.analyzeButton}
          />
        </ThemedView>
      )}
      
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Analyzing menu...</ThemedText>
        </ThemedView>
      )}
      {analysis && (
        <ThemedView style={styles.resultsContainer}>
            <ThemedText type="subtitle" style={styles.resultsTitle}>Menu Recommendations</ThemedText>          
            {/* Recommendations */}
            {analysis.menu_recommendations && (
            <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recommended Choices</ThemedText>
                {renderRecommendations()}
            </ThemedView>
            )}
            
            {/* Items to avoid */}
            {renderItemsToAvoid()}
            {/* Store the recommendation */}
            <Button
                title="Save Recommendation"
                color={'forestgreen'}
                onPress={() => {
                    storeRecommendation(analysis);
                    setAnalysis(null);
                    setImage(null);
                }}
                buttonStyle={styles.analyzeButton}
                containerStyle={{ marginTop: 16 }}
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
  menuImage: {
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
  preferencesContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
  },
  radioGroup: {
    marginBottom: 10,
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
  recommendationsContainer: {
    gap: 16,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  modificationsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 4,
  },
  modificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a7ea4',
    marginTop: 8,
    marginRight: 8,
  },
  modificationText: {
    flex: 1,
    fontSize: 14,
  },
  avoidItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avoidText: {
    flex: 1,
  },
});