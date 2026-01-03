// app/itinerary/[id].tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../../constants/Colors';
import { Itinerary } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getItinerary } from '../../services/mockItineraryStorage';

const { width } = Dimensions.get('window');

export default function ItineraryDetail() {
    const { id } = useLocalSearchParams();
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadItinerary();
    }, [id]);

    const loadItinerary = async () => {
        try {
            // Load from global mock storage
            const loaded = getItinerary(id as string);
            if (loaded) {
                setItinerary(loaded);
            }
        } catch (error) {
            console.error('Error loading itinerary:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={Colors.error} />
                <Text style={styles.errorText}>Itinerary not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const allCoordinates = itinerary.days.flatMap(day =>
        day.attractions.map(attr => ({
            latitude: attr.latitude,
            longitude: attr.longitude,
        }))
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <SafeAreaView edges={['top']} style={styles.safeArea}>
                    {/* Header */}
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.header}
                    >
                        <IconButton
                            icon="arrow-left"
                            iconColor="#FFFFFF"
                            size={28}
                            onPress={() => router.back()}
                        />
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Your Itinerary</Text>
                            <Text style={styles.headerSubtitle}>{itinerary.preferences.days} Days</Text>
                        </View>
                        <IconButton
                            icon="share-variant"
                            iconColor="#FFFFFF"
                            size={24}
                            onPress={() => {}}
                        />
                    </LinearGradient>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Map */}
                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: allCoordinates[0]?.latitude || 7.8731,
                                    longitude: allCoordinates[0]?.longitude || 80.7718,
                                    latitudeDelta: 2,
                                    longitudeDelta: 2,
                                }}
                            >
                                {allCoordinates.map((coord, idx) => (
                                    <Marker key={idx} coordinate={coord}>
                                        <View style={styles.markerContainer}>
                                            <View style={styles.marker}>
                                                <Text style={styles.markerText}>{idx + 1}</Text>
                                            </View>
                                        </View>
                                    </Marker>
                                ))}
                                <Polyline
                                    coordinates={allCoordinates}
                                    strokeColor={Colors.primary}
                                    strokeWidth={3}
                                />
                            </MapView>
                        </View>

                        {/* Statistics */}
                        <View style={styles.statsContainer}>
                            {[
                                { icon: 'map-marker', value: itinerary.statistics.numAttractions, label: 'Places', color: Colors.primary },
                                { icon: 'cash', value: `${(itinerary.statistics.totalCost / 1000).toFixed(0)}K`, label: 'Cost', color: Colors.warning },
                                { icon: 'road', value: `${itinerary.statistics.totalDistance}km`, label: 'Distance', color: Colors.secondary },
                                { icon: 'clock', value: `${itinerary.statistics.totalHours}h`, label: 'Duration', color: Colors.success },
                            ].map((stat, idx) => (
                                <LinearGradient
                                    key={idx}
                                    colors={[stat.color, stat.color + 'DD']}
                                    style={styles.statCard}
                                >
                                    <MaterialCommunityIcons name={stat.icon as any} size={24} color="#FFFFFF" />
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </LinearGradient>
                            ))}
                        </View>

                        {/* Days */}
                        {itinerary.days.map((day, dayIdx) => (
                            <View key={dayIdx} style={styles.dayContainer}>
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.dayHeader}
                                >
                                    <Text style={styles.dayTitle}>Day {day.day}</Text>
                                    <View style={styles.dayMeta}>
                                        <Chip icon="clock" textStyle={styles.chipText} style={styles.chip}>
                                            {day.totalHours}h
                                        </Chip>
                                        <Chip icon="cash" textStyle={styles.chipText} style={styles.chip}>
                                            LKR {(day.totalCost / 1000).toFixed(0)}K
                                        </Chip>
                                    </View>
                                </LinearGradient>

                                {day.attractions.map((attraction, attrIdx) => (
                                    <TouchableOpacity key={attrIdx} style={styles.attractionCard}>
                                        <View style={styles.attractionNumber}>
                                            <Text style={styles.attractionNumberText}>{attrIdx + 1}</Text>
                                        </View>
                                        <View style={styles.attractionContent}>
                                            <Text style={styles.attractionName}>{attraction.name}</Text>
                                            <View style={styles.attractionMeta}>
                                                <View style={styles.attractionMetaItem}>
                                                    <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                                                    <Text style={styles.attractionMetaText}>{attraction.duration}h</Text>
                                                </View>
                                                <View style={styles.attractionMetaItem}>
                                                    <MaterialCommunityIcons name="cash" size={16} color={Colors.textSecondary} />
                                                    <Text style={styles.attractionMetaText}>LKR {attraction.cost}</Text>
                                                </View>
                                            </View>
                                            <Chip
                                                icon="tag"
                                                textStyle={{ fontSize: 11, color: Colors.primary }}
                                                style={styles.categoryChip}
                                            >
                                                {attraction.category}
                                            </Chip>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 18,
        color: Colors.text,
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: 25,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    mapContainer: {
        height: 250,
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    markerText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        fontWeight: '600',
    },
    dayContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: '#FFFFFF',
    },
    dayHeader: {
        padding: 20,
    },
    dayTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    dayMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    attractionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    attractionNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attractionNumberText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
    },
    attractionContent: {
        flex: 1,
    },
    attractionName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    attractionMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    attractionMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    attractionMetaText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight + '15',
        height: 28,
    },
});