// types/index.ts

export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: 'tourist' | 'admin';
    createdAt: Date;
}

export interface ItineraryRequest {
    userId: string;
    budget: number;
    days: number;
    distance: 'local' | 'regional' | 'nationwide';
    travelers: number;
    categories: string[];
    season: number;
    startLocation: {
        name: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
}

export interface Itinerary {
    id: string;
    userId: string;
    createdAt: Date;
    preferences: ItineraryRequest;
    days: ItineraryDay[];
    statistics: {
        totalDistance: number;
        totalCost: number;
        totalHours: number;
        numAttractions: number;
    };
}

export interface ItineraryDay {
    day: number;
    attractions: Attraction[];
    totalHours: number;
    totalCost: number;
    categories: string[];
}

export interface Attraction {
    id: number;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    duration: number;
    cost: number;
    mlScore: number;
    popularity: number;
    description?: string;
}

export interface BehaviorLog {
    userId: string;
    itineraryId: string;
    timestamp: Date;
    location: {
        latitude: number;
        longitude: number;
    };
    plannedAttraction?: string;
    actualAttraction?: string;
    deviationType: 'on_track' | 'deviation' | 'unplanned';
}