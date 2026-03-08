// app/(tabs)/simulator.tsx
import {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Text, SegmentedButtons} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {Colors} from '../../constants/Colors';
import {DISTRICT_DATA, DistrictData} from '../../utils/mockData';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {simulatorService, SimulateResult, forecastService, ForecastResult} from '../../services/itineraryService';

const {width} = Dimensions.get('window');

const MONTHS = [
    {label: 'Jan', value: 1}, {label: 'Feb', value: 2}, {label: 'Mar', value: 3},
    {label: 'Apr', value: 4}, {label: 'May', value: 5}, {label: 'Jun', value: 6},
    {label: 'Jul', value: 7}, {label: 'Aug', value: 8}, {label: 'Sep', value: 9},
    {label: 'Oct', value: 10}, {label: 'Nov', value: 11}, {label: 'Dec', value: 12},
];

const DEFAULT_STATE = {
    temperature: 28,
    rainfall: 50,
    humidity: 75,
    terrorScore: 0.1,
    economicScore: 0.2,
    unrestScore: 0.15,
    disasterScore: 0.1,
    diseaseScore: 0.1,
    crimeScore: 0.1,
    diplomacyScore: 0.05,
};

export default function WhatIfSimulator() {
    const [scope, setScope] = useState<'district' | 'country'>('district');
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(DISTRICT_DATA[0]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const [temperature, setTemperature] = useState(DEFAULT_STATE.temperature);
    const [rainfall, setRainfall] = useState(DEFAULT_STATE.rainfall);
    const [humidity, setHumidity] = useState(DEFAULT_STATE.humidity);
    const [terrorScore, setTerrorScore] = useState(DEFAULT_STATE.terrorScore);
    const [economicScore, setEconomicScore] = useState(DEFAULT_STATE.economicScore);
    const [unrestScore, setUnrestScore] = useState(DEFAULT_STATE.unrestScore);
    const [disasterScore, setDisasterScore] = useState(DEFAULT_STATE.disasterScore);
    const [diseaseScore, setDiseaseScore] = useState(DEFAULT_STATE.diseaseScore);
    const [crimeScore, setCrimeScore] = useState(DEFAULT_STATE.crimeScore);
    const [diplomacyScore, setDiplomacyScore] = useState(DEFAULT_STATE.diplomacyScore);

    // ML prediction result from Flask
    const [mlResult, setMlResult] = useState<SimulateResult | null>(null);
    const [baseline, setBaseline] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load baseline on mount
    useEffect(() => {
        forecastService.getForecast().then(setBaseline).catch(() => {
        });
    }, []);

    // Trigger Flask prediction whenever any parameter changes (debounced 600ms)
    const runSimulation = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(false);
            try {
                const result = await simulatorService.simulate({
                    district: selectedDistrict.id,
                    month,
                    temperature,
                    rainfall,
                    humidity,
                    terror_score: terrorScore,
                    economic_score: economicScore,
                    unrest_score: unrestScore,
                    disaster_score: disasterScore,
                    disease_score: diseaseScore,
                    crime_score: crimeScore,
                    diplomacy_score: diplomacyScore,
                });
                setMlResult(result);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }, 600);
    }, [
        selectedDistrict, month, temperature, rainfall, humidity,
        terrorScore, economicScore, unrestScore, disasterScore,
        diseaseScore, crimeScore, diplomacyScore,
    ]);

    useEffect(() => {
        runSimulation();
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [runSimulation]);

    const resetDefaults = () => {
        setTemperature(DEFAULT_STATE.temperature);
        setRainfall(DEFAULT_STATE.rainfall);
        setHumidity(DEFAULT_STATE.humidity);
        setTerrorScore(DEFAULT_STATE.terrorScore);
        setEconomicScore(DEFAULT_STATE.economicScore);
        setUnrestScore(DEFAULT_STATE.unrestScore);
        setDisasterScore(DEFAULT_STATE.disasterScore);
        setDiseaseScore(DEFAULT_STATE.diseaseScore);
        setCrimeScore(DEFAULT_STATE.crimeScore);
        setDiplomacyScore(DEFAULT_STATE.diplomacyScore);
        setMonth(new Date().getMonth() + 1);
    };

    // Derive display values
    const baselineTourists = (() => {
        if (scope === 'district') {
            const fl = baseline?.district_level[selectedDistrict.id.toLowerCase()];
            return fl ? fl.predicted_visitors : selectedDistrict.currentStats.touristCount;
        }
        return baseline?.country_level.total_district_visits ?? DISTRICT_DATA.reduce((s, d) => s + d.currentStats.touristCount, 0);
    })();

    const predictedTourists = mlResult
        ? (scope === 'district' ? mlResult.predicted_visitors : mlResult.country_total)
        : baselineTourists;

    const changePercent = mlResult
        ? mlResult.change_percent
        : 0;

    const confidence = mlResult?.confidence ?? 85;

    // Safety & crisis still computed locally (UI-only, not an ML output from Component 1)
    const baseSafety = scope === 'district'
        ? selectedDistrict.currentStats.safetyScore
        : DISTRICT_DATA.reduce((s, d) => s + d.currentStats.safetyScore, 0) / DISTRICT_DATA.length;

    const predictedSafety = Math.max(0, Math.min(100, baseSafety - (
        terrorScore * 30 + unrestScore * 25 + crimeScore * 20 +
        disasterScore * 15 + diseaseScore * 12 + economicScore * 8
    ) + (1 - diplomacyScore) * 10));

    const crisisComposite = (
        terrorScore * 1.2 + unrestScore * 1.1 + disasterScore * 1.0 +
        diseaseScore * 0.9 + crimeScore * 0.8 + economicScore * 0.7 + diplomacyScore * 0.5
    ) / 6.2;
    const crisisLevel: 'low' | 'medium' | 'high' = crisisComposite > 0.5 ? 'high' : crisisComposite > 0.25 ? 'medium' : 'low';
    const crisisColor = {low: Colors.success, medium: Colors.warning, high: Colors.error}[crisisLevel];

    const trafficBase = scope === 'district' ? selectedDistrict.currentStats.trafficLevel : 60;
    const predictedTraffic = Math.max(0, Math.min(100, trafficBase + changePercent * 0.3));

    return (
        <View style={styles.container}>
            {/* Sticky results panel */}
            <LinearGradient colors={['#1976D2', '#1565C0']} style={styles.stickyResults}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.stickyHeader}>
                        <MaterialCommunityIcons name="tune-variant" size={24} color="#FFFFFF"/>
                        <Text style={styles.stickyTitle}>What-If Simulator</Text>
                        {loading && <ActivityIndicator color="#FFFFFF" size="small" style={{marginLeft: 8}}/>}
                        {error && (
                            <Text style={styles.errorBadge}>offline</Text>
                        )}
                    </View>

                    <Text style={styles.resultsTitle}>
                        {scope === 'district' ? selectedDistrict.name : 'Whole Country'}
                        {' '}— {MONTHS.find(m => m.value === month)?.label}
                    </Text>

                    <View style={styles.resultsGrid}>
                        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.resultCard}>
                            <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF"/>
                            <Text style={styles.resultValue}>
                                {predictedTourists >= 1000
                                    ? `${(predictedTourists / 1000).toFixed(1)}K`
                                    : Math.round(predictedTourists).toString()}
                            </Text>
                            <Text style={styles.resultLabel}>Tourists</Text>
                            <Text style={[styles.resultChange, changePercent >= 0 ? styles.up : styles.down]}>
                                {changePercent >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}%
                            </Text>
                        </LinearGradient>

                        <LinearGradient colors={[Colors.success, Colors.success + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF"/>
                            <Text style={styles.resultValue}>{predictedSafety.toFixed(0)}%</Text>
                            <Text style={styles.resultLabel}>Safety</Text>
                            <Text style={styles.resultChange}>{(predictedSafety - baseSafety).toFixed(0)} pts</Text>
                        </LinearGradient>

                        <LinearGradient colors={[crisisColor, crisisColor + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="alert" size={24} color="#FFFFFF"/>
                            <Text style={styles.resultValue}>{crisisLevel.toUpperCase()}</Text>
                            <Text style={styles.resultLabel}>Crisis</Text>
                        </LinearGradient>

                        <LinearGradient colors={[Colors.warning, Colors.warning + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="car-multiple" size={24} color="#FFFFFF"/>
                            <Text style={styles.resultValue}>{predictedTraffic.toFixed(0)}%</Text>
                            <Text style={styles.resultLabel}>Traffic</Text>
                        </LinearGradient>
                    </View>

                    {mlResult && (
                        <Text style={styles.confidenceText}>
                            ML confidence: {confidence}%
                        </Text>
                    )}
                </SafeAreaView>
            </LinearGradient>

            {/* Scrollable inputs */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* Scope */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prediction Scope</Text>
                    <SegmentedButtons
                        value={scope}
                        onValueChange={(v: any) => setScope(v)}
                        buttons={[
                            {value: 'district', label: 'District', icon: 'map-marker'},
                            {value: 'country', label: 'Country', icon: 'earth'},
                        ]}
                        style={styles.segment}
                    />
                </View>

                {/* District selector */}
                {scope === 'district' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select District</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
                            {DISTRICT_DATA.map((district) => (
                                <TouchableOpacity
                                    key={district.id}
                                    onPress={() => setSelectedDistrict(district)}
                                    style={styles.chipWrapper}
                                >
                                    <LinearGradient
                                        colors={selectedDistrict.id === district.id
                                            ? [Colors.primary, Colors.primaryDark]
                                            : ['#FFFFFF', '#F5F5F5']}
                                        style={styles.chipGradient}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedDistrict.id === district.id && styles.chipTextActive,
                                        ]}>{district.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Month selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Month</Text>
                    <View style={styles.monthsGrid}>
                        {MONTHS.map((m) => (
                            <TouchableOpacity
                                key={m.value}
                                onPress={() => setMonth(m.value)}
                                style={styles.monthWrapper}
                            >
                                <LinearGradient
                                    colors={month === m.value
                                        ? [Colors.secondary, Colors.secondaryDark]
                                        : ['#FFFFFF', '#F8F8F8']}
                                    style={styles.monthCircle}
                                >
                                    <Text style={[
                                        styles.monthText,
                                        month === m.value && styles.monthTextActive,
                                    ]}>{m.label}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Weather */}
                <View style={styles.paramCard}>
                    <View style={styles.paramHeader}>
                        <MaterialCommunityIcons name="weather-cloudy" size={24} color={Colors.secondary}/>
                        <Text style={styles.paramTitle}>Weather Conditions</Text>
                    </View>
                    {[
                        {
                            label: 'Temperature',
                            value: temperature,
                            setter: setTemperature,
                            min: 15,
                            max: 40,
                            step: 1,
                            unit: '°C',
                            icon: 'thermometer',
                            color: '#FF9800'
                        },
                        {
                            label: 'Rainfall',
                            value: rainfall,
                            setter: setRainfall,
                            min: 0,
                            max: 200,
                            step: 5,
                            unit: 'mm',
                            icon: 'weather-rainy',
                            color: '#2196F3'
                        },
                        {
                            label: 'Humidity',
                            value: humidity,
                            setter: setHumidity,
                            min: 30,
                            max: 100,
                            step: 5,
                            unit: '%',
                            icon: 'water-percent',
                            color: '#00BCD4'
                        },
                    ].map((p, i) => (
                        <View key={i} style={styles.slider}>
                            <View style={styles.sliderHeader}>
                                <View style={[styles.sliderIcon, {backgroundColor: p.color + '20'}]}>
                                    <MaterialCommunityIcons name={p.icon as any} size={18} color={p.color}/>
                                </View>
                                <Text style={styles.sliderLabel}>{p.label}</Text>
                                <Text style={styles.sliderValue}>{p.value}{p.unit}</Text>
                            </View>
                            <Slider
                                value={p.value}
                                onSlidingComplete={p.setter}
                                minimumValue={p.min}
                                maximumValue={p.max}
                                step={p.step}
                                minimumTrackTintColor={p.color}
                                maximumTrackTintColor={Colors.border}
                                thumbTintColor={p.color}
                            />
                        </View>
                    ))}
                </View>

                {/* Crisis Scores */}
                <View style={styles.paramCard}>
                    <View style={styles.paramHeader}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color={Colors.error}/>
                        <Text style={styles.paramTitle}>Crisis Scores (0 – 1)</Text>
                    </View>
                    {[
                        {label: 'Terror', value: terrorScore, setter: setTerrorScore, icon: 'bomb'},
                        {label: 'Economic', value: economicScore, setter: setEconomicScore, icon: 'trending-down'},
                        {label: 'Unrest', value: unrestScore, setter: setUnrestScore, icon: 'account-group'},
                        {label: 'Disaster', value: disasterScore, setter: setDisasterScore, icon: 'weather-hurricane'},
                        {label: 'Disease', value: diseaseScore, setter: setDiseaseScore, icon: 'virus'},
                        {label: 'Crime', value: crimeScore, setter: setCrimeScore, icon: 'shield-alert'},
                        {label: 'Diplomacy', value: diplomacyScore, setter: setDiplomacyScore, icon: 'handshake'},
                    ].map((p, i) => (
                        <View key={i} style={styles.slider}>
                            <View style={styles.sliderHeader}>
                                <View style={[styles.sliderIcon, {backgroundColor: Colors.error + '20'}]}>
                                    <MaterialCommunityIcons name={p.icon as any} size={18} color={Colors.error}/>
                                </View>
                                <Text style={styles.sliderLabel}>{p.label}</Text>
                                <Text style={styles.sliderValue}>{p.value.toFixed(2)}</Text>
                            </View>
                            <Slider
                                value={p.value}
                                onSlidingComplete={p.setter}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.01}
                                minimumTrackTintColor={Colors.error}
                                maximumTrackTintColor={Colors.border}
                                thumbTintColor={Colors.error}
                            />
                        </View>
                    ))}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={resetDefaults} style={styles.resetButton}>
                        <MaterialCommunityIcons name="refresh" size={20} color={Colors.textSecondary}/>
                        <Text style={styles.resetText}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <View style={{height: 40}}/>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#F8FBF9'},
    stickyResults: {
        paddingBottom: 16,
        shadowColor: '#000', shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    stickyHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    },
    stickyTitle: {fontSize: 18, fontWeight: '800', color: '#FFFFFF'},
    errorBadge: {
        fontSize: 11, color: '#FFCDD2', fontWeight: '700',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
        marginLeft: 'auto',
    },
    resultsTitle: {
        fontSize: 15, color: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16, marginBottom: 12, fontWeight: '600',
    },
    confidenceText: {
        fontSize: 11, color: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 16, marginTop: 6,
    },
    resultsGrid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8},
    resultCard: {
        width: (width - 40) / 2, padding: 12, borderRadius: 16,
        shadowColor: '#000', shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
    },
    resultValue: {fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 4},
    resultLabel: {fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontWeight: '600'},
    resultChange: {fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2},
    up: {color: '#A5D6A7'},
    down: {color: '#FFCDD2'},
    scrollView: {flex: 1},
    section: {paddingHorizontal: 16, marginTop: 16, marginBottom: 10},
    sectionTitle: {fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12},
    segment: {backgroundColor: '#FFFFFF'},
    scroll: {marginLeft: -16, paddingLeft: 16},
    chipWrapper: {
        marginRight: 8, borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, marginBottom: 15,
    },
    chipGradient: {paddingVertical: 10, paddingHorizontal: 16},
    chipText: {fontSize: 13, fontWeight: '700', color: Colors.text},
    chipTextActive: {color: '#FFFFFF'},
    monthsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
    monthWrapper: {
        borderRadius: 999, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    monthCircle: {width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center'},
    monthText: {fontSize: 13, fontWeight: '800', color: Colors.text},
    monthTextActive: {color: '#FFFFFF'},
    paramCard: {
        marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    paramHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10},
    paramTitle: {fontSize: 16, fontWeight: '800', color: Colors.text},
    slider: {marginBottom: 16},
    sliderHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10},
    sliderIcon: {width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center'},
    sliderLabel: {flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text},
    sliderValue: {fontSize: 14, fontWeight: '900', color: Colors.text},
    actions: {flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 12},
    resetButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 8,
        shadowColor: '#000', shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    resetText: {fontSize: 14, fontWeight: '700', color: Colors.textSecondary},
});