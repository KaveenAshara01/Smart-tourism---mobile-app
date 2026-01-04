// app/(tabs)/admin.tsx
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Admin() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="shield-crown" size={40} color={Colors.primary} />
                <Text variant="headlineMedium" style={styles.title}>
                    Admin Dashboard
                </Text>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium">System Statistics</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Coming soon...
                    </Text>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium">User Management</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Coming soon...
                    </Text>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium">Analytics</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Coming soon...
                    </Text>
                </Card.Content>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        marginTop: 8,
    },
    card: {
        margin: 16,
        marginTop: 8,
    },
    subtitle: {
        marginTop: 8,
        color: Colors.textSecondary,
    },
});