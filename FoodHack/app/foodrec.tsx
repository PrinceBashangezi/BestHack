import { supabase } from './supabase';
import OpenAI from 'openai';

const getFoodRecommendations = async (BMI: string, menu: string[], healthGoals: string[]): Promise<string[]> => {
    // Initialize the OpenAI client with your API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error("OPENAI_API_KEY is not found.");
    }
    const client = new OpenAI();
    const query = await client.responses.create({
        model: "gpt-4o",
        input: 'What are some food recommendations portions for a person with a BMI of ' + BMI + ' who is looking to ' + healthGoals.join(', ') + '? The menu includes: ' + menu.join(', ') + '.',
    });
    const response = query.output_text
    const recommendations = response.split('\n').map(item => item.trim()).filter(item => item !== '');
    await saveToFoodHistory(recommendations)
    return recommendations;
}

const saveToFoodHistory = async (recommendations: string[]) => {
    const { error } = await supabase
        .from('recommendations')
        .insert(recommendations.map(rec => ({
            recommendation: rec,
            created_at: new Date().toISOString()
        })));

    if (error) {
        console.error("Error saving recommendations:", error);
        throw new Error("Failed to save recommendations.");
    }
}

