import React, { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    TextInput,
    ScrollView,
    Dimensions,
    Modal,
    RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { getBooks, importBook, deleteBook, getFavorites, getCurrentReadingBooks, deleteProgress } from '../../components/services/bookServices';
import { getProfile } from '../../components/services/authServices';
import { getNotifications, markAsRead, markAllAsRead } from '../../components/services/notificationServices';
import { ExternalBook } from '../../components/services/externalBookServices';
import { API_BASE_URL } from '../../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 0,
        paddingRight: 16,
        paddingTop: 0,
        paddingBottom: 0,
    },
    headerLogo: {
        width: 100,
        height: 100,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        marginLeft: 5,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profilePlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchWrapper: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: colors.text,
    },
    categoriesSection: {
        marginBottom: 20,
    },
    categoryChip: {
        backgroundColor: colors.border,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryText: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    viewAll: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '700',
    },
    horizontalList: {
        paddingLeft: 24,
        paddingRight: 14,
    },
    localBookCard: {
        width: 130,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginRight: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 10,
    },
    localCover: {
        width: '100%',
        height: 180,
    },
    bookInfo: {
        padding: 8,
    },
    bookTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text,
        lineHeight: 18,
    },
    bookAuthor: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    externalCard: {
        width: 150,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginRight: 16,
        padding: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 10,
    },
    externalCover: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    externalInfo: {
        marginTop: 8,
    },
    externalTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text,
        height: 36,
    },
    externalAuthor: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    readingCard: {
        width: 250,
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginRight: 16,
        padding: 12,
        flexDirection: 'row',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    readingCover: {
        width: 80,
        height: 110,
        borderRadius: 8,
    },
    readingInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    readingTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.text,
    },
    readingAuthor: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    progressContainer: {
        marginTop: 10,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: colors.background,
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '800',
        marginTop: 4,
        textAlign: 'right',
    },
    sourceBadge: {
        backgroundColor: colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sourceText: {
        fontSize: 9,
        color: colors.primary,
        fontWeight: '900',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    saveBtn: {
        padding: 4,
    },
    readMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        backgroundColor: colors.background,
        borderRadius: 6,
    },
    readMoreText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '900',
        marginRight: 2,
    },
    localFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 6,
    },
    // Notification styles
    notificationBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
});

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout, updateUser, isLoading: authLoading } = useAuth();
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);

    // Using simple categories instead of fetching all of them at once
    const CATEGORIES = [
        'Fiction', 'Mystery', 'Thriller', 'Romance', 'Technology',
        'Business', 'Science Fiction', 'Fantasy', 'History', 'Biography'
    ];

    const [categorizedBooks, setCategorizedBooks] = useState<{ [key: string]: any[] }>({});
    const [localBooks, setLocalBooks] = useState<any[]>([]);
    const [currentReadingBooks, setCurrentReadingBooks] = useState<any[]>([]);
    const [gutenbergBooks, setGutenbergBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true); // Start as true so it triggers the indicator while loadInitialData runs
    const [saving, setSaving] = useState<string | number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [hasConnectionError, setHasConnectionError] = useState(false);

    // Initial load: Only show fullscreen loader if it's the very first time and we have NO data
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const retryCount = useRef(0);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadInitialData().finally(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/Login');
        }
    }, [user, authLoading]);



    const loadInitialData = async () => {
        // Prevent concurrent re-loads
        if (loading && !isFirstLoad) return; 
        
        setLoading(true);
        setHasConnectionError(false);
        const startTime = Date.now();

        try {
            console.log('--- Loading Home Content (Sequenced Strategy) ---');

            // 1. Mandatory Profile Fetch first (ensures token is active and valid)
            const profileRes = await getProfile();
            if (profileRes.success) {
               console.log(`⏱️ [Home] Profile verified in ${Date.now() - startTime}ms`);
               setUserProfile(profileRes.user);
               updateUser(profileRes.user);
            } else {
               console.warn('⚠️ [Home] Profile verification failed. Potential 401 or network drop.');
               // If profile failed, we likely have a session issue
               setHasConnectionError(true);
               setLoading(false);
               setIsFirstLoad(false);
               return;
            }

            // 2. Fetch critical lists (Local, Progress, Reading)
            const [localRes, favRes, readingRes] = await Promise.all([
                getBooks(undefined, false, 15),
                getFavorites(),
                getCurrentReadingBooks()
            ]);

            if (localRes.success) setLocalBooks(localRes.data || []);
            if (favRes.success) setFavoriteBooks(favRes.data || []);
            if (readingRes.success) setCurrentReadingBooks(readingRes.data || []);

            // 3. Persistent Gutenberg Discovery Logic (with Retry)
            let discoverySuccessful = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!discoverySuccessful && attempts < MAX_ATTEMPTS) {
                attempts++;
                console.log(`📡 [Home] Discovery Fetch Attempt ${attempts}/${MAX_ATTEMPTS}...`);
                
                // Try fetching discovery books (broad search first for best results)
                const gutRes = await getBooks(undefined, true, 15);
                
                if (gutRes.success && gutRes.data?.length > 0) {
                    setGutenbergBooks(gutRes.data);
                    discoverySuccessful = true;
                    console.log(`✅ [Home] Discovery success on attempt ${attempts}. Count: ${gutRes.data.length}`);
                } else if (attempts < MAX_ATTEMPTS) {
                    console.log(`⏳ [Home] Discovery empty/failed, retrying in ${800 * attempts}ms...`);
                    await new Promise(resolve => setTimeout(resolve, 800 * attempts));
                }
            }

            // 4. Background Sequential Genre Fetch (Lowest priority, one at a time)
            if (Object.keys(categorizedBooks).length === 0) {
                (async () => {
                    const topGenres = ['Fiction', 'Technology', 'Science Fiction', 'Mystery', 'History'];
                    for (const genre of topGenres) {
                        try {
                            const res = await getBooks(genre, true, 20);
                            if (res.success && res.data?.length > 0) {
                                setCategorizedBooks(prev => ({ ...prev, [genre]: res.data }));
                            }
                        } catch (e) {}
                    }
                })();
            }

            // Notifications
            try {
                const notifRes = await getNotifications();
                if (notifRes.success) {
                    setNotifications(notifRes.data || []);
                    setUnreadCount(notifRes.unreadCount || 0);
                }
            } catch (e) {}

        } catch (err: any) {
            console.error('❌ [Home] Critical error during load:', err.message);
            setHasConnectionError(true);
        } finally {
            console.log('🏁 [Home] Load sequence finished.');
            
            const hasData = localBooks.length > 0 || currentReadingBooks.length > 0 || gutenbergBooks.length > 0;

            // AUTOMATIC RETRY: If this was the first load and we STILL have no books, 
            // try one more time without stopping the spinner.
            if (!hasConnectionError && 
                !hasData && 
                isFirstLoad &&
                retryCount.current < 2) {
                
                retryCount.current += 1;
                console.log(`🔄 [Home] No books found. Auto-retry ${retryCount.current}/2 in 2s...`);
                // Keep loading true
                setLoading(true);
                setTimeout(() => {
                    loadInitialData();
                }, 2000);
            } else {
                setLoading(false);
                setIsFirstLoad(false);
                if (hasData) retryCount.current = 0; 
            }

            setRefreshing(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        // Navigate or search locally. If navigating to a listing screen:
        router.push({ pathname: '/BookListing', params: { query: searchQuery } });
        setSearchQuery('');
        setIsSearching(false);
    };



    const handleSaveBook = async (book: ExternalBook) => {
        setSaving(book.id);
        try {
            const bookData = {
                title: book.title,
                author: book.authors[0] || 'Unknown Author',
                // Generate a stable ISBN based on external source and ID to prevent duplicates
                isbn: book.source === 'Gutenberg' ? `GUT-${book.id}` : `OL-${book.id}`,
                genre: book.source,
                description: book.description || `Fetched from ${book.source}`,
                coverImageUrl: book.cover,
                pdfUrl: book.downloadUrl || '',
                externalId: String(book.id)
            };

            const res = await importBook(bookData);
            if (res.success) {
                Alert.alert('Success', 'Book saved to your collection!');
                loadInitialData(); // Refresh local list
            } else {
                Alert.alert('Info', res.message || 'Could not save book.');
            }
        } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setSaving(null);
        }
    };

    const handleDeleteLocalBook = async (id: string) => {
        // Optimistic UI update
        const originalBooks = [...localBooks];
        setLocalBooks(prev => prev.filter(b => b._id !== id));

        try {
            const res = await deleteBook(id);
            if (!res.success) {
                Alert.alert('Error', res.message || 'Failed to remove book');
                setLocalBooks(originalBooks); // Rollback
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to connect to server');
            setLocalBooks(originalBooks); // Rollback
        }
    };

    // One-time load on mount or when user changes (e.g. login/logout)
    useEffect(() => {
        // Log readiness for debugging
        if (!authLoading) {
            if (user?._id) {
                console.log('🏁 [Home] Initial fetch triggered for user ID:', user._id);
                loadInitialData();
            } else if (!user) {
                // Clear state on logout so the next user starts fresh
                setLocalBooks([]);
                setFavoriteBooks([]);
                setCurrentReadingBooks([]);
                setGutenbergBooks([]);
                setCategorizedBooks({});
                setHasConnectionError(false);
                setIsFirstLoad(true); // Reset to show loader on next login
                setLoading(true);
                retryCount.current = 0;
                console.log('🧹 [Home] Auth state cleared on logout');
            }
        }
    }, [user?._id, authLoading]); // Use primitive ID to avoid infinite loops from updateUser calls

    // Failsafe: Ensure spinner disappears after 25s if something is stuck
    // This is longer than 12s because slow tunnels (ngrok) and cold starts can take longer
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ [Home] Loading failsafe triggered. Stopping spinner after 25s.');
                setLoading(false);
                setIsFirstLoad(false);
            }
        }, 25000);
        return () => clearTimeout(timer);
    }, [loading]);

    const handleRemoveProgress = async (bookId: string) => {
        Alert.alert(
            "Remove Book",
            "Are you sure you want to remove this book from Continue Reading?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await deleteProgress(bookId);
                            if (res.success) {
                                setCurrentReadingBooks(prev => prev.filter(b => b._id !== bookId));
                            } else {
                                Alert.alert("Error", res.message || "Failed to remove progress");
                            }
                        } catch (err) {
                            Alert.alert("Error", "Failed to connect to server");
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateProfile = () => {
        // Migrated to settings tab
        router.push('/settings');
    };

    const renderReadingBook = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

        const originalProgress = item.progress || 0;
        // Cap legacy progress values (pixels) to 100%
        const progress = Math.min(originalProgress, 100);

        return (
            <TouchableOpacity
                style={styles.readingCard}
                onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
            >
                <RNImage
                    source={{ uri: coverUri }}
                    style={styles.readingCover}
                    resizeMode="cover"
                />
                <View style={styles.readingInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.readingTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.readingAuthor} numberOfLines={1}>{item.author}</Text>
                        </View>
                        <TouchableOpacity style={{ padding: 4 }} onPress={() => handleRemoveProgress(item._id)}>
                            <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#4F7942' : colors.primary }]} />
                        </View>
                        {progress >= 100 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                                <MaterialCommunityIcons name="check-circle" size={14} color="#4F7942" />
                                <Text style={[styles.progressText, { color: '#4F7942', marginTop: 0, marginLeft: 4 }]}>Completed</Text>
                            </View>
                        ) : (
                            <Text style={styles.progressText}>{Math.round(progress)}% read</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderLocalBook = ({ item }: { item: any }) => {
        const coverImageUrl = item.coverImageUrl || "";
        const coverUri = coverImageUrl.startsWith('http')
            ? coverImageUrl
            : `${IMAGE_BASE_URL}/${coverImageUrl.replace(/\\/g, '/')}`;

        return (
            <TouchableOpacity
                style={styles.localBookCard}
                onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
            >
                <RNImage
                    source={{ uri: coverUri }}
                    style={styles.localCover}
                    resizeMode="cover"
                />
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                    <View style={styles.localFooter}>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
                            style={styles.readMoreBtn}
                        >
                            <Text style={styles.readMoreText}>Read More</Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="#4F7942" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderExternalBook = ({ item }: { item: ExternalBook }) => {
        const isSaved = localBooks.some(b => b.externalId === String(item.id));

        return (
            <TouchableOpacity
                style={styles.externalCard}
                onPress={() => {
                    console.log('Selected external book:', item.title);
                }}
            >
                <RNImage source={{ uri: item.cover }} style={styles.externalCover} />
                <View style={styles.externalInfo}>
                    <Text style={styles.externalTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.externalAuthor} numberOfLines={1}>{item.authors[0]}</Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.sourceBadge}>
                            <Text style={styles.sourceText}>{item.source}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => handleSaveBook(item)}
                            disabled={saving === item.id || isSaved}
                        >
                            {saving === item.id ? (
                                <ActivityIndicator size="small" color="#4F7942" />
                            ) : isSaved ? (
                                <MaterialCommunityIcons name="check-circle" size={24} color="#4F7942" />
                            ) : (
                                <MaterialCommunityIcons name="bookmark-plus" size={24} color="#4F7942" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategoryChip = ({ item }: { item: string }) => {
        return (
            <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => router.push({ pathname: '/BookListing', params: { category: item } })}
            >
                <Text style={styles.categoryText}>{item}</Text>
            </TouchableOpacity>
        );
    };

    if (isFirstLoad && loading && localBooks.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4F7942" />
            </View>
        );
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Image
                    source={require('../../assets/images/smartshelf_logo.png')}
                    style={styles.headerLogo}
                    contentFit="contain"
                />
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => router.push('/Notifications')}
                    >
                        <MaterialCommunityIcons name="bell-outline" size={26} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.profileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push('/settings')}
                    >
                        {user?.picture ? (
                            <Image
                                source={{
                                    uri: user.picture.startsWith('http')
                                        ? user.picture
                                        : `${IMAGE_BASE_URL}${user.picture}`
                                }}
                                style={styles.profileImage}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.profilePlaceholder, { backgroundColor: colors.background }]}>
                                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F7942"]} tintColor="#4F7942" />
                }
            >
                {(!loading && hasConnectionError) ? (
                    <View style={{ flex: 1, paddingVertical: 100, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                        <MaterialCommunityIcons name="wifi-off" size={64} color={colors.textMuted} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16 }}>Unable to connect to server</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
                            Please check if your backend and tunnel are running.
                        </Text>
                        <TouchableOpacity 
                            onPress={loadInitialData}
                            style={{ 
                                backgroundColor: colors.primary, 
                                paddingHorizontal: 24, 
                                paddingVertical: 12, 
                                borderRadius: 8, 
                                marginTop: 24 
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Search Bar prominently at the top */}
                        <View style={styles.searchWrapper}>
                            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search books, authors..."
                                    placeholderTextColor={colors.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={handleSearch}>
                                        <MaterialCommunityIcons name="arrow-right-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                {/* Categories */}
                <View style={styles.categoriesSection}>
                    <FlatList
                        data={CATEGORIES}
                        renderItem={renderCategoryChip}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* Continue Reading Shelf */}
                {currentReadingBooks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Continue Reading</Text>
                            <TouchableOpacity onPress={() => router.push('/library')}>
                                <Text style={styles.viewAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={currentReadingBooks}
                            renderItem={renderReadingBook}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>
                )}

                {/* Favorite Books */}
                {favoriteBooks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="heart" size={24} color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Books</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/library')}>
                                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={favoriteBooks}
                            renderItem={renderLocalBook}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>
                )}

                {/* Featured Books (Local Collection) */}
                {localBooks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Books</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { source: 'Local' } })}>
                                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={localBooks}
                            renderItem={renderLocalBook}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>
                )}

                {/* Gutenberg Classics (from DB) */}
                {!isSearching && gutenbergBooks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gutenberg Classics</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { source: 'Gutenberg' } })}>
                                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={gutenbergBooks}
                            renderItem={renderLocalBook}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>
                )}

                {/* Categorized DB Discovery Sections */}
                {!isSearching && CATEGORIES.map((genre) => (
                    categorizedBooks[genre]?.length > 0 && (
                        <View style={styles.section} key={genre}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{genre} Books</Text>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { category: genre } })}>
                                    <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={categorizedBooks[genre]}
                                renderItem={renderLocalBook}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={styles.horizontalList}
                            />
                        </View>
                    )
                ))}

                {/* Empty State Fallback (If no errors but everything is empty) */}
                {!loading && !isFirstLoad && !hasConnectionError && 
                 localBooks.length === 0 && 
                 currentReadingBooks.length === 0 && 
                 gutenbergBooks.length === 0 && 
                 Object.keys(categorizedBooks).length === 0 && (
                    <View style={{ flex: 1, paddingVertical: 100, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                        <MaterialCommunityIcons name="book-open-variant" size={64} color={colors.textMuted} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16 }}>No books available yet</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
                            You haven't added any books yet, and the discovery list is currently empty.
                        </Text>
                        <TouchableOpacity 
                            onPress={onRefresh}
                            style={{ 
                                backgroundColor: colors.primary, 
                                paddingHorizontal: 24, 
                                paddingVertical: 12, 
                                borderRadius: 8, 
                                marginTop: 24 
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Refresh List</Text>
                        </TouchableOpacity>
                    </View>
                )}
                </>
            )}
            </ScrollView>

        </SafeAreaView>
    );
}
