// app/(tabs)/admin.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { forecastService, monitoringService, crisisService, ForecastResult, MonitoringStatus, CrisisScores } from '../../services/itineraryService';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/API';

const { width } = Dimensions.get('window');

interface AdminStats {
    model_version: string;
    avg_mape: number;
    drift_detected: boolean;
    drift_severity: string;
    xgboost_weight: number;
    lstm_weight: number;
    action_taken: string;
    components_loaded: { forecast: boolean; sentiment: boolean; itinerary: boolean };
    forecast_summary: {
        total_predicted_tourists: number;
        top_district: string;
        prediction_month: string;
        r2: number;
        mape: number;
    } | null;
}

interface DistrictComparison {
    district: string;
    district_label: string;
    predicted: number;
    actual: number;
    mae: number;
    mape: number;
    r2: number;
    error_pct: number;
    over_predicted: boolean;
}

interface ComparisonData {
    prediction_month: string;
    source: string;
    districts: DistrictComparison[];
    overall: { avg_mape: number; avg_r2: number; districts_count: number };
}

const SEVERITY_COLOR: Record<string, string> = {
    none: '#4CAF50', low: '#8BC34A', medium: '#FFC107', high: '#FF5722', critical: '#F44336',
};

const DISTRICT_LABELS: Record<string, string> = {
    colombo: 'Colombo', kandy: 'Kandy', galle: 'Galle', badulla: 'Badulla',
    gampaha: 'Gampaha', matale: 'Matale', nuwara_eliya: 'Nuwara Eliya',
    kalutara: 'Kalutara', matara: 'Matara', anuradhapura: 'Anuradhapura',
    hambantota: 'Hambantota', polonnaruwa: 'Polonnaruwa',
};

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [monitoring, setMonitoring] = useState<MonitoringStatus | null>(null);
    const [crisis, setCrisis] = useState<CrisisScores | null>(null);
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [statsRes, forecastRes, monRes, crisisRes, compRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}${API_ENDPOINTS.GET_STATS}`),
                forecastService.getForecast(),
                monitoringService.getStatus(),
                crisisService.getCurrentScores(),
                axios.get(`${API_BASE_URL}/api/monitoring/comparison`),
            ]);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value);
            if (monRes.status === 'fulfilled') setMonitoring(monRes.value);
            if (crisisRes.status === 'fulfilled') setCrisis(crisisRes.value);
            if (compRes.status === 'fulfilled') setComparison(compRes.value.data);
        } catch { /* ignore */ } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, []);

    const onRefresh = () => { setRefreshing(true); loadAll(); };

    const sortedDistricts = forecast
        ? Object.entries(forecast.district_level)
            .sort((a, b) => b[1].predicted_visitors - a[1].predicted_visitors)
        : [];

    const topDistrict = sortedDistricts[0];
    const maxVisitors = topDistrict?.[1].predicted_visitors ?? 1;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.loadingGradient}>
                    <ActivityIndicator color="#FFFFFF" size="large" />
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    {/* ── Header ── */}
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
                        <View style={[styles.decorCircle, { top: -40, right: -40, width: 160, height: 160, opacity: 0.12 }]} />
                        <View style={[styles.decorCircle, { bottom: -20, left: -20, width: 100, height: 100, opacity: 0.1 }]} />
                        <View style={styles.headerRow}>
                            <View>
                                <Text style={styles.headerGreeting}>Admin Panel</Text>
                                <Text style={styles.headerName}>{user?.displayName}</Text>
                            </View>
                            <View style={styles.headerRight}>
                                <View style={[styles.statusDot, { backgroundColor: stats?.components_loaded?.forecast ? '#69F0AE' : '#FF5252' }]} />
                                <Text style={styles.statusText}>
                                    {stats?.components_loaded?.forecast ? 'ML Online' : 'ML Offline'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.modelRow}>
                            <View style={styles.modelBadge}>
                                <MaterialCommunityIcons name="chip" size={14} color="#FFFFFF" />
                                <Text style={styles.modelBadgeText}>Model {stats?.model_version ?? 'v1'}</Text>
                            </View>
                            {monitoring?.drift_detected && (
                                <View style={[styles.driftBadge, { backgroundColor: SEVERITY_COLOR[monitoring.severity] + 'CC' }]}>
                                    <MaterialCommunityIcons name="alert" size={14} color="#FFFFFF" />
                                    <Text style={styles.driftBadgeText}>Drift: {monitoring.severity}</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>

                    {/* ── KPI row ── */}
                    <View style={styles.kpiRow}>
                        {[
                            {
                                label: 'Total Predicted\nTourists',
                                value: forecast
                                    ? `${(forecast.country_level.total_district_visits / 1000).toFixed(0)}K`
                                    : '—',
                                icon: 'account-group' as const,
                                color: '#2196F3',
                            },
                            {
                                label: 'Model MAPE',
                                value: stats?.avg_mape != null ? `${stats.avg_mape.toFixed(1)}%` : '—',
                                icon: 'chart-bell-curve' as const,
                                color: (stats?.avg_mape ?? 0) < 15 ? '#4CAF50' : '#FF9800',
                            },
                            {
                                label: 'Model R²',
                                value: forecast ? forecast.model_metadata.r2.toFixed(3) : '—',
                                icon: 'function-variant' as const,
                                color: '#9C27B0',
                            },
                        ].map((kpi, i) => (
                            <View key={i} style={styles.kpiCard}>
                                <View style={[styles.kpiIconBg, { backgroundColor: kpi.color + '20' }]}>
                                    <MaterialCommunityIcons name={kpi.icon} size={22} color={kpi.color} />
                                </View>
                                <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Predicted vs Actual Comparison ── */}
                    {comparison && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Predicted vs Actual</Text>
                                    <Text style={styles.sectionSub}>Last evaluated: {comparison.prediction_month}</Text>
                                </View>
                                <View style={styles.sourceBadge}>
                                    <MaterialCommunityIcons
                                        name={comparison.source === 'monitoring_db' ? 'database-check' : 'database-refresh'}
                                        size={12}
                                        color={comparison.source === 'monitoring_db' ? Colors.primary : '#FF9800'}
                                    />
                                    <Text style={[styles.sourceBadgeText, {
                                        color: comparison.source === 'monitoring_db' ? Colors.primary : '#FF9800'
                                    }]}>
                                        {comparison.source === 'monitoring_db' ? 'Live DB' : 'Synthetic'}
                                    </Text>
                                </View>
                            </View>

                            {/* Overall accuracy summary row */}
                            <View style={styles.accuracySummaryRow}>
                                <View style={styles.accuracyChip}>
                                    <Text style={styles.accuracyChipValue}>{comparison.overall.avg_mape.toFixed(1)}%</Text>
                                    <Text style={styles.accuracyChipLabel}>Avg MAPE</Text>
                                </View>
                                <View style={styles.accuracyDivider} />
                                <View style={styles.accuracyChip}>
                                    <Text style={styles.accuracyChipValue}>{comparison.overall.avg_r2.toFixed(3)}</Text>
                                    <Text style={styles.accuracyChipLabel}>Avg R²</Text>
                                </View>
                                <View style={styles.accuracyDivider} />
                                <View style={styles.accuracyChip}>
                                    <Text style={styles.accuracyChipValue}>{comparison.overall.districts_count}</Text>
                                    <Text style={styles.accuracyChipLabel}>Districts</Text>
                                </View>
                            </View>

                            {/* Per-district comparison rows */}
                            <View style={styles.comparisonCard}>
                                {/* Header row */}
                                <View style={styles.compHeader}>
                                    <Text style={[styles.compHeaderText, { flex: 1.4 }]}>District</Text>
                                    <Text style={[styles.compHeaderText, { flex: 1, textAlign: 'right' }]}>Predicted</Text>
                                    <Text style={[styles.compHeaderText, { flex: 1, textAlign: 'right' }]}>Actual</Text>
                                    <Text style={[styles.compHeaderText, { flex: 0.8, textAlign: 'right' }]}>Error</Text>
                                </View>

                                {comparison.districts.slice(0, 8).map((d, i) => {
                                    const errColor = Math.abs(d.error_pct) < 10
                                        ? '#4CAF50'
                                        : Math.abs(d.error_pct) < 20 ? '#FF9800' : '#F44336';
                                    const isLast = i === Math.min(comparison.districts.length, 8) - 1;
                                    return (
                                        <View key={`cmp-${i}-${d.district}`} style={[
                                            styles.compRow,
                                            !isLast && { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }
                                        ]}>
                                            <View style={{ flex: 1.4 }}>
                                                <Text style={styles.compDistrict}>{d.district_label}</Text>
                                                <Text style={styles.compMape}>MAPE {d.mape.toFixed(1)}%</Text>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                                <Text style={styles.compPredicted}>
                                                    {(d.predicted / 1000).toFixed(1)}K
                                                </Text>
                                                {/* Mini bar: predicted */}
                                                <View style={styles.miniBarTrack}>
                                                    <View style={[styles.miniBarFill, {
                                                        width: `${Math.min((d.predicted / Math.max(...comparison.districts.map(x => x.predicted))) * 100, 100)}%` as any,
                                                        backgroundColor: '#2196F3',
                                                    }]} />
                                                </View>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                                <Text style={styles.compActual}>
                                                    {(d.actual / 1000).toFixed(1)}K
                                                </Text>
                                                {/* Mini bar: actual */}
                                                <View style={styles.miniBarTrack}>
                                                    <View style={[styles.miniBarFill, {
                                                        width: `${Math.min((d.actual / Math.max(...comparison.districts.map(x => x.predicted))) * 100, 100)}%` as any,
                                                        backgroundColor: '#4CAF50',
                                                    }]} />
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                                                <View style={[styles.errorBadge, { backgroundColor: errColor + '18' }]}>
                                                    <MaterialCommunityIcons
                                                        name={d.over_predicted ? 'arrow-up-circle' : 'arrow-down-circle'}
                                                        size={11}
                                                        color={errColor}
                                                    />
                                                    <Text style={[styles.errorBadgeText, { color: errColor }]}>
                                                        {Math.abs(d.error_pct).toFixed(1)}%
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* Legend */}
                                <View style={styles.legendRow}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                                        <Text style={styles.legendText}>Predicted</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                                        <Text style={styles.legendText}>Actual</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <MaterialCommunityIcons name="arrow-up-circle" size={13} color="#F44336" />
                                        <Text style={styles.legendText}>Over-predicted</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <MaterialCommunityIcons name="arrow-down-circle" size={13} color="#4CAF50" />
                                        <Text style={styles.legendText}>Under-predicted</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Ensemble weights ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ensemble Weights</Text>
                        <View style={styles.ensembleCard}>
                            {[
                                { label: 'XGBoost', weight: monitoring?.xgboost_weight ?? stats?.xgboost_weight ?? 0.55, color: '#FF9800' },
                                { label: 'LSTM', weight: monitoring?.lstm_weight ?? stats?.lstm_weight ?? 0.45, color: '#2196F3' },
                            ].map((m, i) => (
                                <View key={i} style={styles.weightRow}>
                                    <View style={styles.weightLabelRow}>
                                        <MaterialCommunityIcons
                                            name={m.label === 'XGBoost' ? 'tree' : 'brain'}
                                            size={18} color={m.color}
                                        />
                                        <Text style={styles.weightLabel}>{m.label}</Text>
                                        <Text style={[styles.weightPct, { color: m.color }]}>
                                            {(m.weight * 100).toFixed(1)}%
                                        </Text>
                                    </View>
                                    <View style={styles.weightTrack}>
                                        <View style={[styles.weightFill, { width: `${m.weight * 100}%` as any, backgroundColor: m.color }]} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Monitoring status ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Model Monitoring</Text>
                        <View style={styles.monitoringCard}>
                            {[
                                {
                                    label: 'Drift Status',
                                    value: monitoring?.drift_detected ? `Detected (${monitoring.severity})` : 'None',
                                    icon: 'alert-circle' as const,
                                    color: monitoring?.drift_detected
                                        ? SEVERITY_COLOR[monitoring.severity ?? 'low']
                                        : '#4CAF50',
                                },
                                {
                                    label: 'Action Taken',
                                    value: monitoring?.action_taken ?? stats?.action_taken ?? 'monitor',
                                    icon: 'cog' as const,
                                    color: '#607D8B',
                                },
                                {
                                    label: 'Last Run',
                                    value: monitoring?.last_run
                                        ? new Date(monitoring.last_run).toLocaleDateString()
                                        : 'No data',
                                    icon: 'clock-check' as const,
                                    color: '#9C27B0',
                                },
                            ].map((item, i) => (
                                <View key={i} style={[styles.monitorRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                                    <View style={[styles.monitorIconBg, { backgroundColor: item.color + '18' }]}>
                                        <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.monitorLabel}>{item.label}</Text>
                                    <Text style={[styles.monitorValue, { color: item.color }]} numberOfLines={1}>
                                        {item.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Components status ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ML Components</Text>
                        <View style={styles.componentsGrid}>
                            {[
                                { label: 'Component 1\nForecasting', loaded: stats?.components_loaded?.forecast, icon: 'chart-line' as const },
                                { label: 'Component 2\nSentiment', loaded: stats?.components_loaded?.sentiment, icon: 'emoticon-happy' as const },
                                { label: 'Component 3\nMonitoring', loaded: monitoring !== null, icon: 'monitor-eye' as const },
                                { label: 'Component 4\nItinerary', loaded: stats?.components_loaded?.itinerary, icon: 'map-marker-path' as const },
                            ].map((comp, i) => (
                                <View key={i} style={[styles.compCard, { borderColor: comp.loaded ? Colors.primary + '40' : '#FF525240' }]}>
                                    <View style={[styles.compIconBg, { backgroundColor: comp.loaded ? Colors.primary + '15' : '#FF525215' }]}>
                                        <MaterialCommunityIcons name={comp.icon} size={24} color={comp.loaded ? Colors.primary : '#FF5252'} />
                                    </View>
                                    <Text style={styles.compLabel}>{comp.label}</Text>
                                    <View style={[styles.compBadge, { backgroundColor: comp.loaded ? '#E8F5E9' : '#FFEBEE' }]}>
                                        <MaterialCommunityIcons
                                            name={comp.loaded ? 'check-circle' : 'close-circle'}
                                            size={14}
                                            color={comp.loaded ? '#4CAF50' : '#FF5252'}
                                        />
                                        <Text style={[styles.compStatus, { color: comp.loaded ? '#4CAF50' : '#FF5252' }]}>
                                            {comp.loaded ? 'Loaded' : 'Offline'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── District forecast chart ── */}
                    {sortedDistricts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                District Forecasts — {forecast?.prediction_month}
                            </Text>
                            <View style={styles.districtChart}>
                                {sortedDistricts.slice(0, 8).map(([key, val], i) => {
                                    const pct = (val.predicted_visitors / maxVisitors) * 100;
                                    const barColor = i === 0 ? Colors.primary : i < 3 ? '#4CAF50' : '#90A4AE';
                                    return (
                                        <View key={key} style={styles.districtRow}>
                                            <Text style={styles.districtLabel} numberOfLines={1}>
                                                {DISTRICT_LABELS[key] ?? key}
                                            </Text>
                                            <View style={styles.districtBarTrack}>
                                                <LinearGradient
                                                    colors={[barColor, barColor + 'AA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[styles.districtBarFill, { width: `${pct}%` as any }]}
                                                />
                                            </View>
                                            <Text style={styles.districtValue}>
                                                {(val.predicted_visitors / 1000).toFixed(0)}K
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ── Crisis scores from GDELT ── */}
                    {crisis && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Crisis Scores</Text>
                                <View style={styles.gdeltBadge}>
                                    <MaterialCommunityIcons name="database-check" size={12} color={Colors.primary} />
                                    <Text style={styles.gdeltText}>GDELT {crisis.month}</Text>
                                </View>
                            </View>
                            <View style={styles.crisisGrid}>
                                {Object.entries(crisis.scores)
                                    .filter(([k]) => k !== 'composite_crisis')
                                    .map(([key, val]) => {
                                        const pct = val * 100;
                                        const color = pct < 20 ? '#4CAF50' : pct < 40 ? '#FF9800' : '#F44336';
                                        const icons: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
                                            terror: 'bomb', economic: 'trending-down',
                                            unrest: 'account-group', disaster: 'weather-hurricane',
                                            disease: 'virus', crime: 'shield-alert', diplomacy: 'handshake',
                                        };
                                        return (
                                            <View key={key} style={styles.crisisCard}>
                                                <View style={[styles.crisisIconBg, { backgroundColor: color + '20' }]}>
                                                    <MaterialCommunityIcons name={icons[key] ?? 'alert'} size={20} color={color} />
                                                </View>
                                                <Text style={styles.crisisLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                                <Text style={[styles.crisisScore, { color }]}>{pct.toFixed(1)}%</Text>
                                                <View style={styles.crisisTrack}>
                                                    <View style={[styles.crisisFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                                                </View>
                                            </View>
                                        );
                                    })}
                            </View>
                        </View>
                    )}



                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FBF9' },
    loadingContainer: { flex: 1 },
    loadingGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    header: { padding: 24, paddingTop: 16, overflow: 'hidden', position: 'relative' },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    headerName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    modelRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    modelBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    modelBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    driftBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    driftBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    kpiRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
    kpiCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    kpiIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
    kpiLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
    section: { paddingHorizontal: 16, marginTop: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    sectionSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    sourceBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        backgroundColor: Colors.primary + '12',
    },
    sourceBadgeText: { fontSize: 11, fontWeight: '700' },
    // Accuracy summary
    accuracySummaryRow: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16,
        padding: 16, marginBottom: 14, alignItems: 'center', justifyContent: 'space-around',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 6,
    },
    accuracyChip: { alignItems: 'center', flex: 1 },
    accuracyChipValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
    accuracyChipLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    accuracyDivider: { width: 1, height: 36, backgroundColor: Colors.border },
    // Comparison table
    comparisonCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    compHeader: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: Colors.primary + '0E', borderBottomWidth: 1.5, borderBottomColor: Colors.primary + '20',
    },
    compHeaderText: { fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    compRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    compDistrict: { fontSize: 13, fontWeight: '700', color: Colors.text },
    compMape: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    compPredicted: { fontSize: 13, fontWeight: '800', color: '#2196F3' },
    compActual: { fontSize: 13, fontWeight: '800', color: '#4CAF50' },
    miniBarTrack: { height: 4, width: 56, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden', marginTop: 3 },
    miniBarFill: { height: '100%', borderRadius: 2 },
    errorBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8,
    },
    errorBadgeText: { fontSize: 10, fontWeight: '800' },
    legendRow: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16,
        paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0',
        backgroundColor: '#FAFAFA',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
    // Ensemble
    ensembleCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    weightRow: { gap: 10 },
    weightLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    weightLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
    weightPct: { fontSize: 16, fontWeight: '900' },
    weightTrack: { height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden' },
    weightFill: { height: '100%', borderRadius: 5 },
    // Monitoring
    monitoringCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    monitorRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    monitorIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    monitorLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    monitorValue: { fontSize: 14, fontWeight: '700', maxWidth: width * 0.4 },
    // Components
    componentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    compCard: {
        width: (width - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 18,
        padding: 16, alignItems: 'center', borderWidth: 1.5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 6,
    },
    compIconBg: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    compLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 16, marginBottom: 10 },
    compBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    compStatus: { fontSize: 12, fontWeight: '700' },
    // District chart
    districtChart: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    },
    districtRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    districtLabel: { width: 90, fontSize: 12, fontWeight: '600', color: Colors.text },
    districtBarTrack: { flex: 1, height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden' },
    districtBarFill: { height: '100%', borderRadius: 5 },
    districtValue: { width: 38, fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
    // GDELT
    gdeltBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    gdeltText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    // Crisis
    crisisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    crisisCard: {
        width: (width - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 6,
    },
    crisisIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    crisisLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    crisisScore: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
    crisisTrack: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    crisisFill: { height: '100%', borderRadius: 3 },
    // Logout
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, backgroundColor: '#FFEBEE',
        borderRadius: 20, borderWidth: 1.5, borderColor: '#FF525240',
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#FF5252' },
});