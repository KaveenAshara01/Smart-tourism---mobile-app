// app/(tabs)/home.tsx
import { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ImageBackground, TouchableOpacity, Animated } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

export default function Home() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section with parallax effect */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={['#1B5E20', '#2E7D32', '#43A047']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.hero}
                    >
                        {/* Decorative circles */}
                        <View style={[styles.decorCircle, { top: -50, right: -50, width: 200, height: 200, opacity: 0.1 }]} />
                        <View style={[styles.decorCircle, { bottom: -30, left: -30, width: 150, height: 150, opacity: 0.15 }]} />

                        <SafeAreaView edges={['top']}>
                            <View style={styles.heroHeader}>
                                <View>
                                    <Text style={styles.greeting}>Welcome back,</Text>
                                    <Text style={styles.userName}>{user?.displayName} 👋</Text>
                                </View>
                                <TouchableOpacity style={styles.notificationButton}>
                                    <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                                    <View style={styles.notificationBadge} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.heroContent}>
                                <View style={styles.iconContainer}>
                                    <LinearGradient
                                        colors={['#FFFFFF', '#E8F5E9']}
                                        style={styles.iconGradient}
                                    >
                                        <MaterialCommunityIcons name="palm-tree" size={48} color="#2E7D32" />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.heroTitle}>Discover Sri Lanka</Text>
                                <Text style={styles.heroSubtitle}>
                                    AI-powered personalized travel experiences
                                </Text>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                </View>

                {/* Main CTA Card - Elevated with shadow */}
                <View style={styles.ctaWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => router.push('/questionnaire')}
                    >
                        <LinearGradient
                            colors={['#1976D2', '#1565C0', '#0D47A1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaCard}
                        >
                            <View style={styles.ctaIconBg}>
                                <MaterialCommunityIcons name="sparkles" size={40} color="#FFD700" />
                            </View>
                            <Text style={styles.ctaTitle}>Create Your Dream Trip</Text>
                            <Text style={styles.ctaDescription}>
                                Answer a few questions and let AI craft the perfect itinerary for you
                            </Text>
                            <View style={styles.ctaButton}>
                                <Text style={styles.ctaButtonText}>Get Started</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#1976D2" />
                            </View>

                            {/* Decorative elements */}
                            <View style={[styles.decorDot, { top: 20, right: 20 }]} />
                            <View style={[styles.decorDot, { bottom: 20, left: 20 }]} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    {[
                        { icon: 'map-marker-multiple', value: '120+', label: 'Attractions', gradient: ['#4CAF50', '#388E3C'] },
                        { icon: 'map-outline', value: '12', label: 'Districts', gradient: ['#2196F3', '#1976D2'] },
                        { icon: 'robot', value: 'AI', label: 'Powered', gradient: ['#FF9800', '#F57C00'] },
                    ].map((stat, index) => (
                        <LinearGradient
                            key={index}
                            colors={stat.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statCard}
                        >
                            <MaterialCommunityIcons name={stat.icon as any} size={32} color="#FFFFFF" />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </LinearGradient>
                    ))}
                </View>

                {/* Features Grid - Beautiful cards */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Smart Features</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.featuresGrid}>
                        {[
                            {
                                icon: 'map-marker-path',
                                title: 'Smart Routes',
                                desc: 'Optimized paths',
                                color: '#4CAF50',
                                gradient: ['#81C784', '#66BB6A']
                            },
                            {
                                icon: 'weather-partly-cloudy',
                                title: 'Weather Intel',
                                desc: 'Real-time updates',
                                color: '#2196F3',
                                gradient: ['#64B5F6', '#42A5F5']
                            },
                            {
                                icon: 'shield-check',
                                title: 'Safety First',
                                desc: 'Live alerts',
                                color: '#FF9800',
                                gradient: ['#FFB74D', '#FFA726']
                            },
                            {
                                icon: 'account-group',
                                title: 'Crowd Monitor',
                                desc: 'Avoid rushes',
                                color: '#9C27B0',
                                gradient: ['#BA68C8', '#AB47BC']
                            },
                        ].map((feature, index) => (
                            <TouchableOpacity key={index} style={styles.featureCard} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={feature.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.featureGradient}
                                >
                                    <View style={styles.featureIconBg}>
                                        <MaterialCommunityIcons name={feature.icon as any} size={28} color={feature.color} />
                                    </View>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                                    <MaterialCommunityIcons
                                        name="arrow-right-circle"
                                        size={24}
                                        color="rgba(255,255,255,0.9)"
                                        style={styles.featureArrow}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions - Floating buttons */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Access</Text>

                    <View style={styles.quickActionsGrid}>
                        {[
                            { icon: 'earth', label: 'Digital Twin', route: '/(tabs)/map', colors: ['#1976D2', '#1565C0'] },
                            { icon: 'bag-suitcase', label: 'My Trips', route: '/(tabs)/myTrips', colors: ['#2E7D32', '#1B5E20'] },
                            { icon: 'star', label: 'Favorites', route: '/(tabs)/profile', colors: ['#F57C00', '#E65100'] },
                            { icon: 'cog', label: 'Settings', route: '/(tabs)/profile', colors: ['#7B1FA2', '#6A1B9A'] },
                        ].map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => router.push(action.route as any)}
                                style={styles.quickActionCard}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={action.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.quickActionGradient}
                                >
                                    <MaterialCommunityIcons name={action.icon as any} size={28} color="#FFFFFF" />
                                </LinearGradient>
                                <Text style={styles.quickActionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Popular Destinations Preview */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Destinations</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Explore →</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
                        {[
                            { name: 'Sigiriya', image: '🏰', subtitle: 'Ancient Wonder' },
                            { name: 'Ella', image: '🏔️', subtitle: 'Mountain Paradise' },
                            { name: 'Galle', image: '🏖️', subtitle: 'Coastal Beauty' },
                            { name: 'Kandy', image: '🛕', subtitle: 'Cultural Hub' },
                        ].map((dest, index) => (
                            <TouchableOpacity key={index} style={styles.destinationCard} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={['rgba(46, 125, 50, 0.9)', 'rgba(27, 94, 32, 0.95)']}
                                    style={styles.destinationGradient}
                                >
                                    <Text style={styles.destinationImage}>{dest.image}</Text>
                                    <View style={styles.destinationInfo}>
                                        <Text style={styles.destinationName}>{dest.name}</Text>
                                        <Text style={styles.destinationSubtitle}>{dest.subtitle}</Text>
                                    </View>
                                    <View style={styles.destinationBadge}>
                                        <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                                        <Text style={styles.destinationRating}>4.8</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
    heroContainer: {
        marginBottom: -60,
    },
    hero: {
        paddingBottom: 80,
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF5252',
        borderWidth: 2,
        borderColor: '#2E7D32',
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 32,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    ctaWrapper: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    ctaCard: {
        borderRadius: 24,
        padding: 28,
        shadowColor: '#1976D2',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    ctaIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    ctaTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    ctaDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
        marginBottom: 24,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1976D2',
    },
    decorDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
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
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1B5E20',
        marginBottom: 15
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976D2',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featureCard: {
        width: (width - 52) / 2,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    featureGradient: {
        padding: 20,
        minHeight: 140,
        position: 'relative',
    },
    featureIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    featureArrow: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    quickActionCard: {
        width: isSmallScreen
            ? (width - 20 * 2 - 16) / 2   // 2 columns
            : (width - 20 * 2 - 16 * 3) / 4, // 4 columns
        alignItems: 'center',
    },
    quickActionGradient: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1B5E20',
        marginTop: 8,
        textAlign: 'center',
    },
    destinationsScroll: {
        marginLeft: -20,
        paddingLeft: 20,
    },
    destinationCard: {
        width: 160,
        height: 200,
        borderRadius: 20,
        marginRight: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    destinationGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    destinationImage: {
        fontSize: 76,
        textAlign: 'center',
        marginTop: 10,
    },
    destinationInfo: {
        marginTop: 'auto',
    },
    destinationName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    destinationSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    destinationBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    destinationRating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});