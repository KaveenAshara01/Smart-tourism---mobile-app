// app/(tabs)/myTrips.tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { Itinerary } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { itineraryService } from '../../services/itineraryService';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    beach: 'beach',
    historical: 'bank',
    temple: 'hand-heart',
    national_park: 'tree',
    waterfall: 'water',
    mountain: 'image-filter-hdr',
    cultural: 'drama-masks',
    city: 'city-variant',
    adventure: 'bike',
    wildlife: 'paw',
    general: 'map-marker',
};

export default function MyTrips() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) loadItineraries();
    }, [user]);

    const loadItineraries = async () => {
        try {
            setLoading(true);
            const data = await itineraryService.getUserItineraries(user!.uid);
            setItineraries(data);
        } catch (error) {
            console.error('Error loading itineraries:', error);
        } finally {
            setLoading(false);
        }
    };

    // Collect all unique categories across all days (safe even if categories is undefined)
    const getAllCategories = (item: Itinerary): string[] => {
        const cats = new Set<string>();
        (item.days ?? []).forEach(d => {
            (d.categories ?? []).forEach(c => cats.add(c));
            // fallback: derive from attractions if categories missing
            if (!d.categories?.length) {
                (d.attractions ?? []).forEach(a => { if (a.category) cats.add(a.category); });
            }
        });
        return [...cats];
    };

    const renderItinerary = ({ item }: { item: Itinerary }) => {
        const categories = getAllCategories(item);
        const shown = categories.slice(0, 3);
        const extra = categories.length - 3;
        const totalAttractions = (item.days ?? []).reduce((s, d) => s + (d.attractions?.length ?? 0), 0);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/itinerary/${item.id}`)}
                style={styles.cardContainer}
            >
                <View style={styles.card}>
                    {/* Gradient header */}
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardHeader}
                    >
                        <View style={styles.cardIconBg}>
                            <MaterialCommunityIcons name="map-marker-path" size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>
                                {item.preferences?.days ?? (item.days?.length ?? '?')} Day Adventure
                            </Text>
                            <Text style={styles.cardDate}>
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                            </Text>
                        </View>
                        {/* Decorative circles */}
                        <View style={[styles.decorCircle, { top: -20, right: -20, width: 80, height: 80 }]} />
                        <View style={[styles.decorCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} />
                    </LinearGradient>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        {[
                            {
                                icon: 'map-marker-multiple' as const,
                                value: String(totalAttractions),
                                label: 'Places',
                                color: '#4CAF50',
                            },
                            {
                                icon: 'cash' as const,
                                value: `${((item.statistics?.totalCost ?? 0) / 1000).toFixed(0)}K`,
                                label: 'LKR',
                                color: '#FF9800',
                            },
                            {
                                icon: 'map-marker-distance' as const,
                                value: `${item.statistics?.totalDistance ?? 0}`,
                                label: 'km',
                                color: '#2196F3',
                            },
                        ].map((stat, i, arr) => (
                            <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.statIconBg, { backgroundColor: stat.color + '22' }]}>
                                    <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                                </View>
                                <View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                                {i < arr.length - 1 && <View style={styles.statDivider} />}
                            </View>
                        ))}
                    </View>

                    {/* Category pills */}
                    {categories.length > 0 && (
                        <View style={styles.categories}>
                            <Text style={styles.categoriesLabel}>Activities:</Text>
                            <View style={styles.categoryTags}>
                                {shown.map((cat, idx) => (
                                    <View key={idx} style={styles.categoryTag}>
                                        <MaterialCommunityIcons
                                            name={CATEGORY_ICONS[cat] ?? 'map-marker'}
                                            size={13}
                                            color={Colors.primary}
                                        />
                                        <Text style={styles.categoryText}>
                                            {cat.replace('_', ' ')}
                                        </Text>
                                    </View>
                                ))}
                                {extra > 0 && (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryText}>+{extra}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* View button */}
                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => router.push(`/itinerary/${item.id}`)}
                    >
                        <Text style={styles.viewButtonText}>View Details</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

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

                {itineraries.length === 0 && !loading ? (
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

                {itineraries.length > 0 && (
                    <FAB
                        icon="plus"
                        style={styles.fab}
                        onPress={() => router.push('/questionnaire')}
                        color="#FFFFFF"
                        customSize={64}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FBF9' },
    safeArea: { flex: 1 },
    header: {
        marginHorizontal: 16, marginTop: 16, borderRadius: 20,
        overflow: 'hidden', shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    headerContent: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 16,
    },
    headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
    filterButton: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center', alignItems: 'center',
    },
    list: { padding: 16 },
    cardContainer: { marginBottom: 20 },
    card: {
        borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
    },
    cardHeader: { padding: 20, position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
    cardIconBg: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    cardHeaderText: { flex: 1 },
    cardTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
    cardDate: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    statsRow: {
        flexDirection: 'row', paddingVertical: 18,
        paddingHorizontal: 16, alignItems: 'center',
    },
    statIconBg: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },
    statValue: { fontSize: 17, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
    statDivider: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: 8 },
    categories: { paddingHorizontal: 16, paddingBottom: 12 },
    categoriesLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
    categoryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    categoryTag: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.primaryLight + '18',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
        borderWidth: 1, borderColor: Colors.primaryLight + '30',
    },
    categoryText: { fontSize: 12, fontWeight: '600', color: Colors.primary, textTransform: 'capitalize' },
    viewButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8,
    },
    viewButtonText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyCircle: {
        width: 160, height: 160, borderRadius: 80,
        justifyContent: 'center', alignItems: 'center', marginBottom: 32,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 16,
    },
    emptyTitle: { fontSize: 28, fontWeight: '900', color: Colors.text, marginBottom: 12 },
    emptyText: {
        fontSize: 15, color: Colors.textSecondary,
        textAlign: 'center', lineHeight: 22, marginBottom: 32,
    },
    emptyButton: {
        borderRadius: 25, overflow: 'hidden',
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
    },
    emptyButtonGradient: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 32, gap: 10,
    },
    emptyButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    fab: {
        position: 'absolute', right: 16, bottom: 16,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 16,
    },
});