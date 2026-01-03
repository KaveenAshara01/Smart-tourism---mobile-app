// services/mockItineraryStorage.ts
import { Itinerary } from '../types';

// Global storage for mock itineraries (simulates database)
let CURRENT_ITINERARY: Itinerary | null = null;
const ITINERARY_STORAGE = new Map<string, Itinerary>();

export function storeItinerary(itinerary: Itinerary): void {
    CURRENT_ITINERARY = itinerary;
    ITINERARY_STORAGE.set(itinerary.id, itinerary);
}

export function getItinerary(id: string): Itinerary | null {
    // First check current
    if (CURRENT_ITINERARY?.id === id) {
        return CURRENT_ITINERARY;
    }
    // Then check storage
    return ITINERARY_STORAGE.get(id) || null;
}

export function getCurrentItinerary(): Itinerary | null {
    return CURRENT_ITINERARY;
}

export function getAllItineraries(): Itinerary[] {
    return Array.from(ITINERARY_STORAGE.values());
}

export function deleteItinerary(id: string): boolean {
    if (CURRENT_ITINERARY?.id === id) {
        CURRENT_ITINERARY = null;
    }
    return ITINERARY_STORAGE.delete(id);
}

export function clearAllItineraries(): void {
    CURRENT_ITINERARY = null;
    ITINERARY_STORAGE.clear();
}