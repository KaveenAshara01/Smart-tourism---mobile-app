// app/questionnaire.tsx
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { itineraryService } from '../services/itineraryService';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
    { id: 1, icon: '🏖️', name: 'Beach & Relaxation', value: 'beach', color: '#00BCD4' },
    { id: 2, icon: '🏛️', name: 'Historical Sites', value: 'historical', color: '#795548' },
    { id: 3, icon: '🛕', name: 'Temples & Spiritual', value: 'temple', color: '#FF9800' },
    { id: 4, icon: '🌲', name: 'National Parks', value: 'national_park', color: '#4CAF50' },
    { id: 5, icon: '💧', name: 'Waterfalls & Nature', value: 'waterfall', color: '#2196F3' },
    { id: 6, icon: '⛰️', name: 'Mountains & Hiking', value: 'mountain', color: '#9C27B0' },
    { id: 7, icon: '🎭', name: 'Cultural Experiences', value: 'cultural', color: '#E91E63' },
    { id: 8, icon: '🏙️', name: 'City Life & Shopping', value: 'city', color: '#607D8B' },
];

export default function Questionnaire() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [days, setDays] = useState('3');
    const [travelers, setTravelers] = useState('2');
    const [budget, setBudget] = useState<'budget' | 'moderate' | 'comfortable' | 'luxury'>('moderate');
    const [distance, setDistance] = useState<'local' | 'regional' | 'nationwide'>('local');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [startLocation, setStartLocation] = useState<'colombo' | 'kandy' | 'galle'>('colombo');

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const totalSteps = 6;
    const progress = step / totalSteps;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [step]);

    const handleNext = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStep(step + 1);
            slideAnim.setValue(50);
        });
    };

    const handleBack = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStep(step - 1);
            slideAnim.setValue(-50);
        });
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleGenerate = async () => {
        if (selectedCategories.length === 0) {
            alert('Please select at least one activity');
            return;
        }

        setLoading(true);
        try {
            const locationMap = {
                colombo: { name: 'Colombo', coordinates: { latitude: 6.9271, longitude: 79.8612 } },
                kandy: { name: 'Kandy', coordinates: { latitude: 7.2906, longitude: 80.6337 } },
                galle: { name: 'Galle', coordinates: { latitude: 6.0535, longitude: 80.2210 } },
            };

            const budgetMap = { budget: 50000, moderate: 100000, comfortable: 200000, luxury: 400000 };

            const itinerary = await itineraryService.generateItinerary({
                userId: user!.uid,
                budget: budgetMap[budget],
                days: parseInt(days),
                distance: distance,
                travelers: parseInt(travelers),
                categories: selectedCategories,
                season: new Date().getMonth() < 3 ? 4 : 1,
                startLocation: locationMap[startLocation],
            });

            router.push(`/itinerary/${itinerary.id}`);
        } catch (error) {
            alert('Failed to generate itinerary. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#1B5E20', '#2E7D32', '#43A047']}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <IconButton
                            icon="close"
                            iconColor="#FFFFFF"
                            size={28}
                            onPress={() => router.back()}
                            style={styles.closeButton}
                        />
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Plan Your Trip</Text>
                            <Text style={styles.headerSubtitle}>Step {step} of {totalSteps}</Text>
                        </View>
                        <View style={{ width: 48 }} />
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: `${progress * 100}%` }
                                ]}
                            />
                        </View>
                        <View style={styles.progressSteps}>
                            {[...Array(totalSteps)].map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.progressDot,
                                        i < step && styles.progressDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Question Content - SCROLLABLE */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.content}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Animated.View
                                style={{
                                    transform: [{ translateX: slideAnim }],
                                    opacity: fadeAnim,
                                }}
                            >
                                {/* Step 1: Duration */}
                                {step === 1 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>📅</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>How many days?</Text>
                                        <Text style={styles.questionSubtitle}>Choose or enter custom duration</Text>

                                        {/* Custom Input */}
                                        <TextInput
                                            value={days}
                                            onChangeText={(text) => setDays(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="numeric"
                                            mode="flat"
                                            style={styles.customInput}
                                            placeholder="Enter days"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            textColor="#FFFFFF"
                                            underlineColor="transparent"
                                            activeUnderlineColor="transparent"
                                            theme={{ colors: { primary: '#FFFFFF', background: 'transparent' } }}
                                        />

                                        <Text style={styles.orText}>or choose</Text>

                                        <View style={styles.optionsGrid}>
                                            {['2', '3', '5', '7', '10'].map(d => (
                                                <TouchableOpacity
                                                    key={d}
                                                    onPress={() => setDays(d)}
                                                    style={[
                                                        styles.optionBox,
                                                        days === d && styles.optionBoxActive
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.optionValue,
                                                        days === d && styles.optionValueActive
                                                    ]}>{d}</Text>
                                                    <Text style={[
                                                        styles.optionLabel,
                                                        days === d && styles.optionLabelActive
                                                    ]}>days</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Step 2: Travelers */}
                                {step === 2 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>👥</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>How many travelers?</Text>
                                        <Text style={styles.questionSubtitle}>Including yourself</Text>

                                        <TextInput
                                            value={travelers}
                                            onChangeText={(text) => setTravelers(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="numeric"
                                            mode="flat"
                                            style={styles.customInput}
                                            placeholder="Enter number"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            textColor="#FFFFFF"
                                            underlineColor="transparent"
                                            activeUnderlineColor="transparent"
                                            theme={{ colors: { primary: '#FFFFFF', background: 'transparent' } }}
                                        />

                                        <Text style={styles.orText}>or choose</Text>

                                        <View style={styles.optionsGrid}>
                                            {['1', '2', '3', '4', '5'].map(t => (
                                                <TouchableOpacity
                                                    key={t}
                                                    onPress={() => setTravelers(t)}
                                                    style={[
                                                        styles.optionBox,
                                                        travelers === t && styles.optionBoxActive
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.optionValue,
                                                        travelers === t && styles.optionValueActive
                                                    ]}>{t}</Text>
                                                    <Text style={[
                                                        styles.optionLabel,
                                                        travelers === t && styles.optionLabelActive
                                                    ]}>{t === '1' ? 'solo' : 'people'}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Step 3: Budget - FIX TEXT VISIBILITY */}
                                {step === 3 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>💰</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>What's your budget?</Text>
                                        <Text style={styles.questionSubtitle}>Per person estimate</Text>

                                        <View style={styles.optionsColumn}>
                                            {[
                                                { value: 'budget', icon: '💵', label: 'Budget', sub: '< LKR 50,000' },
                                                { value: 'moderate', icon: '💳', label: 'Moderate', sub: 'LKR 50-150K' },
                                                { value: 'comfortable', icon: '💎', label: 'Comfortable', sub: 'LKR 150-300K' },
                                                { value: 'luxury', icon: '⭐', label: 'Luxury', sub: '> LKR 300K' },
                                            ].map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => setBudget(opt.value as any)}
                                                    style={[
                                                        styles.optionRow,
                                                        budget === opt.value && styles.optionRowActive
                                                    ]}
                                                >
                                                    <Text style={styles.optionIcon}>{opt.icon}</Text>
                                                    <View style={styles.optionRowText}>
                                                        <Text style={[
                                                            styles.optionRowLabel,
                                                            budget === opt.value && styles.optionRowLabelActive
                                                        ]}>{opt.label}</Text>
                                                        <Text style={[
                                                            styles.optionRowSub,
                                                            budget === opt.value && styles.optionRowSubActive
                                                        ]}>{opt.sub}</Text>
                                                    </View>
                                                    {budget === opt.value && (
                                                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Step 4: Distance - FIX TEXT VISIBILITY */}
                                {step === 4 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>🗺️</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>Travel distance?</Text>
                                        <Text style={styles.questionSubtitle}>How far would you like to go?</Text>

                                        <View style={styles.optionsColumn}>
                                            {[
                                                { value: 'local', icon: '📍', label: 'Local', sub: '< 100 km radius' },
                                                { value: 'regional', icon: '🗺️', label: 'Regional', sub: '100-250 km' },
                                                { value: 'nationwide', icon: '🌏', label: 'Nationwide', sub: '> 250 km' },
                                            ].map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => setDistance(opt.value as any)}
                                                    style={[
                                                        styles.optionRow,
                                                        distance === opt.value && styles.optionRowActive
                                                    ]}
                                                >
                                                    <Text style={styles.optionIcon}>{opt.icon}</Text>
                                                    <View style={styles.optionRowText}>
                                                        <Text style={[
                                                            styles.optionRowLabel,
                                                            distance === opt.value && styles.optionRowLabelActive
                                                        ]}>{opt.label}</Text>
                                                        <Text style={[
                                                            styles.optionRowSub,
                                                            distance === opt.value && styles.optionRowSubActive
                                                        ]}>{opt.sub}</Text>
                                                    </View>
                                                    {distance === opt.value && (
                                                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Step 5: Activities - SCROLLABLE */}
                                {step === 5 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>🎯</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>What interests you?</Text>
                                        <Text style={styles.questionSubtitle}>
                                            Select all that apply ({selectedCategories.length} selected)
                                        </Text>

                                        <View style={styles.categoriesGrid}>
                                            {CATEGORIES.map(cat => (
                                                <TouchableOpacity
                                                    key={cat.id}
                                                    onPress={() => toggleCategory(cat.value)}
                                                    style={[
                                                        styles.categoryCard,
                                                        selectedCategories.includes(cat.value) && [
                                                            styles.categoryCardActive,
                                                            { borderColor: cat.color }
                                                        ]
                                                    ]}
                                                >
                                                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                                    <Text style={[
                                                        styles.categoryName,
                                                        selectedCategories.includes(cat.value) && styles.categoryNameActive
                                                    ]}>{cat.name}</Text>
                                                    {selectedCategories.includes(cat.value) && (
                                                        <View style={[styles.categoryCheck, { backgroundColor: cat.color }]}>
                                                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={{ height: 100 }} />
                                    </View>
                                )}

                                {/* Step 6: Start Location - FIX TEXT VISIBILITY */}
                                {step === 6 && (
                                    <View style={styles.questionContainer}>
                                        <View style={styles.iconCircle}>
                                            <Text style={styles.iconEmoji}>📌</Text>
                                        </View>
                                        <Text style={styles.questionTitle}>Where to start?</Text>
                                        <Text style={styles.questionSubtitle}>Choose your starting point</Text>

                                        <View style={styles.optionsColumn}>
                                            {[
                                                { value: 'colombo', icon: '🏙️', label: 'Colombo', sub: 'Capital city' },
                                                { value: 'kandy', icon: '🛕', label: 'Kandy', sub: 'Cultural capital' },
                                                { value: 'galle', icon: '🏖️', label: 'Galle', sub: 'Southern coast' },
                                            ].map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => setStartLocation(opt.value as any)}
                                                    style={[
                                                        styles.optionRow,
                                                        startLocation === opt.value && styles.optionRowActive
                                                    ]}
                                                >
                                                    <Text style={styles.optionIcon}>{opt.icon}</Text>
                                                    <View style={styles.optionRowText}>
                                                        <Text style={[
                                                            styles.optionRowLabel,
                                                            startLocation === opt.value && styles.optionRowLabelActive
                                                        ]}>{opt.label}</Text>
                                                        <Text style={[
                                                            styles.optionRowSub,
                                                            startLocation === opt.value && styles.optionRowSubActive
                                                        ]}>{opt.sub}</Text>
                                                    </View>
                                                    {startLocation === opt.value && (
                                                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </Animated.View>
                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* Navigation - FIXED POSITION */}
                    <View style={styles.navigation}>
                        {step > 1 && (
                            <TouchableOpacity onPress={handleBack} style={styles.navButtonSecondary}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                                <Text style={styles.navButtonSecondaryText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        {step < totalSteps ? (
                            <TouchableOpacity onPress={handleNext} style={styles.navButtonPrimary}>
                                <Text style={styles.navButtonPrimaryText}>Next</Text>
                                <MaterialCommunityIcons name="arrow-right" size={24} color="#2E7D32" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handleGenerate}
                                disabled={loading || selectedCategories.length === 0}
                                style={[
                                    styles.navButtonPrimary,
                                    styles.generateButton,
                                    (loading || selectedCategories.length === 0) && styles.generateButtonDisabled
                                ]}
                            >
                                {loading ? (
                                    <Text style={styles.navButtonPrimaryText}>Generating...</Text>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="auto-fix" size={24} color="#2E7D32" />
                                        <Text style={styles.navButtonPrimaryText}>Generate</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    progressContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    progressTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
    },
    progressSteps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressDotActive: {
        backgroundColor: '#FFFFFF',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    questionContainer: {
        alignItems: 'center',
        minHeight: height * 0.5,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    iconEmoji: {
        fontSize: 48,
    },
    questionTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    questionSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginBottom: 24,
    },
    customInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 16,
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    orText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginVertical: 16,
        fontWeight: '600',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    optionBox: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionBoxActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    optionValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    optionValueActive: {
        color: '#2E7D32',
    },
    optionLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '600',
    },
    optionLabelActive: {
        color: '#2E7D32',
    },
    optionsColumn: {
        width: '100%',
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    optionRowActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    optionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    optionRowText: {
        flex: 1,
    },
    optionRowLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    optionRowLabelActive: {
        color: '#2E7D32',
    },
    optionRowSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    optionRowSubActive: {
        color: '#558B2F', // Darker green for visibility
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    categoryCard: {
        width: (width - 72) / 2,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        position: 'relative',
    },
    categoryCardActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
    },
    categoryIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    categoryNameActive: {
        color: '#2E7D32',
    },
    categoryCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navigation: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
        gap: 12,
        backgroundColor: 'rgba(27, 94, 32, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    navButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        gap: 8,
    },
    navButtonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    navButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    navButtonPrimaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2E7D32',
    },
    generateButton: {
        paddingHorizontal: 40,
    },
    generateButtonDisabled: {
        opacity: 0.5,
    },
});