// app/(auth)/register.tsx
import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'tourist' | 'admin'>('tourist');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name, role);
            Alert.alert('Success', 'Account created successfully!');
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1B5E20', '#2E7D32', '#43A047']}
                style={styles.background}
            >
                {/* Decorative circles */}
                <View style={[styles.decorCircle, { top: -100, right: -100, width: 300, height: 300 }]} />
                <View style={[styles.decorCircle, { bottom: -80, left: -80, width: 250, height: 250 }]} />
                <View style={[styles.decorCircle, { top: 200, right: 50, width: 80, height: 80 }]} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <LinearGradient
                                colors={['#FFFFFF', '#E8F5E9']}
                                style={styles.logoCircle}
                            >
                                <MaterialCommunityIcons name="account-plus" size={64} color={Colors.primary} />
                            </LinearGradient>
                            <Text style={styles.appName}>Create Account</Text>
                            <Text style={styles.tagline}>Join Smart Tourism today</Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                                style={styles.formGradient}
                            >
                                <Text style={styles.formTitle}>Get Started</Text>
                                <Text style={styles.formSubtitle}>Fill in your details to create account</Text>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconBg}>
                                        <MaterialCommunityIcons name="account-outline" size={24} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        label="Full Name"
                                        value={name}
                                        onChangeText={setName}
                                        mode="flat"
                                        style={styles.input}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        theme={{
                                            colors: {
                                                primary: Colors.primary,
                                                background: 'transparent',
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconBg}>
                                        <MaterialCommunityIcons name="email-outline" size={24} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        label="Email"
                                        value={email}
                                        onChangeText={setEmail}
                                        mode="flat"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={styles.input}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        theme={{
                                            colors: {
                                                primary: Colors.primary,
                                                background: 'transparent',
                                            }
                                        }}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconBg}>
                                        <MaterialCommunityIcons name="lock-outline" size={24} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        label="Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        mode="flat"
                                        secureTextEntry={!showPassword}
                                        style={styles.input}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        theme={{
                                            colors: {
                                                primary: Colors.primary,
                                                background: 'transparent',
                                            }
                                        }}
                                        right={
                                            <TextInput.Icon
                                                icon={showPassword ? 'eye-off' : 'eye'}
                                                onPress={() => setShowPassword(!showPassword)}
                                                color={Colors.textSecondary}
                                            />
                                        }
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconBg}>
                                        <MaterialCommunityIcons name="lock-check-outline" size={24} color={Colors.primary} />
                                    </View>
                                    <TextInput
                                        label="Confirm Password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        mode="flat"
                                        secureTextEntry={!showConfirmPassword}
                                        style={styles.input}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        theme={{
                                            colors: {
                                                primary: Colors.primary,
                                                background: 'transparent',
                                            }
                                        }}
                                        right={
                                            <TextInput.Icon
                                                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                color={Colors.textSecondary}
                                            />
                                        }
                                    />
                                </View>

                                {/* Account Type Selection */}
                                <View style={styles.roleSection}>
                                    <Text style={styles.roleTitle}>Account Type</Text>
                                    <View style={styles.roleButtons}>
                                        <TouchableOpacity
                                            onPress={() => setRole('tourist')}
                                            style={[
                                                styles.roleButton,
                                                role === 'tourist' && styles.roleButtonActive
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name="account"
                                                size={28}
                                                color={role === 'tourist' ? '#FFFFFF' : Colors.primary}
                                            />
                                            <Text style={[
                                                styles.roleButtonText,
                                                role === 'tourist' && styles.roleButtonTextActive
                                            ]}>Tourist</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setRole('admin')}
                                            style={[
                                                styles.roleButton,
                                                role === 'admin' && styles.roleButtonActive
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name="shield-crown"
                                                size={28}
                                                color={role === 'admin' ? '#FFFFFF' : Colors.primary}
                                            />
                                            <Text style={[
                                                styles.roleButtonText,
                                                role === 'admin' && styles.roleButtonTextActive
                                            ]}>Admin</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={loading}
                                    style={styles.registerButton}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primaryDark]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.registerGradient}
                                    >
                                        {loading ? (
                                            <Text style={styles.registerText}>Creating account...</Text>
                                        ) : (
                                            <>
                                                <Text style={styles.registerText}>Create Account</Text>
                                                <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push('/(auth)/login')}
                                    style={styles.loginButton}
                                >
                                    <Text style={styles.loginText}>
                                        Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
                                    </Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
    },
    appName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    formCard: {
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    formGradient: {
        padding: 32,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        marginBottom: 16,
        paddingLeft: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 15,
    },
    roleSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: Colors.primaryLight + '40',
    },
    roleButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    roleButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    roleButtonTextActive: {
        color: '#FFFFFF',
    },
    registerButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    registerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    registerText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    loginButton: {
        alignItems: 'center',
    },
    loginText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    loginTextBold: {
        fontWeight: '700',
        color: Colors.primary,
    },
});