import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    TextInput,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { getBooks, importBook, deleteBook, getFavorites } from '../../components/services/bookServices';
import { ExternalBook } from '../../components/services/externalBookServices';
import { API_BASE_URL } from '../../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout, isLoading: authLoading } = useAuth();

    const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);

    // Using simple categories instead of fetching all of them at once
    const CATEGORIES = [
        'Fiction', 'Mystery', 'Thriller', 'Romance', 'Technology',
        'Business', 'Science Fiction', 'Fantasy', 'History', 'Biography'
    ];

    const [categorizedBooks, setCategorizedBooks] = useState<{ [key: string]: any[] }>({});
    const [localBooks, setLocalBooks] = useState<any[]>([]);
    const [gutenbergBooks, setGutenbergBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

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
                Alert.alert('Success', 'Book saved to your collection! 📖');
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

    const renderLocalBook = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

        return (
            <TouchableOpacity
                style={styles.localBookCard}
                onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
            >
                <Image
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
                <Image source={{ uri: item.cover }} style={styles.externalCover} />
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

    if (loading && localBooks.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4F7942" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.userName}>{user?.name || 'Reader'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <MaterialCommunityIcons name="logout" size={24} color="#8B4513" />
                </TouchableOpacity>
            </View>

            {/* Search Bar prominently at the top */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={24} color="#A99F92" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search books, authors..."
                        placeholderTextColor="#A99F92"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleSearch}>
                            <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#4F7942" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

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

                {/* Featured Books (Local Collection) */}
                {localBooks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Featured Books</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { source: 'Local' } })}>
                                <Text style={styles.viewAll}>View All</Text>
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
                            <Text style={styles.sectionTitle}>Gutenberg Classics</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { source: 'Gutenberg' } })}>
                                <Text style={styles.viewAll}>View All</Text>
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
                                <Text style={styles.sectionTitle}>{genre} Books</Text>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/BookListing', params: { category: genre } })}>
                                    <Text style={styles.viewAll}>View All</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F7',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 14,
        color: "#8B7D6B",
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2F4F4F',
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchWrapper: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 15,
        paddingHorizontal: 16,
        height: 56,
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
        color: '#333',
    },
    categoriesSection: {
        marginBottom: 24,
    },
    categoryChip: {
        backgroundColor: '#EBE9E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryText: {
        color: '#2F4F4F',
        fontWeight: '600',
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
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4F4F',
    },
    viewAll: {
        fontSize: 14,
        color: '#4F7942',
        fontWeight: '600',
    },
    horizontalList: {
        paddingLeft: 24,
        paddingRight: 14,
    },
    localBookCard: {
        width: 140,
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginRight: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBE9E2',
    },
    localCover: {
        width: '100%',
        height: 180,
    },
    bookInfo: {
        padding: 10,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    bookAuthor: {
        fontSize: 12,
        color: '#8B7D6B',
        marginTop: 2,
    },
    externalCard: {
        width: 160,
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginRight: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#EBE9E2',
    },
    externalCover: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    externalInfo: {
        marginTop: 10,
    },
    externalTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        height: 38,
    },
    externalAuthor: {
        fontSize: 12,
        color: '#8B7D6B',
        marginTop: 4,
    },
    sourceBadge: {
        backgroundColor: '#F0F9E8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sourceText: {
        fontSize: 10,
        color: '#4F7942',
        fontWeight: 'bold',
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
        paddingHorizontal: 8,
        backgroundColor: '#F0F9E8',
        borderRadius: 8,
    },
    readMoreText: {
        fontSize: 11,
        color: '#4F7942',
        fontWeight: 'bold',
        marginRight: 2,
    },
    localFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 6,
    },
});
