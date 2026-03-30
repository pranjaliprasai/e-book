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
} from 'react-native';
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { getBooks, importBook, deleteBook, getFavorites, getCurrentReadingBooks } from '../../components/services/bookServices';
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
    // Inbox Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    inboxContainer: {
        height: '80%',
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
    },
    inboxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    inboxTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    notifItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
    },
    unreadItem: {
        backgroundColor: colors.surface,
    },
    notifIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },
    notifMessage: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
    },
    notifTime: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 8,
    },
    emptyInbox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        marginTop: 16,
        textAlign: 'center',
    },
});

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout, updateUser, isLoading: authLoading } = useAuth();
    const { colors } = useTheme();

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showInbox, setShowInbox] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/Login');
        }
    }, [user, authLoading]);



    const loadInitialData = async () => {
        setLoading(true);
        try {
            console.log('--- Loading Home Content ---');

            // Collection: Featured Books (books explicitly added to collection)
            const localRes = await getBooks(undefined, false, 15);
            if (localRes.success) {
                setLocalBooks(localRes.data || []);
            }

            // Fetch favorites
            const favRes = await getFavorites();
            if (favRes.success) {
                setFavoriteBooks(favRes.data || []);
            }

            // Fetch Current Reading
            const readingRes = await getCurrentReadingBooks();
            if (readingRes.success) {
                setCurrentReadingBooks(readingRes.data || []);
            }

            // Fetch Gutenberg Classics from DB
            const gutRes = await getBooks(undefined, true, 15, undefined, 'Gutenberg');
            if (gutRes.success) {
                setGutenbergBooks(gutRes.data || []);
            }

            // Categories: fetch up to 100 books per category from Project Gutenberg
            const genreData: { [key: string]: any[] } = {};
            await Promise.all(CATEGORIES.map(async (genre) => {
                const res = await getBooks(genre, true, 100, undefined, 'Gutenberg');
                if (res.success && res.data?.length > 0) {
                    genreData[genre] = res.data;
                }
            }));

            setCategorizedBooks(genreData);

            // Fetch Notifications
            const notifRes = await getNotifications();
            if (notifRes.success) {
                setNotifications(notifRes.data || []);
                setUnreadCount(notifRes.unreadCount || 0);
            }

        } catch (err) {
            console.error('Error loading home data:', err);
        } finally {
            setLoading(false);
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

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
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

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadInitialData();
            }
        }, [user])
    );

    const handleUpdateProfile = () => {
        // Migrated to settings tab
        router.push('/settings');
    };

    const renderReadingBook = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

        const progress = item.progress || 0;

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
                    <View>
                        <Text style={styles.readingTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.readingAuthor} numberOfLines={1}>{item.author}</Text>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}% read</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderLocalBook = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

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

    const styles = getStyles(colors);

    if (loading && localBooks.length === 0) {
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
                        onPress={() => setShowInbox(true)}
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            </ScrollView>

            <Modal
                visible={showInbox}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInbox(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.inboxContainer}>
                        <View style={styles.inboxHeader}>
                            <Text style={styles.inboxTitle}>Notifications</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={handleMarkAllAsRead} style={{ marginRight: 20 }}>
                                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Mark all as read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setShowInbox(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {notifications.length > 0 ? (
                            <FlatList
                                data={notifications}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.notifItem, !item.isRead && styles.unreadItem]}
                                        onPress={() => handleMarkAsRead(item._id)}
                                    >
                                        <View style={styles.notifIcon}>
                                            <MaterialCommunityIcons
                                                name={item.type === 'milestone' ? 'trophy' : 'bell'}
                                                size={20}
                                                color={item.isRead ? colors.textMuted : colors.primary}
                                            />
                                        </View>
                                        <View style={styles.notifContent}>
                                            <Text style={styles.notifTitle}>{item.title}</Text>
                                            <Text style={styles.notifMessage}>{item.message}</Text>
                                            <Text style={styles.notifTime}>
                                                {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        {!item.isRead && (
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, alignSelf: 'center' }} />
                                        )}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 40 }}
                            />
                        ) : (
                            <View style={styles.emptyInbox}>
                                <MaterialCommunityIcons name="bell-off-outline" size={64} color={colors.border} />
                                <Text style={styles.emptyText}>No notifications yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
