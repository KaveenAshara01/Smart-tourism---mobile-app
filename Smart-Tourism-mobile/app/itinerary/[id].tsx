// app/itinerary/[id].tsx
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { Itinerary } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { itineraryService } from '../../services/itineraryService';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/API';

const { width } = Dimensions.get('window');

// ─── Category styling ────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    gradient: [string, string];
}> = {
    beach:         { icon: 'beach',            color: '#0288D1', gradient: ['#29B6F6', '#0288D1'] },
    historical:    { icon: 'bank',             color: '#5D4037', gradient: ['#8D6E63', '#5D4037'] },
    temple:        { icon: 'hand-heart',       color: '#7B1FA2', gradient: ['#AB47BC', '#7B1FA2'] },
    national_park: { icon: 'tree',             color: '#2E7D32', gradient: ['#66BB6A', '#2E7D32'] },
    waterfall:     { icon: 'water',            color: '#0097A7', gradient: ['#26C6DA', '#0097A7'] },
    mountain:      { icon: 'image-filter-hdr', color: '#455A64', gradient: ['#78909C', '#455A64'] },
    cultural:      { icon: 'drama-masks',      color: '#E64A19', gradient: ['#FF7043', '#E64A19'] },
    city:          { icon: 'city-variant',     color: '#1565C0', gradient: ['#42A5F5', '#1565C0'] },
    adventure:     { icon: 'bike',             color: '#F57C00', gradient: ['#FFA726', '#F57C00'] },
    wildlife:      { icon: 'paw',              color: '#558B2F', gradient: ['#9CCC65', '#558B2F'] },
    general:       { icon: 'map-marker',       color: Colors.primary, gradient: [Colors.primary, Colors.primaryDark] },
};

const DAY_GRADIENTS: [string, string][] = [
    ['#1976D2', '#0D47A1'], ['#2E7D32', '#1B5E20'], ['#7B1FA2', '#4A148C'],
    ['#E65100', '#BF360C'], ['#00838F', '#006064'], ['#5D4037', '#3E2723'],
    ['#AD1457', '#880E4F'],
];

function getCfg(cat: string) { return CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.general; }

// ─── Behavior simulation types ───────────────────────────────────────────────
type SimStep =
    | { type: 'on_track'; attraction: string; category: string; day: string }
    | { type: 'deviation'; planned: string; unplanned: string; category: string }
    | { type: 'analysis'; discovered: string }
    | { type: 'recommendations'; items: RecommendedItem[] };

interface RecommendedItem {
    id: number;
    name: string;
    category: string;
    popularity_score: number;
    avg_cost: number;
    avg_duration_hours: number;
    match_reason: string;
    rec_score: number;
}

// Hardcoded realistic unplanned visits for the demo
const UNPLANNED_VISITS = [
    { name: 'Udawalawe National Park', category: 'wildlife', lat: 6.4399, lon: 80.8997 },
    { name: 'Pidurangala Rock', category: 'adventure', lat: 7.9609, lon: 80.7559 },
    { name: 'Yala National Park', category: 'wildlife', lat: 6.3728, lon: 81.5180 },
    { name: 'Adams Peak', category: 'mountain', lat: 6.8096, lon: 80.4994 },
    { name: 'Arugam Bay', category: 'beach', lat: 6.8403, lon: 81.8360 },
];

export default function ItineraryDetail() {
    const { id } = useLocalSearchParams();
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);

    // GPS / current location
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

    // Behavior simulation state
    const [simRunning, setSimRunning] = useState(false);
    const [simSteps, setSimSteps] = useState<SimStep[]>([]);
    const [simDone, setSimDone] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
    const simScrollRef = useRef<ScrollView>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const mapRef = useRef<MapView>(null);

    useEffect(() => { loadItinerary(); }, [id]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationStatus('denied');
                return;
            }
            setLocationStatus('granted');
            try {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setUserLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            } catch {
                setLocationStatus('denied');
            }
        })();
    }, []);

    const fitMapToAttractions = (coords: { latitude: number; longitude: number }[], loc: { latitude: number; longitude: number } | null) => {
        if (!mapRef.current || coords.length === 0) return;
        const all = loc ? [...coords, loc] : coords;
        mapRef.current.fitToCoordinates(all, {
            edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
            animated: true,
        });
    };

    const loadItinerary = async () => {
        try {
            const loaded = await itineraryService.getItinerary(id as string);
            if (loaded) setItinerary(loaded);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ── Simulation engine ────────────────────────────────────────────────────
    const runSimulation = async () => {
        if (!itinerary || simRunning) return;
        setSimRunning(true);
        setSimDone(false);
        setSimSteps([]);
        setRecommendations([]);

        const allAttractions = (itinerary.days ?? []).flatMap(d =>
            (d.attractions ?? []).map(a => ({ ...a, dayLabel: `Day ${d.day ?? 1}` }))
        );

        const addStep = (step: SimStep) => {
            setSimSteps(prev => [...prev, step]);
            setTimeout(() => simScrollRef.current?.scrollToEnd({ animated: true }), 100);
        };

        // Start pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        // Phase 1: follow plan for 2-3 attractions
        const trackCount = Math.min(3, allAttractions.length);
        for (let i = 0; i < trackCount; i++) {
            await delay(1000);
            const a = allAttractions[i];
            addStep({ type: 'on_track', attraction: a.name, category: a.category, day: a.dayLabel });
        }

        // Phase 2: deviate to an unplanned attraction
        await delay(1200);
        const unplanned = UNPLANNED_VISITS[Math.floor(Math.random() * UNPLANNED_VISITS.length)];
        addStep({
            type: 'deviation',
            planned: allAttractions[Math.min(trackCount, allAttractions.length - 1)]?.name ?? 'Planned stop',
            unplanned: unplanned.name,
            category: unplanned.category,
        });

        // Phase 3: system analyses the deviation
        await delay(1400);
        addStep({ type: 'analysis', discovered: unplanned.category });

        // Phase 4: fetch real recommendations from Flask
        await delay(1200);
        try {
            const excludeIds = allAttractions
                .map((a: any) => a.id ?? a.attraction_id)
                .filter(Boolean);
            const res = await axios.post(`${API_BASE_URL}/api/itinerary/recommend`, {
                category: unplanned.category,
                exclude_ids: excludeIds,
                limit: 4,
            });
            const recs: RecommendedItem[] = res.data.recommendations ?? [];
            setRecommendations(recs);
            addStep({ type: 'recommendations', items: recs });
        } catch {
            // Fallback inline recommendations
            const fallback: RecommendedItem[] = [
                { id: 99, name: 'Bundala National Park', category: unplanned.category, popularity_score: 0.88,
                    avg_cost: 3500, avg_duration_hours: 4, match_reason: 'Same interest', rec_score: 0.91 },
                { id: 98, name: 'Minneriya National Park', category: unplanned.category, popularity_score: 0.85,
                    avg_cost: 4000, avg_duration_hours: 3.5, match_reason: 'Same interest', rec_score: 0.87 },
            ];
            setRecommendations(fallback);
            addStep({ type: 'recommendations', items: fallback });
        }

        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        setSimDone(true);
        setSimRunning(false);
    };

    const resetSim = () => {
        setSimSteps([]);
        setSimDone(false);
        setRecommendations([]);
        pulseAnim.setValue(1);
    };

    // ── Loading / error states ───────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading your itinerary...</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.error} />
                <Text style={styles.errorTitle}>Itinerary Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.backBtnGrad}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    const allAttractions = (itinerary.days ?? []).flatMap(d => d.attractions ?? []);
    const allCoords = allAttractions
        .filter(a => a.latitude && a.longitude)
        .map(a => ({ latitude: a.latitude, longitude: a.longitude }));

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    {/* ── Header ── */}
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Your Itinerary</Text>
                            <Text style={styles.headerSub}>
                                {itinerary.preferences?.days ?? itinerary.days?.length ?? '?'} Days · {allAttractions.length} Places
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.headerBtn}>
                            <MaterialCommunityIcons name="share-variant" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* ── Map ── */}
                        <View style={styles.mapWrap}>
                            {/* GPS status badge */}
                            <View style={styles.gpsBadge}>
                                <View style={[
                                    styles.gpsDot,
                                    { backgroundColor: locationStatus === 'granted' ? '#4CAF50' : locationStatus === 'denied' ? '#F44336' : '#FF9800' }
                                ]} />
                                <Text style={styles.gpsBadgeText}>
                                    {locationStatus === 'granted' ? 'GPS Active' : locationStatus === 'denied' ? 'GPS Denied' : 'GPS...'}
                                </Text>
                            </View>

                            {/* Recenter button */}
                            <TouchableOpacity
                                style={styles.recenterBtn}
                                onPress={() => fitMapToAttractions(allCoords, userLocation)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.primary} />
                            </TouchableOpacity>

                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                provider={PROVIDER_DEFAULT}
                                initialRegion={{
                                    latitude: allCoords[0]?.latitude ?? 7.8731,
                                    longitude: allCoords[0]?.longitude ?? 80.7718,
                                    latitudeDelta: 3.0, longitudeDelta: 3.0,
                                }}
                                onMapReady={() => fitMapToAttractions(allCoords, userLocation)}
                                showsUserLocation={false}
                                showsMyLocationButton={false}
                                showsCompass
                                showsScale
                            >
                                {/* Attraction markers — native pinColor, works on both iOS and Android */}
                                {allCoords.map((coord, idx) => {
                                    const attr = allAttractions[idx];
                                    const cfg = getCfg(attr?.category ?? 'general');
                                    return (
                                        <Marker
                                            key={`attr-${idx}`}
                                            coordinate={coord}
                                            pinColor={cfg.color}
                                            title={attr?.name ?? ''}
                                            description={attr?.category?.replace('_', ' ') ?? ''}
                                        />
                                    );
                                })}

                                {/* Route polyline */}
                                {allCoords.length > 1 && (
                                    <Polyline
                                        coordinates={allCoords}
                                        strokeColor={Colors.primary}
                                        strokeWidth={2.5}
                                        lineDashPattern={[6, 4]}
                                    />
                                )}

                                {/* Current location marker — native blue pin */}
                                {userLocation && (
                                    <Marker
                                        key="user-location"
                                        coordinate={userLocation}
                                        pinColor="#2196F3"
                                        title="Your Location"
                                        description="You are here"
                                    />
                                )}
                            </MapView>
                        </View>

                        {/* ── Stats strip ── */}
                        <View style={styles.statsStrip}>
                            {[
                                { icon: 'map-marker-multiple' as const, val: String(allAttractions.length), label: 'Places', color: Colors.primary },
                                { icon: 'cash' as const, val: `${((itinerary.statistics?.totalCost ?? 0) / 1000).toFixed(0)}K`, label: 'LKR', color: '#FF9800' },
                                { icon: 'road' as const, val: `${itinerary.statistics?.totalDistance ?? 0}`, label: 'km', color: '#2196F3' },
                                { icon: 'clock' as const, val: `${itinerary.statistics?.totalHours ?? 0}h`, label: 'Time', color: '#9C27B0' },
                            ].map((s, i) => (
                                <View key={i} style={styles.statItem}>
                                    <View style={[styles.statCircle, { backgroundColor: s.color + '18' }]}>
                                        <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
                                    </View>
                                    <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                                    <Text style={styles.statLbl}>{s.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* ── Full itinerary — all days continuous ── */}
                        <View style={styles.itinerarySection}>
                            <Text style={styles.itinTitle}>Full Itinerary</Text>

                            {(itinerary.days ?? []).map((day, dayIdx) => {
                                const dayGrad = DAY_GRADIENTS[dayIdx % DAY_GRADIENTS.length];
                                const attractions = day.attractions ?? [];

                                return (
                                    <View key={dayIdx} style={styles.dayBlock}>
                                        {/* Day header */}
                                        <LinearGradient colors={dayGrad} style={styles.dayHeader}>
                                            <View style={styles.dayNumCircle}>
                                                <Text style={styles.dayNumText}>{day.day ?? dayIdx + 1}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.dayHeaderTitle}>
                                                    {`Day ${day.day ?? dayIdx + 1}`}
                                                </Text>
                                                <Text style={styles.dayHeaderSub}>
                                                    {attractions.length} attractions
                                                    {day.totalHours ? ` · ${day.totalHours}h` : ''}
                                                    {day.totalCost ? ` · LKR ${((day.totalCost) / 1000).toFixed(0)}K` : ''}
                                                </Text>
                                            </View>
                                            {/* Category dots */}
                                            <View style={styles.dayCatDots}>
                                                {[...new Set((day.categories ?? attractions.map(a => a.category)))].slice(0, 3).map((c, ci) => (
                                                    <View key={ci} style={[styles.dayCatDot, { backgroundColor: getCfg(c).color + '55' }]}>
                                                        <MaterialCommunityIcons name={getCfg(c).icon} size={12} color="#FFFFFF" />
                                                    </View>
                                                ))}
                                            </View>
                                        </LinearGradient>

                                        {/* Attraction timeline */}
                                        {attractions.map((attr, attrIdx) => {
                                            const cfg = getCfg(attr.category);
                                            const isLast = attrIdx === attractions.length - 1;
                                            return (
                                                <View key={attrIdx} style={styles.attrRow}>
                                                    {/* Timeline column */}
                                                    <View style={styles.timelineCol}>
                                                        <LinearGradient colors={cfg.gradient} style={styles.timelineDot}>
                                                            <MaterialCommunityIcons name={cfg.icon} size={15} color="#FFFFFF" />
                                                        </LinearGradient>
                                                        {!isLast && <View style={[styles.timelineLine, { backgroundColor: cfg.color + '35' }]} />}
                                                    </View>

                                                    {/* Card */}
                                                    <View style={styles.attrCard}>
                                                        {/* Top: number + name + ML score */}
                                                        <View style={styles.attrTop}>
                                                            <View style={[styles.attrNum, { backgroundColor: cfg.color + '18' }]}>
                                                                <Text style={[styles.attrNumText, { color: cfg.color }]}>{attrIdx + 1}</Text>
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.attrName} numberOfLines={2}>{attr.name}</Text>
                                                                <View style={[styles.catChip, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
                                                                    <MaterialCommunityIcons name={cfg.icon} size={10} color={cfg.color} />
                                                                    <Text style={[styles.catChipText, { color: cfg.color }]}>
                                                                        {attr.category.replace('_', ' ')}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                            <View style={styles.mlBadge}>
                                                                <MaterialCommunityIcons name="robot-outline" size={11} color={Colors.primary} />
                                                                <Text style={styles.mlBadgeText}>
                                                                    {((attr.mlScore ?? 0.5) * 100).toFixed(0)}%
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        {/* Meta chips */}
                                                        <View style={styles.metaRow}>
                                                            <View style={styles.metaChip}>
                                                                <MaterialCommunityIcons name="clock-outline" size={12} color="#78909C" />
                                                                <Text style={styles.metaText}>{attr.duration ?? 2}h</Text>
                                                            </View>
                                                            <View style={styles.metaChip}>
                                                                <MaterialCommunityIcons name="cash" size={12} color="#78909C" />
                                                                <Text style={styles.metaText}>LKR {((attr.cost ?? 0) / 1000).toFixed(1)}K</Text>
                                                            </View>
                                                            <View style={styles.metaChip}>
                                                                <MaterialCommunityIcons name="star" size={12} color="#FFC107" />
                                                                <Text style={styles.metaText}>{(attr.popularity ?? 0.8).toFixed(2)}</Text>
                                                            </View>
                                                        </View>

                                                        {attr.description ? (
                                                            <Text style={styles.attrDesc} numberOfLines={2}>{attr.description}</Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            );
                                        })}

                                        {/* Day footer summary */}
                                        <LinearGradient colors={[dayGrad[0] + 'EE', dayGrad[1] + 'CC']} style={styles.dayFooter}>
                                            {[
                                                { icon: 'clock' as const, label: `${day.totalHours ?? attractions.reduce((s, a) => s + (a.duration ?? 2), 0)}h` },
                                                { icon: 'cash' as const, label: `LKR ${((day.totalCost ?? attractions.reduce((s, a) => s + (a.cost ?? 0), 0)) / 1000).toFixed(0)}K` },
                                                { icon: 'map-marker-check' as const, label: `${attractions.length} stops` },
                                            ].map((f, fi) => (
                                                <View key={fi} style={styles.dayFooterItem}>
                                                    <MaterialCommunityIcons name={f.icon} size={16} color="rgba(255,255,255,0.9)" />
                                                    <Text style={styles.dayFooterText}>{f.label}</Text>
                                                </View>
                                            ))}
                                        </LinearGradient>

                                        {/* Spacer between days */}
                                        {dayIdx < (itinerary.days ?? []).length - 1 && (
                                            <View style={styles.daySeparator}>
                                                <View style={styles.daySepLine} />
                                                <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} />
                                                <View style={styles.daySepLine} />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* ── Behavioral Adaptation Demo ── */}
                        <View style={styles.behaviorSection}>
                            <LinearGradient colors={['#1A237E', '#283593']} style={styles.behaviorHeader}>
                                <View style={styles.decorCircle} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={styles.behaviorIconBg}>
                                        <MaterialCommunityIcons name="robot-excited" size={28} color="#FFFFFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.behaviorTitle}>Behavioral Adaptation</Text>
                                        <Text style={styles.behaviorSub}>
                                            Simulate how the AI learns from your unplanned visits and adapts future recommendations
                                        </Text>
                                    </View>
                                </View>

                                {/* How it works */}
                                <View style={styles.howItWorksRow}>
                                    {[
                                        { icon: 'map-marker-radius', label: 'GPS tracks your location' },
                                        { icon: 'arrow-decision', label: 'Detects unplanned visits' },
                                        { icon: 'brain', label: 'Learns your preferences' },
                                        { icon: 'star-circle', label: 'Recommends similar places' },
                                    ].map((step, i) => (
                                        <View key={i} style={styles.howItWorksStep}>
                                            <View style={styles.howStepIcon}>
                                                <MaterialCommunityIcons name={step.icon as any} size={16} color="#FFFFFF" />
                                            </View>
                                            <Text style={styles.howStepText}>{step.label}</Text>
                                            {i < 3 && <MaterialCommunityIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />}
                                        </View>
                                    ))}
                                </View>
                            </LinearGradient>

                            {/* Simulation log */}
                            {simSteps.length > 0 && (
                                <ScrollView
                                    ref={simScrollRef}
                                    style={styles.simLog}
                                    nestedScrollEnabled
                                    scrollEnabled={false}
                                >
                                    {simSteps.map((step, i) => (
                                        <SimStepRow key={i} step={step} index={i} />
                                    ))}
                                    {simRunning && (
                                        <View style={styles.simTyping}>
                                            <ActivityIndicator size="small" color={Colors.primary} />
                                            <Text style={styles.simTypingText}>Processing...</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            )}

                            {/* Recommendations panel */}
                            {recommendations.length > 0 && (
                                <View style={styles.recsPanel}>
                                    <View style={styles.recsPanelHeader}>
                                        <MaterialCommunityIcons name="star-circle" size={20} color="#FF9800" />
                                        <Text style={styles.recsPanelTitle}>AI Recommendations For You</Text>
                                    </View>
                                    <Text style={styles.recsPanelSub}>
                                        Based on your unplanned visit, we found places you'll love
                                    </Text>
                                    {recommendations.map((rec, i) => {
                                        const cfg = getCfg(rec.category);
                                        return (
                                            <View key={i} style={styles.recCard}>
                                                <View style={[styles.recIconBg, { backgroundColor: cfg.color + '18' }]}>
                                                    <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.recName}>{rec.name}</Text>
                                                    <View style={styles.recMeta}>
                                                        <Text style={[styles.recCategory, { color: cfg.color }]}>
                                                            {rec.category.replace('_', ' ')}
                                                        </Text>
                                                        <Text style={styles.recMetaSep}>·</Text>
                                                        <Text style={styles.recMetaText}>{rec.avg_duration_hours}h</Text>
                                                        <Text style={styles.recMetaSep}>·</Text>
                                                        <Text style={styles.recMetaText}>LKR {(rec.avg_cost / 1000).toFixed(1)}K</Text>
                                                    </View>
                                                    <View style={styles.recReasonBadge}>
                                                        <MaterialCommunityIcons name="check-circle" size={11} color="#4CAF50" />
                                                        <Text style={styles.recReasonText}>{rec.match_reason}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.recScore}>
                                                    <Text style={styles.recScoreVal}>{(rec.rec_score * 100).toFixed(0)}</Text>
                                                    <Text style={styles.recScorePct}>%</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Simulate button */}
                            {!simDone ? (
                                <TouchableOpacity
                                    style={[styles.simButton, simRunning && { opacity: 0.7 }]}
                                    onPress={runSimulation}
                                    disabled={simRunning}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient colors={['#1A237E', '#3949AB']} style={styles.simButtonGrad}>
                                        {simRunning ? (
                                            <>
                                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                                    <MaterialCommunityIcons name="map-marker-radius" size={22} color="#FFFFFF" />
                                                </Animated.View>
                                                <Text style={styles.simButtonText}>Simulating GPS tracking...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="play-circle" size={22} color="#FFFFFF" />
                                                <Text style={styles.simButtonText}>Run Behavior Simulation</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.resetButton} onPress={resetSim}>
                                    <MaterialCommunityIcons name="refresh" size={18} color={Colors.primary} />
                                    <Text style={styles.resetButtonText}>Run Again</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ height: 50 }} />
                    </ScrollView>
                </SafeAreaView>
            </View>
        </>
    );
}

// ─── Simulation step renderer ─────────────────────────────────────────────────
function SimStepRow({ step, index }: { step: SimStep; index: number }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    return (
        <Animated.View style={[styles.simStep, { opacity: fadeAnim }]}>
            {step.type === 'on_track' && (
                <View style={styles.simStepInner}>
                    <View style={[styles.simStepIcon, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialCommunityIcons name="map-marker-check" size={18} color="#4CAF50" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.simStepLabel}>On Track — {step.day}</Text>
                        <Text style={styles.simStepValue}>{step.attraction}</Text>
                        <View style={styles.simTag}>
                            <MaterialCommunityIcons name={getCfg(step.category).icon} size={11} color={getCfg(step.category).color} />
                            <Text style={[styles.simTagText, { color: getCfg(step.category).color }]}>
                                {step.category.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                </View>
            )}

            {step.type === 'deviation' && (
                <View style={[styles.simStepInner, { backgroundColor: '#FFF3E0' }]}>
                    <View style={[styles.simStepIcon, { backgroundColor: '#FFE0B2' }]}>
                        <MaterialCommunityIcons name="map-marker-alert" size={18} color="#FF9800" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.simStepLabel, { color: '#E65100' }]}>Unplanned Visit Detected</Text>
                        <Text style={styles.simStepSmall}>Skipped: {step.planned}</Text>
                        <Text style={[styles.simStepValue, { color: '#E65100' }]}>{step.unplanned}</Text>
                        <View style={[styles.simTag, { backgroundColor: getCfg(step.category).color + '18' }]}>
                            <MaterialCommunityIcons name={getCfg(step.category).icon} size={11} color={getCfg(step.category).color} />
                            <Text style={[styles.simTagText, { color: getCfg(step.category).color }]}>
                                {step.category.replace('_', ' ')} — new interest
                            </Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9800" />
                </View>
            )}

            {step.type === 'analysis' && (
                <View style={[styles.simStepInner, { backgroundColor: '#E3F2FD' }]}>
                    <View style={[styles.simStepIcon, { backgroundColor: '#BBDEFB' }]}>
                        <MaterialCommunityIcons name="brain" size={18} color="#1976D2" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.simStepLabel, { color: '#0D47A1' }]}>Preference Analysis</Text>
                        <Text style={styles.simStepValue}>New interest discovered: {step.discovered.replace('_', ' ')}</Text>
                        <Text style={styles.simStepSmall}>Updating user preference model...</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#1976D2" />
                </View>
            )}

            {step.type === 'recommendations' && (
                <View style={[styles.simStepInner, { backgroundColor: '#F3E5F5' }]}>
                    <View style={[styles.simStepIcon, { backgroundColor: '#E1BEE7' }]}>
                        <MaterialCommunityIcons name="star-shooting" size={18} color="#7B1FA2" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.simStepLabel, { color: '#4A148C' }]}>Recommendations Generated</Text>
                        <Text style={styles.simStepValue}>{step.items.length} similar attractions found</Text>
                        <Text style={styles.simStepSmall}>Scroll down to see your personalised recommendations</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-down-circle" size={20} color="#7B1FA2" />
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 20 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
    backButton: { borderRadius: 25, overflow: 'hidden' },
    backBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, gap: 8 },
    backBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10 },
    headerBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    // Map
    mapWrap: {
        marginHorizontal: 16, marginTop: 16, height: 300, borderRadius: 24, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18, shadowRadius: 12, elevation: 12,
    },
    map: { flex: 1 },
    // marker styles removed — using native pinColor
    // GPS badge (top-left overlay)
    gpsBadge: {
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20,
    },
    gpsDot: { width: 8, height: 8, borderRadius: 4 },
    gpsBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
    // Recenter button (top-right overlay)
    recenterBtn: {
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
    },
    // userLocation styles removed — using native pinColor
    // Stats
    statsStrip: {
        flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '900' },
    statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
    // Itinerary
    itinerarySection: { paddingHorizontal: 16, marginTop: 24 },
    itinTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 20 },
    dayBlock: { marginBottom: 8 },
    dayHeader: {
        borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
        marginBottom: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18, shadowRadius: 8, elevation: 8,
    },
    dayNumCircle: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center',
    },
    dayNumText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
    dayHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
    dayHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 3 },
    dayCatDots: { flexDirection: 'row', gap: 5 },
    dayCatDot: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
    },
    // Attraction timeline
    attrRow: { flexDirection: 'row' },
    timelineCol: { width: 44, alignItems: 'center' },
    timelineDot: {
        width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', zIndex: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
    },
    timelineLine: { flex: 1, width: 2, marginTop: 2, marginBottom: 2 },
    attrCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 4, marginLeft: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
    },
    attrTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    attrNum: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    attrNumText: { fontSize: 12, fontWeight: '900' },
    attrName: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20 },
    catChip: {
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginTop: 4,
    },
    catChipText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    mlBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: Colors.primary + '12', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10,
    },
    mlBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
    metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    metaChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F5F7F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    },
    metaText: { fontSize: 12, fontWeight: '600', color: '#607D8B' },
    attrDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, lineHeight: 18 },
    // Day footer
    dayFooter: {
        borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-around',
        marginTop: 4, marginBottom: 4,
    },
    dayFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dayFooterText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.95)' },
    // Day separator
    daySeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
    daySepLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    // Behavioral adaptation section
    behaviorSection: { marginHorizontal: 16, marginTop: 28 },
    behaviorHeader: { borderRadius: 24, padding: 24, overflow: 'hidden', marginBottom: 16 },
    decorCircle: {
        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)',
    },
    behaviorIconBg: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
    },
    behaviorTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
    behaviorSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19 },
    howItWorksRow: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, gap: 4,
    },
    howItWorksStep: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    howStepIcon: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    },
    howStepText: { fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '600', flexShrink: 1 },
    // Sim log
    simLog: { marginBottom: 12 },
    simStep: { marginBottom: 8 },
    simStepInner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
        backgroundColor: '#FFFFFF', borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 3,
    },
    simStepIcon: {
        width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    simStepLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, marginBottom: 2 },
    simStepValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    simStepSmall: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
    simTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
        backgroundColor: Colors.primary + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    simTagText: { fontSize: 11, fontWeight: '700' },
    simTyping: {
        flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
        backgroundColor: '#F5F5F5', borderRadius: 12, marginBottom: 8,
    },
    simTypingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    // Recommendations panel
    recsPanel: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    recsPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    recsPanelTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    recsPanelSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14 },
    recCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    recIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    recName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
    recMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
    recCategory: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    recMetaSep: { fontSize: 12, color: Colors.textSecondary },
    recMetaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    recReasonBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    recReasonText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
    recScore: { alignItems: 'center', justifyContent: 'center' },
    recScoreVal: { fontSize: 22, fontWeight: '900', color: Colors.primary, lineHeight: 24 },
    recScorePct: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' },
    // Sim button
    simButton: {
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#1A237E', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
        marginBottom: 12,
    },
    simButtonGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    simButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    resetButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 20,
        borderWidth: 1.5, borderColor: Colors.primary + '50',
        backgroundColor: Colors.primary + '08', marginBottom: 12,
    },
    resetButtonText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});