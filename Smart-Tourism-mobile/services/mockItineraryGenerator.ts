// services/mockItineraryGenerator.ts - FIXED VERSION
import { ItineraryRequest, Itinerary, ItineraryDay, Attraction } from '../types';

// Load attractions data
const ATTRACTIONS: Attraction[] = [
    // Beach
    { id: 1, name: 'Unawatuna Beach', category: 'beach', latitude: 6.0104, longitude: 80.2482, duration: 4.0, cost: 2000, mlScore: 0.88, popularity: 0.88 },
    { id: 2, name: 'Mirissa Beach', category: 'beach', latitude: 5.9462, longitude: 80.4586, duration: 5.0, cost: 2500, mlScore: 0.90, popularity: 0.90 },
    { id: 3, name: 'Bentota Beach', category: 'beach', latitude: 6.4258, longitude: 79.9968, duration: 4.5, cost: 3000, mlScore: 0.82, popularity: 0.82 },
    { id: 5, name: 'Negombo Beach', category: 'beach', latitude: 7.2088, longitude: 79.8358, duration: 3.0, cost: 1500, mlScore: 0.75, popularity: 0.75 },

    // Historical
    { id: 9, name: 'Sigiriya Rock Fortress', category: 'historical', latitude: 7.957, longitude: 80.7603, duration: 3.5, cost: 5500, mlScore: 0.95, popularity: 0.95 },
    { id: 10, name: 'Galle Dutch Fort', category: 'historical', latitude: 6.0265, longitude: 80.2168, duration: 3.0, cost: 1000, mlScore: 0.92, popularity: 0.92 },
    { id: 11, name: 'Polonnaruwa Ancient City', category: 'historical', latitude: 7.9403, longitude: 81.0188, duration: 4.5, cost: 4500, mlScore: 0.87, popularity: 0.87 },
    { id: 12, name: 'Anuradhapura Sacred City', category: 'historical', latitude: 8.3114, longitude: 80.4037, duration: 5.0, cost: 4000, mlScore: 0.90, popularity: 0.90 },

    // Temples
    { id: 15, name: 'Temple of the Sacred Tooth Relic', category: 'temple', latitude: 7.2935, longitude: 80.6407, duration: 2.0, cost: 2000, mlScore: 0.93, popularity: 0.93 },
    { id: 16, name: 'Kelaniya Raja Maha Vihara', category: 'temple', latitude: 6.9553, longitude: 79.9223, duration: 1.5, cost: 500, mlScore: 0.75, popularity: 0.75 },
    { id: 17, name: 'Gangaramaya Temple', category: 'temple', latitude: 6.9167, longitude: 79.8561, duration: 1.5, cost: 500, mlScore: 0.78, popularity: 0.78 },
    { id: 13, name: 'Dambulla Cave Temple', category: 'temple', latitude: 7.8606, longitude: 80.6489, duration: 2.5, cost: 2500, mlScore: 0.88, popularity: 0.88 },

    // National Parks
    { id: 19, name: 'Yala National Park', category: 'national_park', latitude: 6.3725, longitude: 81.5075, duration: 6.0, cost: 8000, mlScore: 0.93, popularity: 0.93 },
    { id: 24, name: 'Udawalawe National Park', category: 'national_park', latitude: 6.4398, longitude: 80.8975, duration: 5.0, cost: 6500, mlScore: 0.85, popularity: 0.85 },
    { id: 27, name: 'Minneriya National Park', category: 'national_park', latitude: 8.0167, longitude: 80.8833, duration: 4.5, cost: 6000, mlScore: 0.82, popularity: 0.82 },

    // Waterfalls
    { id: 30, name: 'Ramboda Falls', category: 'waterfall', latitude: 7.0333, longitude: 80.7667, duration: 1.5, cost: 0, mlScore: 0.75, popularity: 0.75 },
    { id: 31, name: 'Ravana Falls', category: 'waterfall', latitude: 6.8667, longitude: 81.05, duration: 1.0, cost: 0, mlScore: 0.78, popularity: 0.78 },
    { id: 32, name: 'Diyaluma Falls', category: 'waterfall', latitude: 6.7667, longitude: 81.0167, duration: 2.0, cost: 0, mlScore: 0.72, popularity: 0.72 },

    // Mountains
    { id: 37, name: 'Adams Peak (Sri Pada)', category: 'mountain', latitude: 6.8094, longitude: 80.4994, duration: 8.0, cost: 500, mlScore: 0.88, popularity: 0.88 },
    { id: 38, name: 'Ella Rock', category: 'mountain', latitude: 6.8667, longitude: 81.05, duration: 4.0, cost: 0, mlScore: 0.85, popularity: 0.85 },
    { id: 39, name: 'Little Adams Peak', category: 'mountain', latitude: 6.8667, longitude: 81.0333, duration: 2.0, cost: 0, mlScore: 0.80, popularity: 0.80 },

    // Cultural
    { id: 42, name: 'Colombo National Museum', category: 'cultural', latitude: 6.9104, longitude: 79.8612, duration: 2.5, cost: 1000, mlScore: 0.72, popularity: 0.72 },
    { id: 43, name: 'Pinnawala Elephant Orphanage', category: 'cultural', latitude: 7.2975, longitude: 80.3886, duration: 3.0, cost: 3500, mlScore: 0.85, popularity: 0.85 },
    { id: 45, name: 'Kandyan Dance Performance', category: 'cultural', latitude: 7.2906, longitude: 80.6337, duration: 1.5, cost: 1500, mlScore: 0.78, popularity: 0.78 },

    // City
    { id: 48, name: 'Galle Face Green', category: 'city', latitude: 6.9271, longitude: 79.8450, duration: 2.0, cost: 0, mlScore: 0.70, popularity: 0.70 },
    { id: 49, name: 'Pettah Market', category: 'city', latitude: 6.9392, longitude: 79.8520, duration: 2.5, cost: 500, mlScore: 0.68, popularity: 0.68 },
    { id: 50, name: 'One Galle Face Mall', category: 'city', latitude: 6.9271, longitude: 79.8450, duration: 3.0, cost: 2000, mlScore: 0.72, popularity: 0.72 },
];

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function generateMockItinerary(request: ItineraryRequest): Itinerary {
    const { days, categories, distance, budget, startLocation, travelers } = request;

    let filteredAttractions = ATTRACTIONS.filter(attr =>
        categories.includes(attr.category)
    );

    const maxDailyDistance = distance === 'local' ? 75 :
        distance === 'regional' ? 175 : 350;

    filteredAttractions.sort((a, b) =>
        (b.popularity + b.mlScore) - (a.popularity + a.mlScore)
    );

    const itineraryDays: ItineraryDay[] = [];
    const usedAttractions = new Set<number>();
    let currentLat = startLocation.coordinates.latitude;
    let currentLon = startLocation.coordinates.longitude;
    let totalDistance = 0;
    let totalCost = 0;
    let totalHours = 0;

    // FIXED: Ensure realistic distribution
    for (let dayNum = 1; dayNum <= days; dayNum++) {
        const dayAttractions: Attraction[] = [];
        let dayHours = 0;
        let dayCost = 0;
        const dayCategories = new Set<string>();
        const targetHours = 8;
        const minAttractionsPerDay = 2; // MINIMUM 2
        const maxAttractionsPerDay = 4; // MAXIMUM 4

        // Find nearby attractions
        const nearbyAttractions = filteredAttractions.filter(attr => {
            if (usedAttractions.has(attr.id)) return false;
            const dist = haversineDistance(currentLat, currentLon, attr.latitude, attr.longitude);
            return dist <= maxDailyDistance * 0.8; // Increased radius
        });

        // Fallback to all remaining if not enough nearby
        const availableAttractions = nearbyAttractions.length >= minAttractionsPerDay
            ? nearbyAttractions
            : filteredAttractions.filter(attr => !usedAttractions.has(attr.id));

        // Select attractions
        for (const attraction of availableAttractions) {
            if (dayAttractions.length >= maxAttractionsPerDay) break;

            // Ensure minimum attractions, then check time
            if (dayAttractions.length >= minAttractionsPerDay &&
                dayHours + attraction.duration > targetHours + 2) break;

            // Diversity
            if (dayCategories.has(attraction.category) && dayAttractions.length > 0) {
                if (Math.random() > 0.4) continue;
            }

            dayAttractions.push(attraction);
            dayCategories.add(attraction.category);
            dayHours += attraction.duration;
            dayCost += attraction.cost * travelers;
            usedAttractions.add(attraction.id);

            currentLat = attraction.latitude;
            currentLon = attraction.longitude;
        }

        // CRITICAL: Ensure at least one attraction per day
        if (dayAttractions.length === 0 && availableAttractions.length > 0) {
            const fallback = availableAttractions[0];
            dayAttractions.push(fallback);
            dayCategories.add(fallback.category);
            dayHours += fallback.duration;
            dayCost += fallback.cost * travelers;
            usedAttractions.add(fallback.id);
            currentLat = fallback.latitude;
            currentLon = fallback.longitude;
        }

        // Calculate distances
        let dayDistance = 0;
        for (let i = 0; i < dayAttractions.length - 1; i++) {
            dayDistance += haversineDistance(
                dayAttractions[i].latitude,
                dayAttractions[i].longitude,
                dayAttractions[i + 1].latitude,
                dayAttractions[i + 1].longitude
            );
        }

        totalDistance += dayDistance;
        totalCost += dayCost;
        totalHours += dayHours;

        itineraryDays.push({
            day: dayNum,
            attractions: dayAttractions,
            totalHours: dayHours,
            totalCost: dayCost,
            categories: Array.from(dayCategories),
        });
    }

    return {
        id: `itinerary_${Date.now()}`,
        userId: request.userId,
        createdAt: new Date(),
        preferences: request,
        days: itineraryDays,
        statistics: {
            totalDistance: Math.round(totalDistance),
            totalCost: Math.round(totalCost),
            totalHours: Math.round(totalHours * 10) / 10,
            numAttractions: itineraryDays.reduce((sum, day) => sum + day.attractions.length, 0),
        },
    };
}