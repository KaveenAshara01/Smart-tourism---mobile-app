// constants/API.ts

// Update this to your backend URL (Flask API)
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000';  // e.g., 'http://192.168.1.100:5000'

export const API_ENDPOINTS = {
    // Component 4: Itinerary Generation
    GENERATE_ITINERARY: '/api/itinerary/generate',
    GET_ITINERARY: '/api/itinerary',
    TRACK_BEHAVIOR: '/api/itinerary/track',

    // Component 1: Forecasting
    GET_FORECAST: '/api/forecast',

    // Component 2: Sentiment
    GET_SENTIMENT: '/api/sentiment',

    // Admin
    GET_STATS: '/api/admin/stats',
};