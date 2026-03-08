// services/itineraryService.ts
import axios from 'axios';
import {
    collection, addDoc, getDocs, doc, getDoc, deleteDoc,
    query, where, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/API';
import { ItineraryRequest, Itinerary, ItineraryDay, Attraction } from '../types';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Normalize raw Flask response → typed Itinerary ─────────────────────────
// Backend returns: { id, days:[{dayNumber, title, attractions:[...]}], statistics:{totalDistance,totalCost,totalHours,attractionCount} }
// Frontend type:  { id, days:[{day, categories, totalHours, totalCost, attractions:[...]}], statistics:{numAttractions,...} }

function normalizeDays(rawDays: any[]): ItineraryDay[] {
    if (!Array.isArray(rawDays)) return [];
    return rawDays.map((d: any) => {
        const attractions: Attraction[] = Array.isArray(d.attractions)
            ? d.attractions.map((a: any) => ({
                id: a.id ?? 0,
                name: a.name ?? 'Unknown',
                category: a.category ?? 'general',
                latitude: a.latitude ?? 0,
                longitude: a.longitude ?? 0,
                duration: a.duration ?? a.avg_duration_hours ?? 2,
                cost: a.cost ?? a.avg_cost ?? 0,
                mlScore: a.ml_score ?? a.mlScore ?? 0.5,
                popularity: a.rating ?? a.popularity_score ?? 0.8,
                description: a.description ?? '',
            }))
            : [];

        const categories = [...new Set(attractions.map(a => a.category))];
        const totalHours = attractions.reduce((s, a) => s + (a.duration ?? 0), 0);
        const totalCost = attractions.reduce((s, a) => s + (a.cost ?? 0), 0);

        return {
            day: d.dayNumber ?? d.day ?? 1,
            attractions,
            totalHours: Math.round(totalHours * 10) / 10,
            totalCost: Math.round(totalCost),
            categories,
        } as ItineraryDay;
    });
}

function normalizeStatistics(raw: any, days: ItineraryDay[]): Itinerary['statistics'] {
    const numAttractions = raw?.attractionCount
        ?? raw?.numAttractions
        ?? days.reduce((s, d) => s + d.attractions.length, 0);
    return {
        totalDistance: raw?.totalDistance ?? 0,
        totalCost: raw?.totalCost ?? 0,
        totalHours: raw?.totalHours ?? 0,
        numAttractions,
    };
}

// ─── Itinerary Service ───────────────────────────────────────────────────────

export const itineraryService = {

    generateItinerary: async (request: ItineraryRequest): Promise<Itinerary> => {
        const response = await api.post(API_ENDPOINTS.GENERATE_ITINERARY, request);
        const data = response.data;

        const days = normalizeDays(data.days ?? []);
        const statistics = normalizeStatistics(data.statistics, days);

        const itinerary: Itinerary = {
            id: data.id ?? '',
            userId: request.userId,
            createdAt: new Date(),
            preferences: request,
            days,
            statistics,
        };

        const docRef = await addDoc(collection(db, 'itineraries'), {
            ...itinerary,
            createdAt: Timestamp.fromDate(itinerary.createdAt),
        });

        itinerary.id = docRef.id;
        return itinerary;
    },

    getItinerary: async (itineraryId: string): Promise<Itinerary | null> => {
        const snap = await getDoc(doc(db, 'itineraries', itineraryId));
        if (!snap.exists()) return null;
        const d = snap.data();
        const days = normalizeDays(d.days ?? []);
        return {
            ...d,
            id: snap.id,
            createdAt: d.createdAt?.toDate?.() ?? new Date(d.createdAt),
            days,
            statistics: normalizeStatistics(d.statistics, days),
        } as Itinerary;
    },

    getUserItineraries: async (userId: string): Promise<Itinerary[]> => {
        const q = query(
            collection(db, 'itineraries'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            const days = normalizeDays(data.days ?? []);
            return {
                ...data,
                id: d.id,
                createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
                days,
                statistics: normalizeStatistics(data.statistics, days),
            } as Itinerary;
        });
    },

    deleteItinerary: async (itineraryId: string): Promise<void> => {
        await deleteDoc(doc(db, 'itineraries', itineraryId));
    },

    trackBehavior: async (behaviorData: object): Promise<void> => {
        try {
            await api.post(API_ENDPOINTS.TRACK_BEHAVIOR, behaviorData);
        } catch {
            // non-critical
        }
    },
};

// ─── Forecast Service (Component 1) ─────────────────────────────────────────

export interface ForecastResult {
    prediction_month: string;
    country_level: {
        estimated_unique_tourists: number;
        total_district_visits: number;
    };
    district_level: Record<string, {
        predicted_visitors: number;
        visit_probability_pct: number;
        market_share_pct: number;
    }>;
    model_metadata: { mape: number; r2: number };
}

export interface DistrictForecast {
    district: string;
    month: string;
    predicted_visitors: number;
    visit_probability_pct: number;
    market_share_pct: number;
    country_level: { estimated_unique_tourists: number; total_district_visits: number };
}

export const forecastService = {
    getForecast: async (scenario?: object): Promise<ForecastResult> => {
        const response = await api.post(API_ENDPOINTS.FORECAST, { scenario: scenario ?? {} });
        return response.data as ForecastResult;
    },

    getDistrictForecast: async (district: string, month: string): Promise<DistrictForecast> => {
        const response = await api.get(`${API_ENDPOINTS.GET_FORECAST_DISTRICT}/${district}/${month}`);
        return response.data as DistrictForecast;
    },
};

// ─── Sentiment Service (Component 2) ────────────────────────────────────────

export interface SentimentResult {
    results: Array<{
        text: string;
        score: number;
        score_100: number;
        label: 'Positive' | 'Neutral' | 'Negative';
    }>;
    aggregate: { avg_score: number; avg_score_100: number; label: string; count: number };
}

export interface DistrictSentiment {
    district: string;
    sentiment_score: number;
    sentiment_label: string;
    sample_count: number;
}

export const sentimentService = {
    analyzeTexts: async (texts: string[]): Promise<SentimentResult> => {
        const response = await api.post(API_ENDPOINTS.SENTIMENT, { texts });
        return response.data as SentimentResult;
    },

    getDistrictSentiment: async (district: string): Promise<DistrictSentiment> => {
        const response = await api.get(`${API_ENDPOINTS.GET_SENTIMENT}/district/${district}`);
        return response.data as DistrictSentiment;
    },

    getAllDistrictSentiments: async (): Promise<Record<string, DistrictSentiment>> => {
        const response = await api.get(`${API_ENDPOINTS.GET_SENTIMENT}/districts`);
        return response.data as Record<string, DistrictSentiment>;
    },
};

// ─── Weather Service (Open-Meteo via Flask proxy) ────────────────────────────

export interface DistrictWeather {
    district: string;
    temperature: number;
    condition: string;
    humidity: number;
    windspeed: number;
    rainfall_mm: number;
}

export const weatherService = {
    getAllDistrictWeather: async (): Promise<Record<string, DistrictWeather>> => {
        const response = await api.get(API_ENDPOINTS.GET_WEATHER);
        return response.data as Record<string, DistrictWeather>;
    },
};

// ─── Crisis Service (GDELT data via Flask) ───────────────────────────────────

export interface CrisisScores {
    month: string;
    source: string;
    scores: {
        unrest: number;
        terror: number;
        economic: number;
        disaster: number;
        disease: number;
        crime: number;
        diplomacy: number;
        composite_crisis: number;
    };
}

export const crisisService = {
    getCurrentScores: async (): Promise<CrisisScores | null> => {
        try {
            const response = await api.get(API_ENDPOINTS.GET_CRISIS);
            return response.data as CrisisScores;
        } catch {
            return null;
        }
    },
};

// ─── Popular Destinations Service ────────────────────────────────────────────

export interface PopularDestination {
    id: number;
    name: string;
    category: string;
    emoji: string;
    latitude: number;
    longitude: number;
    popularity_score: number;
    avg_cost: number;
    avg_duration_hours: number;
    safety_rating: number;
    rating: number;
}

export const destinationsService = {
    getPopular: async (limit = 8, category?: string): Promise<PopularDestination[]> => {
        const params: any = { limit };
        if (category) params.category = category;
        const response = await api.get(API_ENDPOINTS.GET_POPULAR_DESTINATIONS, { params });
        return (response.data as any).destinations as PopularDestination[];
    },
};

// ─── Monitoring Service (Component 3) ────────────────────────────────────────

export interface MonitoringStatus {
    model_version: string;
    last_run: string;
    drift_detected: boolean;
    severity: string;
    avg_mape: number;
    xgboost_weight: number;
    lstm_weight: number;
    action_taken: string;
}

export const monitoringService = {
    getStatus: async (): Promise<MonitoringStatus | null> => {
        try {
            const response = await api.get(API_ENDPOINTS.GET_MONITORING);
            return response.data as MonitoringStatus;
        } catch {
            return null;
        }
    },
};

// ─── Simulator Service (calls Flask → Component 1 for what-if) ───────────────

export interface SimulateRequest {
    district: string;
    month: number;
    temperature: number;
    rainfall: number;
    humidity: number;
    terror_score: number;
    economic_score: number;
    unrest_score: number;
    disaster_score: number;
    disease_score: number;
    crime_score: number;
    diplomacy_score: number;
}

export interface SimulateResult {
    district: string;
    month: number;
    predicted_visitors: number;
    baseline_visitors: number;
    change_percent: number;
    country_total: number;
    confidence: number;
}

export const simulatorService = {
    simulate: async (params: SimulateRequest): Promise<SimulateResult> => {
        const response = await api.post(API_ENDPOINTS.SIMULATE, params);
        return response.data as SimulateResult;
    },
};