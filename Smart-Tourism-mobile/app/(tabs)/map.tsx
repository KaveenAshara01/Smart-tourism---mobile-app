// app/(tabs)/map.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE, Geojson } from 'react-native-maps';
import { Colors } from '../../constants/Colors';
import { DISTRICT_DATA, getTrafficColor, getCrisisColor, DistrictData } from '../../utils/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import districtsGeoJson from '../../utils/lkaDistrictsGeoJson';
import { Animated } from 'react-native';
import {
    forecastService, ForecastResult,
    sentimentService, DistrictSentiment,
    weatherService, DistrictWeather,
    crisisService, CrisisScores,
} from '../../services/itineraryService';

const { width, height } = Dimensions.get('window');

const PEAK_MONTHS = [12, 1, 2, 7, 8]; // Dec-Feb, Jul-Aug: high season
const SHOULDER_MONTHS = [3, 11]; // Mar, Nov: shoulder

function monthSeasonMultiplier(month: number): number {
    if (PEAK_MONTHS.includes(month)) return 1.0;
    if (SHOULDER_MONTHS.includes(month)) return 0.75;
    return 0.55; // low season Apr-Jun, Sep-Oct (monsoon)
}

// Tourist presence follows a bell curve peaking around 10:00-15:00
function timeOfDayFactor(hour: number): number {
    // Pre-dawn: very few tourists at sites
    if (hour < 6) return 0.05;
    if (hour < 8) return 0.2 + (hour - 6) * 0.15;   // 6-8 rising
    if (hour < 10) return 0.5 + (hour - 8) * 0.15;  // 8-10 rising
    if (hour < 15) return 0.8 + (15 - Math.abs(hour - 12)) * 0.04; // 10-15 peak
    if (hour < 18) return 0.7 - (hour - 15) * 0.12; // 15-18 declining
    if (hour < 20) return 0.3 - (hour - 18) * 0.1;  // 18-20 evening low
    return 0.1;
}

function dayOfWeekFactor(dow: number): number {
    // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) return 1.1; // weekends busier
    if (dow === 5) return 1.05;
    return 0.9;
}

function simulateLiveCount(mlMonthlyBaseline: number, districtId: string): number {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const dow = now.getDay();
    const month = now.getMonth() + 1;

    const seasonMult = monthSeasonMultiplier(month);
    const todMult = timeOfDayFactor(hour);
    const dowMult = dayOfWeekFactor(dow);

    // mlMonthlyBaseline is total monthly visitors; divide by days then apply fractions
    const dailyBase = (mlMonthlyBaseline * seasonMult) / 30;
    const liveEstimate = dailyBase * todMult * dowMult;

    // Add small deterministic noise per district so they don't all move identically
    // Using districtId char code sum as a stable seed offset
    const seed = districtId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const noiseOffset = ((seed % 17) - 8) * 0.01; // ±8% max
    const withNoise = liveEstimate * (1 + noiseOffset);

    return Math.max(10, Math.round(withNoise));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DigitalTwinMap() {
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
    const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
    const [districtData, setDistrictData] = useState<DistrictData[]>(DISTRICT_DATA);
    const [sentiments, setSentiments] = useState<Record<string, DistrictSentiment>>({});
    const [weather, setWeather] = useState<Record<string, DistrictWeather>>({});
    const [crisisScores, setCrisisScores] = useState<CrisisScores | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    const pulseAnim = useRef(new Animated.Value(0)).current;
    const mapRef = useRef<MapView>(null);

    // Pulse animation for high-traffic districts
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    // Center map on Sri Lanka
    useEffect(() => {
        mapRef.current?.animateToRegion({
            latitude: 7.8731,
            longitude: 80.7718,
            latitudeDelta: 3.5,
            longitudeDelta: 3.5,
        });
    }, []);

    // Load all real data in parallel
    useEffect(() => {
        const load = async () => {
            const [forecastResult, sentimentResult, weatherResult, crisisResult] = await Promise.allSettled([
                forecastService.getForecast(),
                sentimentService.getAllDistrictSentiments(),
                weatherService.getAllDistrictWeather(),
                crisisService.getCurrentScores(),
            ]);

            const forecast = forecastResult.status === 'fulfilled' ? forecastResult.value : null;
            const sent = sentimentResult.status === 'fulfilled' ? sentimentResult.value : {};
            const wx = weatherResult.status === 'fulfilled' ? weatherResult.value : {};
            const crisis = crisisResult.status === 'fulfilled' ? crisisResult.value : null;

            setForecastData(forecast);
            setSentiments(sent);
            setWeather(wx);
            setCrisisScores(crisis);

            // Merge real data into district records
            const merged = DISTRICT_DATA.map(d => {
                const key = d.id.toLowerCase();
                const fl = forecast?.district_level[key];
                const w = wx[key];

                const mlBaseline = fl ? fl.predicted_visitors : d.currentStats.touristCount;
                const liveCount = simulateLiveCount(mlBaseline, d.id);

                return {
                    ...d,
                    currentStats: {
                        ...d.currentStats,
                        touristCount: liveCount,
                        weatherTemp: w ? Math.round(w.temperature) : d.currentStats.weatherTemp,
                        weatherCondition: w ? w.condition : d.currentStats.weatherCondition,
                    },
                    forecast: fl ? {
                        nextMonth: Math.round(fl.predicted_visitors * 1.05),
                        confidence: Math.round(100 - (forecast?.model_metadata?.mape ?? 10)),
                    } : d.forecast,
                };
            });

            setDistrictData(merged);
            setDataLoaded(true);
        };

        load().catch(() => setDataLoaded(true));

        // Refresh live counts every 5 minutes without re-fetching ML/weather
        const refreshInterval = setInterval(() => {
            setDistrictData(prev => prev.map(d => {
                const key = d.id.toLowerCase();
                const fl = forecastData?.district_level[key];
                const mlBaseline = fl ? fl.predicted_visitors : d.currentStats.touristCount;
                return {
                    ...d,
                    currentStats: {
                        ...d.currentStats,
                        touristCount: simulateLiveCount(mlBaseline, d.id),
                    },
                };
            }));
        }, 5 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, []);

    // Crisis scores: real GDELT data from Flask (0-1 scale) + per-district BERT sentiment
    const getDistrictCrisisScores = useCallback((district: DistrictData) => {
        const key = district.id.toLowerCase();
        const sentData = sentiments[key];
        const baseSafety = district.currentStats.safetyScore / 100;

        // Sentiment: real BERT score if available, else derive from forecast or safety
        const fl = forecastData?.district_level[key];
        const sentimentScore = sentData
            ? sentData.sentiment_score
            : (fl ? Math.min(1, fl.visit_probability_pct / 100 * 0.9 + 0.1) : baseSafety * 0.85);

        // Use real GDELT-derived crisis scores if available, else fall back to safety-derived estimates
        const gdelt = crisisScores?.scores;
        return {
            sentiment: sentimentScore,
            terror:    gdelt ? gdelt.terror    : Math.max(0, (1 - baseSafety) * 0.3),
            economic:  gdelt ? gdelt.economic  : 0.15 + (1 - baseSafety) * 0.1,
            unrest:    gdelt ? gdelt.unrest    : Math.max(0, (1 - baseSafety) * 0.2),
            disaster:  gdelt ? gdelt.disaster  : 0.08,
            disease:   gdelt ? gdelt.disease   : 0.05,
            crime:     gdelt ? gdelt.crime     : Math.max(0, (1 - baseSafety) * 0.25),
            diplomacy: gdelt ? gdelt.diplomacy : 0.03,
        };
    }, [sentiments, forecastData, crisisScores]);

    const getDistrictFillColor = (trafficLevel: number) => {
        if (trafficLevel < 40) return 'rgba(76, 175, 80, 0.45)';
        if (trafficLevel < 70) return 'rgba(255, 193, 7, 0.55)';
        return 'rgba(244, 67, 54, 0.65)';
    };

    const getDistrictStrokeColor = (trafficLevel: number) => {
        if (trafficLevel < 40) return '#4CAF50';
        if (trafficLevel < 70) return '#FFC107';
        return '#F44336';
    };

    const getPulseOpacity = (trafficLevel: number) => {
        if (trafficLevel >= 70) return 0.55;
        if (trafficLevel >= 40) return 0.30;
        return 0;
    };

    function buildFeatureCollectionForDistrict(all: any, districtName: string) {
        return {
            type: 'FeatureCollection' as const,
            features: all.features.filter(
                (f: any) => f?.properties?.name === districtName
            ),
        };
    }

    const getWeatherIcon = (condition: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
        const c = condition.toLowerCase();
        if (c.includes('thunder')) return 'weather-lightning-rainy';
        if (c.includes('rain') || c.includes('shower')) return 'weather-rainy';
        if (c.includes('cloud')) return 'weather-cloudy';
        if (c.includes('fog') || c.includes('mist')) return 'weather-fog';
        return 'weather-sunny';
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                mapType="terrain"
                initialRegion={{
                    latitude: 7.8731,
                    longitude: 80.7718,
                    latitudeDelta: 3.5,
                    longitudeDelta: 3.5,
                }}
            >
                {districtData.map((d) => {
                    const fc = buildFeatureCollectionForDistrict(districtsGeoJson, d.name);
                    if (!fc.features.length) return null;
                    return (
                        <View key={`district-${d.id}`}>
                            <Geojson
                                geojson={fc as any}
                                strokeWidth={0}
                                fillColor={getDistrictFillColor(d.currentStats.trafficLevel)}
                            />
                            {d.currentStats.trafficLevel >= 40 && (
                                <Animated.View style={{ position: 'absolute', opacity: getPulseOpacity(d.currentStats.trafficLevel) }}>
                                    <Geojson
                                        geojson={fc as any}
                                        strokeWidth={0}
                                        fillColor={d.currentStats.trafficLevel >= 70 ? '#F44336' : '#FFC107'}
                                    />
                                </Animated.View>
                            )}
                        </View>
                    );
                })}

                {districtData.map((district) => (
                    <Marker
                        key={`marker-${district.id}`}
                        coordinate={district.coordinates}
                        onPress={() => setSelectedDistrict(district)}
                        tracksViewChanges={false}
                    >
                        <View style={styles.markerContainer}>
                            <LinearGradient
                                colors={[
                                    getDistrictStrokeColor(district.currentStats.trafficLevel),
                                    getDistrictStrokeColor(district.currentStats.trafficLevel) + 'DD',
                                ]}
                                style={styles.marker}
                            >
                                <Text style={styles.markerText}>
                                    {district.currentStats.touristCount >= 1000
                                        ? `${(district.currentStats.touristCount / 1000).toFixed(1)}K`
                                        : district.currentStats.touristCount.toString()}
                                </Text>
                            </LinearGradient>
                            <View style={[styles.markerArrow, {
                                borderTopColor: getDistrictStrokeColor(district.currentStats.trafficLevel),
                            }]} />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerContainer}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>Digital Twin</Text>
                            <Text style={styles.headerSubtitle}>
                                {dataLoaded ? 'Live monitoring' : 'Loading data...'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </SafeAreaView>

            {/* Legend */}
            <View style={styles.legendContainer}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.legend}
                >
                    <Text style={styles.legendTitle}>Traffic Level</Text>
                    <View style={styles.legendItems}>
                        {[
                            { label: 'Low', color: '#4CAF50' },
                            { label: 'Medium', color: '#FFC107' },
                            { label: 'High', color: '#F44336' },
                        ].map(item => (
                            <View key={item.label} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <Text style={styles.legendText}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>
            </View>

            {/* District modal */}
            {selectedDistrict && (
                <Modal
                    visible={true}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setSelectedDistrict(null)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={styles.modalBackdrop}
                            activeOpacity={1}
                            onPress={() => setSelectedDistrict(null)}
                        />
                        <View style={styles.modalContainer}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryDark]}
                                style={styles.modalHeader}
                            >
                                <View style={styles.modalHeaderContent}>
                                    <View style={styles.modalIconBg}>
                                        <MaterialCommunityIcons name="map-marker" size={28} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.modalHeaderText}>
                                        <Text style={styles.modalTitle}>{selectedDistrict.name}</Text>
                                        <Text style={styles.modalSubtitle}>District Overview</Text>
                                    </View>
                                    <IconButton
                                        icon="close"
                                        iconColor="#FFFFFF"
                                        size={24}
                                        onPress={() => setSelectedDistrict(null)}
                                    />
                                </View>
                            </LinearGradient>

                            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

                                <View style={styles.scoresSection}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Safety & Sentiment</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: crisisScores ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                            <MaterialCommunityIcons name={crisisScores ? 'database-check' : 'database-off'} size={12} color={crisisScores ? Colors.primary : '#FF9800'} />
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: crisisScores ? Colors.primary : '#FF9800' }}>
                                                {crisisScores ? `GDELT ${crisisScores.month}` : 'Estimated'}
                                            </Text>
                                        </View>
                                    </View>

                                    <LinearGradient
                                        colors={['#4CAF50', '#388E3C']}
                                        style={styles.sentimentCard}
                                    >
                                        <View style={styles.sentimentHeader}>
                                            <MaterialCommunityIcons name="heart-pulse" size={32} color="#FFFFFF" />
                                            <View style={styles.sentimentTextContainer}>
                                                <Text style={styles.sentimentLabel}>Public Sentiment</Text>
                                                <Text style={styles.sentimentValue}>
                                                    {(getDistrictCrisisScores(selectedDistrict).sentiment * 100).toFixed(0)}%
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.sentimentDesc}>
                                            {sentiments[selectedDistrict.id.toLowerCase()]
                                                ? 'Based on BERT sentiment analysis'
                                                : 'Based on visit probability model'}
                                        </Text>
                                    </LinearGradient>

                                    <View style={styles.crisisGrid}>
                                        {[
                                            { label: 'Terror', value: getDistrictCrisisScores(selectedDistrict).terror, icon: 'bomb', color: '#F44336' },
                                            { label: 'Crime', value: getDistrictCrisisScores(selectedDistrict).crime, icon: 'shield-alert', color: '#E91E63' },
                                            { label: 'Economic', value: getDistrictCrisisScores(selectedDistrict).economic, icon: 'trending-down', color: '#FF9800' },
                                            { label: 'Unrest', value: getDistrictCrisisScores(selectedDistrict).unrest, icon: 'account-group', color: '#FF5722' },
                                            { label: 'Disaster', value: getDistrictCrisisScores(selectedDistrict).disaster, icon: 'weather-hurricane', color: '#9C27B0' },
                                            { label: 'Disease', value: getDistrictCrisisScores(selectedDistrict).disease, icon: 'virus', color: '#673AB7' },
                                            { label: 'Diplomacy', value: getDistrictCrisisScores(selectedDistrict).diplomacy, icon: 'handshake', color: '#3F51B5' },
                                        ].map((crisis, idx) => (
                                            <View key={idx} style={styles.crisisItem}>
                                                <View style={[styles.crisisIconBg, { backgroundColor: crisis.color + '20' }]}>
                                                    <MaterialCommunityIcons name={crisis.icon as any} size={20} color={crisis.color} />
                                                </View>
                                                <Text style={styles.crisisLabel}>{crisis.label}</Text>
                                                <Text style={[styles.crisisValue, { color: crisis.color }]}>
                                                    {crisis.value.toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Current Stats */}
                                <View style={styles.statsSection}>
                                    <Text style={styles.sectionTitle}>Current Statistics</Text>

                                    <View style={styles.statsGrid}>
                                        <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.statCard}>
                                            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>
                                                {selectedDistrict.currentStats.touristCount.toLocaleString()}
                                            </Text>
                                            <Text style={styles.statLabel}>Live Tourists</Text>
                                        </LinearGradient>

                                        <LinearGradient
                                            colors={[
                                                getDistrictStrokeColor(selectedDistrict.currentStats.trafficLevel),
                                                getDistrictStrokeColor(selectedDistrict.currentStats.trafficLevel) + 'DD',
                                            ]}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="car-multiple" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>{selectedDistrict.currentStats.trafficLevel}%</Text>
                                            <Text style={styles.statLabel}>Traffic</Text>
                                        </LinearGradient>
                                    </View>

                                    <View style={styles.statsGrid}>
                                        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.statCard}>
                                            <MaterialCommunityIcons
                                                name={getWeatherIcon(selectedDistrict.currentStats.weatherCondition)}
                                                size={32}
                                                color="#FFFFFF"
                                            />
                                            <Text style={styles.statValue}>{selectedDistrict.currentStats.weatherTemp}°C</Text>
                                            <Text style={styles.statLabel}>{selectedDistrict.currentStats.weatherCondition}</Text>
                                        </LinearGradient>

                                        <LinearGradient
                                            colors={[
                                                getCrisisColor(selectedDistrict.currentStats.crisisLevel),
                                                getCrisisColor(selectedDistrict.currentStats.crisisLevel) + 'DD',
                                            ]}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="shield-check" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>{selectedDistrict.currentStats.safetyScore}%</Text>
                                            <Text style={styles.statLabel}>Safety</Text>
                                        </LinearGradient>
                                    </View>

                                    {/* Real weather humidity/wind if available */}
                                    {weather[selectedDistrict.id.toLowerCase()] && (
                                        <View style={styles.statsGrid}>
                                            <LinearGradient colors={['#00BCD4', '#0097A7']} style={styles.statCard}>
                                                <MaterialCommunityIcons name="water-percent" size={32} color="#FFFFFF" />
                                                <Text style={styles.statValue}>
                                                    {weather[selectedDistrict.id.toLowerCase()].humidity}%
                                                </Text>
                                                <Text style={styles.statLabel}>Humidity</Text>
                                            </LinearGradient>

                                            <LinearGradient colors={['#607D8B', '#455A64']} style={styles.statCard}>
                                                <MaterialCommunityIcons name="weather-windy" size={32} color="#FFFFFF" />
                                                <Text style={styles.statValue}>
                                                    {weather[selectedDistrict.id.toLowerCase()].windspeed} km/h
                                                </Text>
                                                <Text style={styles.statLabel}>Wind</Text>
                                            </LinearGradient>
                                        </View>
                                    )}
                                </View>

                                {/* Forecast */}
                                <View style={styles.statsSection}>
                                    <Text style={styles.sectionTitle}>ML Forecast</Text>
                                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.forecastCard}>
                                        <View style={styles.forecastHeader}>
                                            <MaterialCommunityIcons name="chart-line" size={28} color="#FFFFFF" />
                                            <Text style={styles.forecastTitle}>Next Month Prediction</Text>
                                        </View>
                                        <Text style={styles.forecastValue}>
                                            {selectedDistrict.forecast.nextMonth.toLocaleString()} visitors
                                        </Text>
                                        <View style={styles.forecastBadge}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                                            <Text style={styles.forecastConfidence}>
                                                {selectedDistrict.forecast.confidence}% confidence
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </View>

                                {/* Top Attractions */}
                                <View style={styles.attractionsContainer}>
                                    <Text style={styles.sectionTitle}>Top Attractions</Text>
                                    {selectedDistrict.currentStats.topAttractions.map((attraction, idx) => (
                                        <View key={idx} style={styles.attractionItem}>
                                            <View style={styles.attractionIconBg}>
                                                <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
                                            </View>
                                            <Text style={styles.attractionText}>{attraction}</Text>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                                        </View>
                                    ))}
                                </View>

                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    headerContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
    header: {
        margin: 16, borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 12,
    },
    headerContent: { padding: 16 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    markerContainer: { alignItems: 'center' },
    marker: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 12,
        borderWidth: 2, borderColor: '#FFFFFF',
    },
    markerText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
    markerArrow: {
        width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -2,
    },
    legendContainer: { position: 'absolute', bottom: 32, left: 16, right: 16 },
    legend: {
        borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    legendTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    legendItems: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 16, height: 16, borderRadius: 8 },
    legendText: { fontSize: 13, fontWeight: '600', color: Colors.text },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        maxHeight: height * 0.8, overflow: 'hidden',
    },
    modalHeader: { paddingTop: 8, paddingBottom: 20 },
    modalHeaderContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    modalIconBg: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalHeaderText: { flex: 1, marginLeft: 16 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
    modalSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    modalContent: { padding: 20 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: {
        flex: 1, padding: 20, borderRadius: 20, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    statValue: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 8 },
    statLabel: {
        fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4,
        fontWeight: '600', textAlign: 'center',
    },
    scoresSection: { marginBottom: 24 },
    statsSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
    sentimentCard: {
        padding: 20, borderRadius: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    sentimentHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
    sentimentTextContainer: { flex: 1 },
    sentimentLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    sentimentValue: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
    sentimentDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' },
    crisisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    crisisItem: {
        width: (width - 64) / 2, padding: 16, backgroundColor: Colors.surface, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    crisisIconBg: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    crisisLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    crisisValue: { fontSize: 20, fontWeight: '900' },
    forecastCard: {
        padding: 24, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 12,
    },
    forecastHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    forecastTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    forecastValue: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 12 },
    forecastBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, alignSelf: 'flex-start',
    },
    forecastConfidence: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    attractionsContainer: { marginBottom: 20 },
    attractionItem: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    attractionIconBg: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    attractionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
});