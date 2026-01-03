// constants/Colors.ts

export const Colors = {
    // Primary colors (Green + Blue theme)
    primary: '#2E7D32',        // Forest Green
    primaryLight: '#4CAF50',   // Light Green
    primaryDark: '#1B5E20',    // Dark Green

    secondary: '#1976D2',      // Blue
    secondaryLight: '#42A5F5', // Light Blue
    secondaryDark: '#0D47A1',  // Dark Blue

    accent: '#FFC107',         // Amber (for highlights)
    accentLight: '#FFD54F',

    // Surface colors
    background: '#F1F8F4',     // Very light green tint
    surface: '#FFFFFF',
    surfaceVariant: '#E8F5E9', // Light green surface

    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    // Text colors
    text: '#1B5E20',           // Dark green for primary text
    textSecondary: '#558B2F',  // Medium green for secondary text
    textLight: '#81C784',      // Light green
    textOnPrimary: '#FFFFFF',  // White text on green background
    textOnSecondary: '#FFFFFF',

    // Border and divider
    border: '#C8E6C9',         // Light green border
    divider: '#E0E0E0',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Map colors (district visualization)
    mapLow: '#A5D6A7',         // Light green (low traffic)
    mapMedium: '#FFB74D',      // Orange (medium traffic)
    mapHigh: '#EF5350',        // Red (high traffic)
};

export const categories = [
    { id: 1, name: 'Beach & Relaxation', icon: 'beach', value: 'beach' },
    { id: 2, name: 'Historical Sites', icon: 'monument', value: 'historical' },
    { id: 3, name: 'Temples & Spiritual', icon: 'om', value: 'temple' },
    { id: 4, name: 'National Parks', icon: 'tree', value: 'national_park' },
    { id: 5, name: 'Waterfalls & Nature', icon: 'water', value: 'waterfall' },
    { id: 6, name: 'Mountains & Hiking', icon: 'terrain', value: 'mountain' },
    { id: 7, name: 'Cultural Experiences', icon: 'theater', value: 'cultural' },
    { id: 8, name: 'City Life & Shopping', icon: 'city', value: 'city' },
];