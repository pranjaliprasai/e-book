import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image as RNImage,
    Dimensions,
    ScrollView, // Added ScrollView
    Animated, // Added Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { getBooks, getFavorites, getCurrentReadingBooks } from '../../components/services/bookServices';
import { API_BASE_URL } from '../../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

export default function LibraryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const [localBooks, setLocalBooks] = useState<any[]>([]);
    const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);
    const [currentReadingBooks, setCurrentReadingBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'favorites'>('all');
    const scrollY = React.useRef(new Animated.Value(0)).current; // Added scrollY

    const loadLibraryData = async () => {
        setLoading(true);
        console.log('[Library] Refreshing library data...');
        try {
            const [localRes, favRes, readingRes] = await Promise.all([
                getBooks(undefined, false, 50),
                getFavorites(),
                getCurrentReadingBooks()
            ]);

            if (localRes.success) {
                console.log(`[Library] Loaded ${localRes.data?.length} local books`);
                setLocalBooks(localRes.data || []);
            }
            if (favRes.success) {
                console.log(`[Library] Loaded ${favRes.data?.length} favorite books`);
                setFavoriteBooks(favRes.data || []);
            }
            if (readingRes.success) {
                console.log(`[Library] Loaded ${readingRes.data?.length} current reading books`);
                setCurrentReadingBooks(readingRes.data || []);
            }
        } catch (err) {
            console.error('Error loading library:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadLibraryData();
            }
        }, [user])
    );

    const renderBook = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

        return (
            <TouchableOpacity
                style={[styles.bookCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
            >
                <RNImage
                    source={{ uri: coverUri }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.bookAuthor, { color: colors.textMuted }]} numberOfLines={1}>{item.author}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Render header logic
    const renderHeader = () => {
        return (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Your Collection</Text>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Library</Text>
                </View>
                <TouchableOpacity
                    style={styles.milestoneBtn}
                    onPress={() => router.push('/ReadingMilestones')}
                >
                    <MaterialCommunityIcons name="trophy-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    const displayBooks = activeTab === 'all'
        ? localBooks
        : activeTab === 'favorites'
            ? favoriteBooks
            : currentReadingBooks;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            {renderHeader()}

            <View style={[styles.tabsContainer, { backgroundColor: colors.background, paddingBottom: 10 }]}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {(['all', 'reading', 'favorites'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary }]
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab && styles.activeTabText
                            ]}>
                                {tab === 'reading' ? 'Continue Reading' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : displayBooks.length > 0 ? (
                <FlatList
                    data={displayBooks}
                    renderItem={renderBook}
                    keyExtractor={(item) => item._id}
                    numColumns={3}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                />
            ) : (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                    <MaterialCommunityIcons name="bookshelf" size={80} color={colors.border} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Your library is empty</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                        {activeTab === 'all'
                            ? "Start adding books from the Home or Search tabs to build your collection."
                            : activeTab === 'favorites'
                                ? "Add books to your favorites to keep track of what you love."
                                : "Books you've recently started reading will appear here."}
                    </Text>
                    <TouchableOpacity
                        style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.exploreBtnText}>Explore Books</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    milestoneBtn: {
        padding: 8,
        borderRadius: 12,
    },
    tabsContainer: {
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    tabsScroll: {
        flexGrow: 0,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        // colors.primary will be applied inline
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    activeTabText: {
        color: '#FFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 10,
    },
    columnWrapper: {
        justifyContent: 'space-around',
    },
    bookCard: {
        width: width / 3 - 15,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    coverImage: {
        width: '100%',
        height: 140,
        borderRadius: 8,
    },
    bookInfo: {
        marginTop: 8,
    },
    bookTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 16,
    },
    bookAuthor: {
        fontSize: 10,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    exploreBtn: {
        marginTop: 30,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    exploreBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
    },
});
