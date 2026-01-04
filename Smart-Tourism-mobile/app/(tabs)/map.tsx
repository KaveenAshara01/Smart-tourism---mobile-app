// app/(tabs)/map.tsx - BEAUTIFUL with Normal Map + District Borders
import {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal} from 'react-native';
import {Text, Card, IconButton, Chip} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Polygon, Marker, PROVIDER_GOOGLE, Geojson} from 'react-native-maps';
import {Colors} from '../../constants/Colors';
import {DISTRICT_DATA, getTrafficColor, getCrisisColor, DistrictData} from '../../utils/mockData';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import districtsGeoJson from '../../utils/lkaDistrictsGeoJson'
import { Animated } from 'react-native';


const {width, height} = Dimensions.get('window');


export default function DigitalTwinMap() {
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
    const [pulseOn, setPulseOn] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setPulseOn(p => !p);
        }, 1200);

        return () => clearInterval(interval);
    }, []);

    const getDistrictFillColor = (trafficLevel: number) => {
        if (trafficLevel < 40) return 'rgba(76, 175, 80, 0.45)';   // brighter green
        if (trafficLevel < 70) return 'rgba(255, 193, 7, 0.55)'; // brighter yellow
        return 'rgba(244, 67, 54, 0.65)';                         // brighter red
    };


    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: false,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);


    const mapRef = useRef<MapView>(null);

    const getDistrictStrokeColor = (trafficLevel: number) => {
        // Solid border colors
        if (trafficLevel < 40) return '#4CAF50';
        if (trafficLevel < 70) return '#FFC107';

        return '#F44336';
    };

    function buildFeatureCollectionForDistrict(all: any, districtName: string) {
        return {
            type: "FeatureCollection" as const,
            features: all.features.filter(
                (f: any) => f?.properties?.name === districtName
            ),
        };
    }


    const getPulseOpacity = (trafficLevel: number) => {
        if (trafficLevel >= 70) return 0.55;
        if (trafficLevel >= 40) return 0.30;
        return 0;
    };


    useEffect(() => {
        mapRef.current?.animateToRegion({
            latitude: 7.5,
            longitude: 80.7,
            latitudeDelta: 6,
            longitudeDelta: 6,
        });
    }, []);

    // Mock crisis scores for each district (in real app, fetch from backend)
    const getDistrictCrisisScores = (district: DistrictData) => {
        // Generate mock scores based on district safety
        const baseSafety = district.currentStats.safetyScore / 100;
        return {
            sentiment: baseSafety * 0.9 + 0.1, // 0.1 - 1.0
            terror: (1 - baseSafety) * 0.3, // Lower is better
            economic: 0.15 + (1 - baseSafety) * 0.1,
            unrest: (1 - baseSafety) * 0.2,
            disaster: 0.08,
            disease: 0.05,
            crime: (1 - baseSafety) * 0.25,
            diplomacy: 0.03,
        };
    };

    return (
        <View style={styles.container}>

            {/* Map with NORMAL GREEN TERRAIN */}
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


                {/* District Polygons with BORDERS and SEMI-TRANSPARENT OVERLAY */}
                {DISTRICT_DATA.map((d) => {
                    const fc = buildFeatureCollectionForDistrict(districtsGeoJson, d.name);
                    if (!fc.features.length) return null;

                    return (
                        <View key={`district-${d.id}`}>
                            {/* BASE overlay */}
                            <Geojson
                                geojson={fc as any}
                                strokeWidth={0}
                                fillColor={getDistrictFillColor(d.currentStats.trafficLevel)}
                            />

                            {/* PULSE overlay (only yellow & red) */}
                            {d.currentStats.trafficLevel >= 40 && (
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        opacity: getPulseOpacity(d.currentStats.trafficLevel),
                                    }}
                                >
                                    <Geojson
                                        geojson={fc as any}
                                        strokeWidth={0}
                                        fillColor={
                                            d.currentStats.trafficLevel >= 70
                                                ? '#F44336'
                                                : '#FFC107'
                                        }
                                    />
                                </Animated.View>
                            )}
                        </View>
                    );
                })}


                {/* Beautiful Custom Markers */}
                {DISTRICT_DATA.map((district) => (
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
                                    getDistrictStrokeColor(district.currentStats.trafficLevel) + 'DD'
                                ]}
                                style={styles.marker}
                            >
                                <Text style={styles.markerText}>
                                    {(district.currentStats.touristCount / 1000).toFixed(1)}K
                                </Text>
                            </LinearGradient>
                            <View style={[styles.markerArrow, {
                                borderTopColor: getDistrictStrokeColor(district.currentStats.trafficLevel)
                            }]}/>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Floating Header */}
            <SafeAreaView edges={['top']} style={styles.headerContainer}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>Digital Twin</Text>
                            <Text style={styles.headerSubtitle}>Real-time monitoring</Text>
                        </View>
                    </View>
                </LinearGradient>
            </SafeAreaView>

            {/* Floating Legend */}
            <View style={styles.legendContainer}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                    style={styles.legend}
                >
                    <Text style={styles.legendTitle}>Traffic Level</Text>
                    <View style={styles.legendItems}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]}/>
                            <Text style={styles.legendText}>Low</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, {backgroundColor: '#FFC107'}]}/>
                            <Text style={styles.legendText}>Medium</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, {backgroundColor: '#F44336'}]}/>
                            <Text style={styles.legendText}>High</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* District Details Modal */}
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
                                {/* SENTIMENT & CRISIS SCORES - TOP SECTION */}
                                <View style={styles.scoresSection}>
                                    <Text style={styles.sectionTitle}>Safety & Sentiment Analysis</Text>

                                    {/* Sentiment Score - Big Display */}
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
                                        <Text style={styles.sentimentDesc}>Based on social media analysis</Text>
                                    </LinearGradient>

                                    {/* Crisis Scores Grid */}
                                    <View style={styles.crisisGrid}>
                                        {[
                                            {
                                                label: 'Terror',
                                                value: getDistrictCrisisScores(selectedDistrict).terror,
                                                icon: 'bomb',
                                                color: '#F44336'
                                            },
                                            {
                                                label: 'Crime',
                                                value: getDistrictCrisisScores(selectedDistrict).crime,
                                                icon: 'shield-alert',
                                                color: '#E91E63'
                                            },
                                            {
                                                label: 'Economic',
                                                value: getDistrictCrisisScores(selectedDistrict).economic,
                                                icon: 'trending-down',
                                                color: '#FF9800'
                                            },
                                            {
                                                label: 'Unrest',
                                                value: getDistrictCrisisScores(selectedDistrict).unrest,
                                                icon: 'account-group',
                                                color: '#FF5722'
                                            },
                                            {
                                                label: 'Disaster',
                                                value: getDistrictCrisisScores(selectedDistrict).disaster,
                                                icon: 'weather-hurricane',
                                                color: '#9C27B0'
                                            },
                                            {
                                                label: 'Disease',
                                                value: getDistrictCrisisScores(selectedDistrict).disease,
                                                icon: 'virus',
                                                color: '#673AB7'
                                            },
                                            {
                                                label: 'Diplomacy',
                                                value: getDistrictCrisisScores(selectedDistrict).diplomacy,
                                                icon: 'handshake',
                                                color: '#3F51B5'
                                            },
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

                                {/* CURRENT STATS */}
                                <View style={styles.statsSection}>
                                    <Text style={styles.sectionTitle}>Current Statistics</Text>

                                    <View style={styles.statsGrid}>
                                        <LinearGradient
                                            colors={['#2196F3', '#1976D2']}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>
                                                {selectedDistrict.currentStats.touristCount.toLocaleString()}
                                            </Text>
                                            <Text style={styles.statLabel}>Tourists</Text>
                                        </LinearGradient>

                                        <LinearGradient
                                            colors={[
                                                getDistrictStrokeColor(selectedDistrict.currentStats.trafficLevel),
                                                getDistrictStrokeColor(selectedDistrict.currentStats.trafficLevel) + 'DD'
                                            ]}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="car-multiple" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>
                                                {selectedDistrict.currentStats.trafficLevel}%
                                            </Text>
                                            <Text style={styles.statLabel}>Traffic</Text>
                                        </LinearGradient>
                                    </View>

                                    <View style={styles.statsGrid}>
                                        <LinearGradient
                                            colors={['#FF9800', '#F57C00']}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>
                                                {selectedDistrict.currentStats.weatherTemp}°C
                                            </Text>
                                            <Text style={styles.statLabel}>{selectedDistrict.currentStats.weatherCondition}</Text>
                                        </LinearGradient>

                                        <LinearGradient
                                            colors={[
                                                getCrisisColor(selectedDistrict.currentStats.crisisLevel),
                                                getCrisisColor(selectedDistrict.currentStats.crisisLevel) + 'DD'
                                            ]}
                                            style={styles.statCard}
                                        >
                                            <MaterialCommunityIcons name="shield-check" size={32} color="#FFFFFF" />
                                            <Text style={styles.statValue}>
                                                {selectedDistrict.currentStats.safetyScore}%
                                            </Text>
                                            <Text style={styles.statLabel}>Safety</Text>
                                        </LinearGradient>
                                    </View>
                                </View>

                                {/* TOP ATTRACTIONS */}
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
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    header: {
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    headerContent: {
        padding: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    markerText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 13,
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -2,
    },
    legendContainer: {
        position: 'absolute',
        bottom: 32,
        left: 16,
        right: 16,
    },
    legend: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    legendItems: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    legendText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: height * 0.75,
        overflow: 'hidden',
    },
    modalHeader: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeaderText: {
        flex: 1,
        marginLeft: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    modalSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    modalContent: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    crisisContainer: {
        marginTop: 12,
        marginBottom: 20,
    },
    crisisChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
    },
    attractionsContainer: {
        marginBottom: 20,
    },
    attractionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    attractionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attractionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    forecastCard: {
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    forecastHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    forecastTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    forecastValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    forecastBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    forecastConfidence: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    scoresSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    sentimentCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    sentimentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    sentimentTextContainer: {
        flex: 1,
    },
    sentimentLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    sentimentValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 4,
    },
    sentimentDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontStyle: 'italic',
    },
    crisisGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    crisisItem: {
        width: (width - 64) / 2,
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    crisisIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    crisisLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    crisisValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    statsSection: {
        marginBottom: 24,
    },

});