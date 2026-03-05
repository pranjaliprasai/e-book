import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { getBookById, deleteBook, toggleFavorite } from '../components/services/bookServices';
import { API_BASE_URL } from '../components/constants/api';
import { useAuth } from '@/hooks/use-auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

export default function BookDetails() {
    const { id } = useLocalSearchParams();
    const [book, setBook] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const { user, updateUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchBookDetails = async () => {
            if (!id) return;
            try {
                const res = await getBookById(id as string);
                if (res.success) {
                    setBook(res.data);
                } else {
                    Alert.alert("Error", "Book not found");
                    router.back();
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetails();
    }, [id]);

    // Separate effect for favorite status to keep it in sync with user context
    useEffect(() => {
        if (user && user.favorites && book) {
            setIsFavorite(user.favorites.includes(book._id));
        }
    }, [user?.favorites, book?._id]);

    const handleToggleFavorite = async () => {
        if (isFavoriting || !book) return;
        setIsFavoriting(true);
        try {
            const res = await toggleFavorite(book._id);
            if (res.success) {
                // The backend returns the updated list of favorites
                if (res.favorites) {
                    updateUser({ favorites: res.favorites });
                }
            } else {
                Alert.alert('Error', res.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFavoriting(false);
        }
    };

    const handleRead = () => {
        if (!book) return;

        let pdfUrl = book.pdfUrl;
        let finalUrl = '';

        if (pdfUrl && pdfUrl.startsWith('http')) {
            finalUrl = pdfUrl;
        } else if (pdfUrl) {
            // Local backend PDF
            finalUrl = `${IMAGE_BASE_URL}/${pdfUrl.replace(/\\/g, '/')}`;
        } else if (book.isDiscovery || book.isbn?.startsWith('GUT-')) {
            // Gutenberg fallback: Use the direct HTML reading link which is more integrated than the landing page
            finalUrl = `https://www.gutenberg.org/ebooks/${book.externalId || ''}.html.images`;
        }

        if (finalUrl) {
            router.push({
                pathname: '/Reader',
                params: { url: finalUrl, title: book.title }
            });
        } else {
            Alert.alert("Notice", "A readable format for this book is not available yet.");
        }
    };

    const handleDelete = async () => {
        try {
            const res = await deleteBook(book._id);
            if (res.success) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', res.message || 'Failed to remove book');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6B8E23" />
            </View>
        );
    }

    if (!book) return null;

    return (
        <ScrollView style={styles.container as any}>
            <Image
                source={{
                    uri: book.coverImageUrl.startsWith('http')
                        ? book.coverImageUrl
                        : `${IMAGE_BASE_URL}/${book.coverImageUrl.replace(/\\/g, '/')}`
                }}
                style={styles.coverImage as any}
                resizeMode="cover"
            />

            <View style={styles.content as any}>
                <View style={styles.titleRow as any}>
                    <Text style={styles.title as any}>{book.title}</Text>
                    <TouchableOpacity
                        onPress={handleToggleFavorite}
                        disabled={isFavoriting}
                        style={styles.favoriteBtn}
                    >
                        {isFavoriting ? (
                            <ActivityIndicator size="small" color="#FF6B6B" />
                        ) : (
                            <MaterialCommunityIcons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={28}
                                color={isFavorite ? "#FF6B6B" : "#A99F92"}
                            />
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.author as any}>by {book.author}</Text>

                <View style={styles.badgeRow as any}>
                    <View style={styles.genreBadge as any}>
                        <Text style={styles.genreText as any}>{book.genre}</Text>
                    </View>
                    <Text style={styles.isbn as any}>ISBN: {book.isbn}</Text>
                </View>

                <View style={styles.section as any}>
                    <Text style={styles.sectionTitle as any}>Description</Text>
                    <Text style={styles.description as any}>{book.description}</Text>
                </View>

                <TouchableOpacity style={styles.readButton as any} onPress={handleRead}>
                    <Text style={styles.readButtonText as any}>Read E-Book</Text>
                </TouchableOpacity>

                {isFavorite && (
                    <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: '#F0F9E8', borderColor: '#D0E6C3' }] as any}
                        onPress={handleToggleFavorite}
                        disabled={isFavoriting}
                    >
                        {isFavoriting ? (
                            <ActivityIndicator size="small" color="#6B8E23" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="heart-remove" size={20} color="#6B8E23" />
                                <Text style={[styles.removeButtonText, { color: '#6B8E23' }] as any}>Remove from Favorites</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Only show 'Remove from Collection' for actual local/imported books */}
                {(!book.isDiscovery && !book.isbn?.startsWith('GUT-') && !book.isbn?.startsWith('OL-')) && (
                    <TouchableOpacity style={styles.removeButton as any} onPress={handleDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#CD5C5C" />
                        <Text style={styles.removeButtonText as any}>Remove from Collection</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImage: {
        width: '100%',
        height: 400,
    },
    content: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    favoriteBtn: {
        padding: 5,
    },
    author: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        justifyContent: 'space-between',
    },
    genreBadge: {
        backgroundColor: '#F0F9E8',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
    },
    genreText: {
        color: '#6B8E23',
        fontWeight: 'bold',
    },
    isbn: {
        color: '#999',
        fontSize: 12,
    },
    section: {
        marginTop: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
    },
    readButton: {
        backgroundColor: '#6B8E23',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    readButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#FFF1F0',
        marginTop: 10,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#FFCCC7',
    },
    removeButtonText: {
        color: '#CD5C5C',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
