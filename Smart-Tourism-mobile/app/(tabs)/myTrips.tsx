// app/(tabs)/myTrips.tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, FAB, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { Itinerary } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Mock data - replace with actual API call
const MOCK_ITINERARIES: Itinerary[] = [];

export default function MyTrips() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>(MOCK_ITINERARIES);
    const [loading, setLoading] = useState(false);

    const renderItinerary = ({ item }: { item: Itinerary }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/itinerary/${item.id}`)}
            style={styles.cardContainer}
        >
            <LinearGradient
                colors={['#FFFFFF', '#F8FBF9']}
                style={styles.card}
            >
                {/* Header with gradient */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardHeader}
                >
                    <View style={styles.cardHeaderContent}>
                        <View style={styles.cardIconBg}>
                            <MaterialCommunityIcons name="map-marker-path" size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>
                                {item.preferences.days} Day Adventure
                            </Text>
                            <Text style={styles.cardDate}>
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                            </Text>
                        </View>
                    </View>

                    {/* Decorative circles */}
                    <View style={[styles.decorCircle, { top: -20, right: -20, width: 80, height: 80 }]} />
                    <View style={[styles.decorCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} />
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconBg, { backgroundColor: '#4CAF50' + '20' }]}>
                            <MaterialCommunityIcons name="map-marker-multiple" size={20} color="#4CAF50" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{item.statistics.numAttractions}</Text>
                            <Text style={styles.statLabel}>Places</Text>
                        </View>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconBg, { backgroundColor: '#FF9800' + '20' }]}>
                            <MaterialCommunityIcons name="cash" size={20} color="#FF9800" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>
                                {(item.statistics.totalCost / 1000).toFixed(0)}K
                            </Text>
                            <Text style={styles.statLabel}>Budget</Text>
                        </View>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconBg, { backgroundColor: '#2196F3' + '20' }]}>
                            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#2196F3" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{item.statistics.totalDistance}</Text>
                            <Text style={styles.statLabel}>km</Text>
                        </View>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categories}>
                    <Text style={styles.categoriesLabel}>Activities:</Text>
                    <View style={styles.categoryTags}>
                        {item.days[0]?.categories.slice(0, 3).map((cat, idx) => (
                            <View key={idx} style={styles.categoryTag}>
                                <Text style={styles.categoryText}>{cat}</Text>
                            </View>
                        ))}
                        {item.days[0]?.categories.length > 3 && (
                            <View style={styles.categoryTag}>
                                <Text style={styles.categoryText}>+{item.days[0].categories.length - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* View Button */}
                <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </LinearGradient>
        </TouchableOpacity>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                style={styles.emptyCircle}
            >
                <MaterialCommunityIcons name="bag-suitcase-off-outline" size={64} color={Colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyText}>
                Start planning your dream vacation!{'\n'}
                Create your first AI-powered itinerary
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/home')}
            >
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyButtonGradient}
                >
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.emptyButtonText}>Create Itinerary</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {/* Header */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>My Trips</Text>
                            <Text style={styles.headerSubtitle}>
                                {itineraries.length} {itineraries.length === 1 ? 'itinerary' : 'itineraries'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.filterButton}>
                            <MaterialCommunityIcons name="filter-variant" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {itineraries.length === 0 ? (
                    <EmptyState />
                ) : (
                    <FlatList
                        data={itineraries}
                        renderItem={renderItinerary}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* FAB */}
                {itineraries.length > 0 && (
                    <FAB
                        icon="plus"
                        style={styles.fab}
                        onPress={() => router.push('/(tabs)/home')}
                        color="#FFFFFF"
                        customSize={64}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FBF9',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    cardContainer: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    cardHeader: {
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cardHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardHeaderText: {
        marginLeft: 16,
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    cardDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
        marginHorizontal: 8,
    },
    categories: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    categoriesLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    categoryTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryTag: {
        backgroundColor: Colors.primaryLight + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primaryLight + '40',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: 8,
    },
    viewButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
    },
});