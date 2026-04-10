import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityIndicator, View, StatusBar, LogBox } from 'react-native';
import MilestoneStatusBar from '@/components/ui/MilestoneStatusBar';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/hooks/use-theme';


function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const { colors } = useTheme();
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (isLoading) return;

        // Determine if the user is currently on an authentication screen
        // This allows access to Login and Register without being logged in
        const isAuthScreen = segments.some(segment => segment === 'Login' || segment === 'Register');

        if (!user && !isAuthScreen) {
            // If not logged in and not on an auth screen, redirect to Login
            router.replace('/Login');
        } else if (user && isAuthScreen) {
            // If logged in and on an auth screen, redirect to the Home (index)
            router.replace('/');
        }
    }, [user, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1 }}>
                <MilestoneStatusBar />
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="Login" options={{ headerShown: false }} />
                    <Stack.Screen name="Register" options={{ headerShown: false }} />
                    <Stack.Screen name="BookListing" options={{ headerShown: false }} />
                    <Stack.Screen name="BookDetails" options={{ headerShown: false }} />
                    <Stack.Screen name="Reader" options={{ headerShown: false }} />
                    <Stack.Screen name="ReadingMilestones" options={{ title: 'Reading Milestones', headerShown: false }} />
                    <Stack.Screen name="Notifications" options={{ title: 'Notifications', headerShown: false }} />
                </Stack>
            </View>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <AppThemeProvider>
                <RootLayoutNav />
            </AppThemeProvider>
        </AuthProvider>
    );
}
