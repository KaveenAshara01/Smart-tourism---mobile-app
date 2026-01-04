// app/(tabs)/profile.tsx
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Profile() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: 'cog', label: 'Account Settings', color: Colors.primary, onPress: () => {} },
        { icon: 'shield-lock', label: 'Privacy & Data', color: Colors.secondary, onPress: () => {} },
        { icon: 'help-circle', label: 'Help & Support', color: Colors.warning, onPress: () => {} },
        { icon: 'information', label: 'About Smart Tourism', color: Colors.success, onPress: () => {} },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with gradient */}
                <LinearGradient
                    colors={['#1B5E20', '#2E7D32', '#43A047']}
                    style={styles.header}
                >
                    {/* Decorative circles */}
                    <View style={[styles.decorCircle, { top: -50, right: -50, width: 150, height: 150 }]} />
                    <View style={[styles.decorCircle, { bottom: -30, left: -30, width: 100, height: 100 }]} />

                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={['#FFFFFF', '#E8F5E9']}
                                style={styles.avatarCircle}
                            >
                                <Avatar.Text
                                    size={100}
                                    label={user?.displayName.substring(0, 2).toUpperCase() || 'U'}
                                    style={styles.avatar}
                                    color={Colors.primary}
                                    labelStyle={{ fontSize: 40, fontWeight: '900' }}
                                />
                            </LinearGradient>
                        </View>
                        <Text style={styles.name}>{user?.displayName}</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                        <View style={styles.roleChip}>
                            <MaterialCommunityIcons
                                name={user?.role === 'admin' ? 'shield-crown' : 'account'}
                                size={20}
                                color="#FFFFFF"
                            />
                            <Text style={styles.roleText}>
                                {user?.role === 'admin' ? 'Admin' : 'Tourist'}
                            </Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Stats Card */}
                <View style={styles.statsContainer}>
                    {[
                        { icon: 'map-marker-path', value: '0', label: 'Trips', color: Colors.primary },
                        { icon: 'map-marker-check', value: '0', label: 'Visited', color: Colors.secondary },
                        { icon: 'star', value: '0', label: 'Reviews', color: Colors.warning },
                    ].map((stat, idx) => (
                        <LinearGradient
                            key={idx}
                            colors={[stat.color, stat.color + 'DD']}
                            style={styles.statCard}
                        >
                            <MaterialCommunityIcons name={stat.icon as any} size={28} color="#FFFFFF" />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </LinearGradient>
                    ))}
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={item.onPress}
                            style={styles.menuItem}
                        >
                            <View style={[styles.menuIconBg, { backgroundColor: item.color + '20' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <LinearGradient
                        colors={['#F44336', '#D32F2F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logoutGradient}
                    >
                        <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.version}>Smart Tourism v1.0.0</Text>
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
    header: {
        paddingBottom: 40,
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: 20,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
    },
    avatar: {
        backgroundColor: 'transparent',
    },
    name: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    email: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    roleText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: -30,
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 12,
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
    menuContainer: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    logoutButton: {
        margin: 16,
        marginTop: 24,
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    logoutText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    version: {
        textAlign: 'center',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 16,
    },
});