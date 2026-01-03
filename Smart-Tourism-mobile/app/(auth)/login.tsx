// app/(auth)/login.tsx
import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
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
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <LinearGradient
                            colors={['#FFFFFF', '#E8F5E9']}
                            style={styles.logoCircle}
                        >
                            <MaterialCommunityIcons name="palm-tree" size={64} color={Colors.primary} />
                        </LinearGradient>
                        <Text style={styles.appName}>Smart Tourism</Text>
                        <Text style={styles.tagline}>Your AI Travel Companion</Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                            style={styles.formGradient}
                        >
                            <Text style={styles.formTitle}>Welcome Back</Text>
                            <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

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
                                    textColor={Colors.text}
                                    placeholderTextColor={Colors.textSecondary}
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
                                    textColor={Colors.text}
                                    placeholderTextColor={Colors.textSecondary}
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

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                style={styles.loginButton}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.loginGradient}
                                >
                                    {loading ? (
                                        <Text style={styles.loginText}>Signing in...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.loginText}>Sign In</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => {}} style={styles.forgotButton}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/register')}
                                style={styles.registerButton}
                            >
                                <Text style={styles.registerText}>
                                    Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
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
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
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
        marginBottom: 32,
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
    loginButton: {
        borderRadius: 25,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    loginGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    loginText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    forgotButton: {
        alignSelf: 'center',
        marginTop: 16,
        paddingVertical: 8,
    },
    forgotText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
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
    registerButton: {
        alignItems: 'center',
    },
    registerText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    registerTextBold: {
        fontWeight: '700',
        color: Colors.primary,
    },
});