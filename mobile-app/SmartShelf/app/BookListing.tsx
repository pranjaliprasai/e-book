import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getBooks } from '../components/services/bookServices';
import { API_BASE_URL } from '../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
// Calculate card width for 2 columns with some padding
const CARD_WIDTH = (width - 48 - 16) / 2; // 24 horizontal padding on sides, 16 gap between columns
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

interface BookItem {
    id: string; // The ID used for navigation
    title: string;
    author: string;
    coverUrl: string;
    rating?: number; // Optional rating
    isExternal: boolean; // Flag to determine if it's an external book without full details yet
    originalData: any; // Keep the original object just in case
}

export default function BookListing() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('Books');

    useEffect(() => {
        const fetchListingData = async () => {
            setLoading(true);
            try {
                const { category, source, query } = params;

                let fetchedBooks: BookItem[] = [];

                if (category) {
                    setTitle(`${category} Books`);
                    const res = await getBooks(category as string, true);
                    if (res.success && res.data) {
                        fetchedBooks = res.data.map((b: any) => ({
                            id: b._id,
                            title: b.title,
                            author: b.author,
                            coverUrl: b.coverImageUrl.startsWith('http')
                                ? b.coverImageUrl
                                : `${IMAGE_BASE_URL}/${b.coverImageUrl.replace(/\\/g, '/')}`,
                            rating: 4.5, // Mock rating for now
                            isExternal: false,
                            originalData: b,
                        }));
                    }
                } else if (source === 'Local') {
                    setTitle('Featured Books');
                    const res = await getBooks(undefined, false);
                    if (res.success && res.data) {
                        fetchedBooks = res.data.map((b: any) => ({
                            id: b._id,
                            title: b.title,
                            author: b.author,
                            coverUrl: b.coverImageUrl.startsWith('http')
                                ? b.coverImageUrl
                                : `${IMAGE_BASE_URL}/${b.coverImageUrl.replace(/\\/g, '/')}`,
                            rating: 4.8, // Mock rating
                            isExternal: false,
                            originalData: b,
                        }));
                    }
                } else if (source === 'Gutenberg') {
                    setTitle('Recommended Books');
                    // Fetch from our local DB using the new source filter
                    const res = await getBooks(undefined, true, undefined, undefined, 'Gutenberg');
                    if (res.success && res.data) {
                        fetchedBooks = res.data.map((b: any) => ({
                            id: b._id,
                            title: b.title,
                            author: b.author,
                            coverUrl: b.coverImageUrl.startsWith('http')
                                ? b.coverImageUrl
                                : `${IMAGE_BASE_URL}/${b.coverImageUrl.replace(/\\/g, '/')}`,
                            rating: 4.2, // Mock rating
                            isExternal: false, // It's in our DB now
                            originalData: b,
                        }));
                    }
                } else if (query) {
                    setTitle(`Results for "${query}"`);
                    // Fetch directly from our robust backend search (title, author, genre)
                    const res = await getBooks(undefined, undefined, undefined, query as string);

                    if (res.success && res.data) {
                        fetchedBooks = res.data.map((b: any) => ({
                            id: b._id,
                            title: b.title,
                            author: b.author,
                            coverUrl: b.coverImageUrl.startsWith('http')
                                ? b.coverImageUrl
                                : `${IMAGE_BASE_URL}/${b.coverImageUrl.replace(/\\/g, '/')}`,
                            rating: 4.5, // Mock rating
                            isExternal: false,
                            originalData: b,
                        }));
                    }
                }

                console.log("📚 Fetched Books Array Length:", fetchedBooks.length);
                if (fetchedBooks.length > 0) {
                    console.log("📚 First book sampled:", fetchedBooks[0].title);
                }
                setBooks(fetchedBooks);
            } catch (err: any) {
                console.error('Error fetching list details:', err);
                // Inform the user about timeouts or network errors
                const errorMsg = err.message?.toLowerCase().includes('timeout')
                    ? "The search timed out. Please check your connection to the server."
                    : "Failed to fetch books. Please try again later.";
                Alert.alert("Search Error", errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchListingData();
    }, [params.category, params.source, params.query]);

    const handleBookPress = (item: BookItem) => {
        if (!item.isExternal) {
            router.push({ pathname: '/BookDetails', params: { id: item.id } });
        } else {
            // For external books without a local ID, we might need to save them first or navigate to a specialized view.
            // For now, prompt the user or handle it like the home screen does.
            console.log("Selected external book from listing:", item.title);
            // Ideally, pass full object or handle external details
        }
    };

    const renderStars = (rating = 4.5) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<MaterialCommunityIcons key={i} name="star" size={14} color="#FFD700" />);
            } else if (i === fullStars && hasHalf) {
                stars.push(<MaterialCommunityIcons key={i} name="star-half-full" size={14} color="#FFD700" />);
            } else {
                stars.push(<MaterialCommunityIcons key={i} name="star-outline" size={14} color="#D3D3D3" />);
            }
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    const renderBookItem = ({ item }: { item: BookItem }) => {
        return (
            <TouchableOpacity style={styles.card} onPress={() => handleBookPress(item)}>
                <Image source={{ uri: item.coverUrl }} style={styles.coverImage} resizeMode="cover" />
                <View style={styles.cardContent}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                        {item.author}
                    </Text>
                    <View style={styles.ratingRow}>
                        {renderStars(item.rating)}
                        <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <Stack.Screen options={{ title, headerShown: false }} />

            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#2F4F4F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4F7942" />
                </View>
            ) : books.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="bookshelf" size={64} color="#EBE9E2" />
                    <Text style={styles.noResultsText}>No books found.</Text>
                </View>
            ) : (
                <FlatList
                    data={books}
                    renderItem={renderBookItem}
                    keyExtractor={(item) => `${item.isExternal ? 'ext' : 'loc'}-${item.id}`}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F7',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#F9F9F7',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F4F4F',
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBE9E2',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    coverImage: {
        width: '100%',
        height: CARD_WIDTH * 1.4, // Aspect ratio
    },
    cardContent: {
        padding: 12,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2F4F4F',
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    bookAuthor: {
        fontSize: 12,
        color: '#8B7D6B',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#A99F92',
        fontWeight: '600',
    },
    noResultsText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8B7D6B',
    },
});
