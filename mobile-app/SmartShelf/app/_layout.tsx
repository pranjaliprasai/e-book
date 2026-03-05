import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityIndicator, View, StatusBar } from 'react-native';

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
                <ActivityIndicator size="large" color="#6B8E23" />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="BookListing" options={{ title: 'Books' }} />
                <Stack.Screen name="BookDetails" options={{ title: 'Book Details' }} />
                <Stack.Screen name="Reader" options={{ headerShown: false }} />
            </Stack>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
