// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                    height: 60 + insets.bottom,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            {/* ── Tourist tabs ── */}
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="myTrips"
                options={
                    isAdmin
                        ? { href: null }   // admins don't need My Trips
                        : {
                            title: 'My Trips',
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="bag-suitcase" size={size} color={color} />
                            ),
                        }
                }
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="earth" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Admin-only tabs ── */}
            <Tabs.Screen
                name="simulator"
                options={
                    isAdmin
                        ? {
                            title: 'Simulator',
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="tune-variant" size={size} color={color} />
                            ),
                        }
                        : { href: null }   // hidden from tourists
                }
            />
            <Tabs.Screen
                name="admin"
                options={
                    isAdmin
                        ? {
                            title: 'Dashboard',
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="shield-crown" size={size} color={color} />
                            ),
                        }
                        : { href: null }   // hidden from tourists
                }
            />

            {/* ── Common last tab ── */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}