// constants/API.ts
import Constants from 'expo-constants';

export const API_BASE_URL =
    (Constants.expoConfig?.extra?.apiUrl as string) ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://YOUR_LOCAL_IP:5000';

export const API_ENDPOINTS = {
    // Component 4: Itinerary Generation
    GENERATE_ITINERARY: '/api/itinerary/generate',
    GET_ITINERARY: '/api/itinerary',
    TRACK_BEHAVIOR: '/api/itinerary/track',

    // Component 1: Forecasting
    GET_FORECAST: '/api/forecast',
    FORECAST: '/api/forecast',
    GET_FORECAST_DISTRICT: '/api/forecast',

    // Component 2: Sentiment
    GET_SENTIMENT: '/api/sentiment',
    SENTIMENT: '/api/sentiment',

    // Component 3: Monitoring
    GET_MONITORING: '/api/monitoring/status',

    // Crisis scores (GDELT via training CSV)
    GET_CRISIS: '/api/crisis/current',

    // Popular destinations (Component 4 attractions CSV)
    GET_POPULAR_DESTINATIONS: '/api/destinations/popular',

    // Simulator what-if (calls Flask which runs Component 1)
    SIMULATE: '/api/simulate',

    // Weather (Flask proxies Open-Meteo)
    GET_WEATHER: '/api/weather',

    // Admin
    GET_STATS: '/api/admin/stats',

    // Health
    HEALTH: '/health',
};