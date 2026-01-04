// app/(tabs)/simulator.tsx - COMPLETE REDESIGN
import { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/Colors';
import { DISTRICT_DATA, DistrictData } from '../../utils/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MONTHS = [
    { label: 'Jan', value: 1 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: 3 },
    { label: 'Apr', value: 4 }, { label: 'May', value: 5 }, { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 }, { label: 'Aug', value: 8 }, { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 }, { label: 'Nov', value: 11 }, { label: 'Dec', value: 12 },
];

export default function WhatIfSimulator() {
    const [scope, setScope] = useState<'district' | 'country'>('district');
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(DISTRICT_DATA[0]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const [temperature, setTemperature] = useState(28);
    const [rainfall, setRainfall] = useState(50);
    const [humidity, setHumidity] = useState(75);

    const [terrorScore, setTerrorScore] = useState(0.1);
    const [economicScore, setEconomicScore] = useState(0.2);
    const [unrestScore, setUnrestScore] = useState(0.15);
    const [disasterScore, setDisasterScore] = useState(0.1);
    const [diseaseScore, setDiseaseScore] = useState(0.1);
    const [crimeScore, setCrimeScore] = useState(0.1);
    const [diplomacyScore, setDiplomacyScore] = useState(0.05);

    // FIXED PREDICTIONS - ALL CRISIS SCORES INCLUDED
    const predictDistrictTourists = (district: DistrictData) => {
        const base = district.currentStats.touristCount;
        const tempImpact = (32 - temperature) * 50;
        const rainImpact = -rainfall * 10;

        // ALL 7 CRISIS SCORES NOW AFFECT PREDICTION
        const crisisImpact = -(
            terrorScore * 5000 +
            economicScore * 4000 +
            unrestScore * 4500 +
            disasterScore * 5000 +
            diseaseScore * 3500 +
            crimeScore * 3000 -
            (1 - diplomacyScore) * 2000  // Good diplomacy = positive
        );

        const peakMonths = [12, 1, 2, 7, 8];
        const seasonImpact = peakMonths.includes(month) ? 2000 : -500;

        return Math.max(0, Math.round(base + tempImpact + rainImpact + crisisImpact + seasonImpact));
    };

    const predictCountryTourists = () => {
        let total = 0;
        DISTRICT_DATA.forEach(district => {
            total += predictDistrictTourists(district);
        });
        return total;
    };

    const predictSafetyScore = (base: number) => {
        // ALL CRISIS SCORES AFFECT SAFETY
        const crisisImpact = -(
            terrorScore * 30 +
            unrestScore * 25 +
            crimeScore * 20 +
            disasterScore * 15 +
            diseaseScore * 12 +
            economicScore * 8
        );
        const diplomacyImpact = (1 - diplomacyScore) * 10; // Good diplomacy helps
        return Math.max(0, Math.min(100, base + crisisImpact + diplomacyImpact));
    };

    const predictCrisisLevel = (): 'low' | 'medium' | 'high' => {
        // ALL 7 SCORES IN COMPOSITE
        const composite = (
            terrorScore * 1.2 +
            unrestScore * 1.1 +
            disasterScore * 1.0 +
            diseaseScore * 0.9 +
            crimeScore * 0.8 +
            economicScore * 0.7 +
            diplomacyScore * 0.5
        ) / 6.2;

        if (composite > 0.5) return 'high';
        if (composite > 0.25) return 'medium';
        return 'low';
    };

    const predictTrafficLevel = (baseTourists: number, predicted: number) => {
        const change = ((predicted - baseTourists) / baseTourists) * 100;
        const baseTraffic = scope === 'district' ? selectedDistrict.currentStats.trafficLevel : 60;
        return Math.max(0, Math.min(100, baseTraffic + change * 0.3));
    };

    const getCrisisColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low': return Colors.success;
            case 'medium': return Colors.warning;
            case 'high': return Colors.error;
        }
    };

    const resetDefaults = () => {
        setTemperature(28);
        setRainfall(50);
        setHumidity(75);
        setTerrorScore(0.1);
        setEconomicScore(0.2);
        setUnrestScore(0.15);
        setDisasterScore(0.1);
        setDiseaseScore(0.1);
        setCrimeScore(0.1);
        setDiplomacyScore(0.05);
        setMonth(new Date().getMonth() + 1);
    };

    const baseTourists = scope === 'district'
        ? selectedDistrict.currentStats.touristCount
        : DISTRICT_DATA.reduce((sum, d) => sum + d.currentStats.touristCount, 0);

    const predictedTourists = scope === 'district'
        ? predictDistrictTourists(selectedDistrict)
        : predictCountryTourists();

    const baseSafety = scope === 'district'
        ? selectedDistrict.currentStats.safetyScore
        : DISTRICT_DATA.reduce((sum, d) => sum + d.currentStats.safetyScore, 0) / DISTRICT_DATA.length;

    return (
        <View style={styles.container}>
            {/* STICKY RESULTS - Always visible at top */}
            <LinearGradient
                colors={['#1976D2', '#1565C0']}
                style={styles.stickyResults}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.stickyHeader}>
                        <MaterialCommunityIcons name="tune-variant" size={24} color="#FFFFFF" />
                        <Text style={styles.stickyTitle}>What-If Simulator</Text>
                    </View>

                    <Text style={styles.resultsTitle}>
                        {scope === 'district' ? selectedDistrict.name : 'Whole Country'}
                    </Text>

                    {/* 2x2 GRID - Smaller cards */}
                    <View style={styles.resultsGrid}>
                        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.resultCard}>
                            <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
                            <Text style={styles.resultValue}>{(predictedTourists / 1000).toFixed(1)}K</Text>
                            <Text style={styles.resultLabel}>Tourists</Text>
                            <Text style={[styles.resultChange, predictedTourists > baseTourists ? styles.up : styles.down]}>
                                {predictedTourists > baseTourists ? '↑' : '↓'} {Math.abs(((predictedTourists - baseTourists) / baseTourists * 100)).toFixed(0)}%
                            </Text>
                        </LinearGradient>

                        <LinearGradient colors={[Colors.success, Colors.success + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF" />
                            <Text style={styles.resultValue}>{predictSafetyScore(baseSafety).toFixed(0)}%</Text>
                            <Text style={styles.resultLabel}>Safety</Text>
                            <Text style={styles.resultChange}>
                                {(predictSafetyScore(baseSafety) - baseSafety).toFixed(0)} pts
                            </Text>
                        </LinearGradient>

                        <LinearGradient colors={[getCrisisColor(predictCrisisLevel()), getCrisisColor(predictCrisisLevel()) + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="alert" size={24} color="#FFFFFF" />
                            <Text style={styles.resultValue}>{predictCrisisLevel().toUpperCase()}</Text>
                            <Text style={styles.resultLabel}>Crisis</Text>
                        </LinearGradient>

                        <LinearGradient colors={[Colors.warning, Colors.warning + 'DD']} style={styles.resultCard}>
                            <MaterialCommunityIcons name="car-multiple" size={24} color="#FFFFFF" />
                            <Text style={styles.resultValue}>{predictTrafficLevel(baseTourists, predictedTourists).toFixed(0)}%</Text>
                            <Text style={styles.resultLabel}>Traffic</Text>
                        </LinearGradient>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* SCROLLABLE INPUTS */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Scope */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prediction Scope</Text>
                    <SegmentedButtons
                        value={scope}
                        onValueChange={(value: any) => setScope(value)}
                        buttons={[
                            { value: 'district', label: 'District', icon: 'map-marker' },
                            { value: 'country', label: 'Country', icon: 'earth' },
                        ]}
                        style={styles.segment}
                    />
                </View>

                {/* District Selector */}
                {scope === 'district' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select District</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
                            {DISTRICT_DATA.slice(0, 6).map((district) => (
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
                                            selectedDistrict.id === district.id && styles.chipTextActive
                                        ]}>{district.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Month Selector - BEAUTIFUL */}
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
                                        month === m.value && styles.monthTextActive
                                    ]}>{m.label}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Weather */}
                <View style={styles.paramCard}>
                    <View style={styles.paramHeader}>
                        <MaterialCommunityIcons name="weather-cloudy" size={24} color={Colors.secondary} />
                        <Text style={styles.paramTitle}>Weather</Text>
                    </View>
                    {[
                        { label: 'Temperature', value: temperature, setter: setTemperature, min: 15, max: 40, unit: '°C', icon: 'thermometer', color: '#FF9800' },
                        { label: 'Rainfall', value: rainfall, setter: setRainfall, min: 0, max: 200, unit: 'mm', icon: 'weather-rainy', color: '#2196F3' },
                        { label: 'Humidity', value: humidity, setter: setHumidity, min: 30, max: 100, unit: '%', icon: 'water-percent', color: '#00BCD4' },
                    ].map((p, i) => (
                        <View key={i} style={styles.slider}>
                            <View style={styles.sliderHeader}>
                                <View style={[styles.sliderIcon, { backgroundColor: p.color + '20' }]}>
                                    <MaterialCommunityIcons name={p.icon as any} size={18} color={p.color} />
                                </View>
                                <Text style={styles.sliderLabel}>{p.label}</Text>
                                <Text style={styles.sliderValue}>{p.value}{p.unit}</Text>
                            </View>
                            <Slider
                                value={p.value}
                                onValueChange={p.setter}
                                minimumValue={p.min}
                                maximumValue={p.max}
                                step={p.label === 'Temperature' ? 1 : 5}
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
                        <MaterialCommunityIcons name="alert-circle" size={24} color={Colors.error} />
                        <Text style={styles.paramTitle}>Crisis Scores (0-1)</Text>
                    </View>
                    {[
                        { label: 'Terror', value: terrorScore, setter: setTerrorScore, icon: 'bomb' },
                        { label: 'Economic', value: economicScore, setter: setEconomicScore, icon: 'trending-down' },
                        { label: 'Unrest', value: unrestScore, setter: setUnrestScore, icon: 'account-group' },
                        { label: 'Disaster', value: disasterScore, setter: setDisasterScore, icon: 'weather-hurricane' },
                        { label: 'Disease', value: diseaseScore, setter: setDiseaseScore, icon: 'virus' },
                        { label: 'Crime', value: crimeScore, setter: setCrimeScore, icon: 'shield-alert' },
                        { label: 'Diplomacy', value: diplomacyScore, setter: setDiplomacyScore, icon: 'handshake' },
                    ].map((p, i) => (
                        <View key={i} style={styles.slider}>
                            <View style={styles.sliderHeader}>
                                <View style={[styles.sliderIcon, { backgroundColor: Colors.error + '20' }]}>
                                    <MaterialCommunityIcons name={p.icon as any} size={18} color={Colors.error} />
                                </View>
                                <Text style={styles.sliderLabel}>{p.label}</Text>
                                <Text style={styles.sliderValue}>{p.value.toFixed(2)}</Text>
                            </View>
                            <Slider
                                value={p.value}
                                onValueChange={p.setter}
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
                        <MaterialCommunityIcons name="refresh" size={20} color={Colors.textSecondary} />
                        <Text style={styles.resetText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton}>
                        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.saveGradient}>
                            <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
                            <Text style={styles.saveText}>Save Scenario</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FBF9',
    },
    stickyResults: {
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    stickyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    stickyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    resultsTitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        marginBottom: 12,
        fontWeight: '600',
    },
    resultsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8,
    },
    resultCard: {
        width: (width - 40) / 2,
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    resultValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 4,
    },
    resultLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '600',
    },
    resultChange: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    up: { color: '#A5D6A7' },
    down: { color: '#FFCDD2' },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    segment: {
        backgroundColor: '#FFFFFF',
    },
    scroll: {
        marginLeft: -16,
        paddingLeft: 16,
    },
    chipWrapper: {
        marginRight: 8,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    chipGradient: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    monthWrapper: {
        borderRadius: 999,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    monthCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
    },
    monthTextActive: {
        color: '#FFFFFF',
    },
    paramCard: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    paramHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    paramTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    slider: {
        marginBottom: 16,
    },
    sliderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    sliderIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    sliderValue: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    resetText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    saveButton: {
        flex: 2,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        gap: 8,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});