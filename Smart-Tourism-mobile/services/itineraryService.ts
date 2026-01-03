// services/itineraryService.ts
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/API';
import { ItineraryRequest, Itinerary } from '../types';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,  // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

export const itineraryService = {
    // Generate new itinerary
    generateItinerary: async (request: ItineraryRequest): Promise<Itinerary> => {
        const response = await api.post(API_ENDPOINTS.GENERATE_ITINERARY, request);
        return response.data;
    },

    // Get itinerary by ID
    getItinerary: async (itineraryId: string): Promise<Itinerary> => {
        const response = await api.get(`${API_ENDPOINTS.GET_ITINERARY}/${itineraryId}`);
        return response.data;
    },

    // Get user's itineraries
    getUserItineraries: async (userId: string): Promise<Itinerary[]> => {
        const response = await api.get(`${API_ENDPOINTS.GET_ITINERARY}/user/${userId}`);
        return response.data;
    },

    // Track user behavior
    trackBehavior: async (behaviorData: any): Promise<void> => {
        await api.post(API_ENDPOINTS.TRACK_BEHAVIOR, behaviorData);
    },

    // Get forecast data
    getForecast: async (district: string, month: string): Promise<any> => {
        const response = await api.get(`${API_ENDPOINTS.GET_FORECAST}/${district}/${month}`);
        return response.data;
    },

    // Get sentiment data
    getSentiment: async (attractionId: number): Promise<any> => {
        const response = await api.get(`${API_ENDPOINTS.GET_SENTIMENT}/${attractionId}`);
        return response.data;
    },
};