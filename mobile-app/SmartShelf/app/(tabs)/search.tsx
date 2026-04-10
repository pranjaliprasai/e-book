import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getBooks } from '../../components/services/bookServices';
import { API_BASE_URL } from '../../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

const CATEGORIES = [
    'Fiction', 'Mystery', 'Thriller', 'Romance', 'Technology',
    'Business', 'Science Fiction', 'Fantasy', 'History', 'Biography'
];

export default function SearchScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Fiction');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            // Search both local and external via getBooks
            const res = await getBooks(undefined, true, 20, searchQuery);
            if (res.success) {
                setResults(res.data || []);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderBookResult = ({ item }: { item: any }) => {
        const coverUri = item.coverImageUrl?.startsWith('http')
            ? item.coverImageUrl
            : item.coverImageUrl 
                ? `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`
                : 'https://via.placeholder.com/150';

        return (
            <TouchableOpacity
                style={[styles.resultCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push({ pathname: '/BookDetails' as any, params: { id: item._id } })}
            >
                <RNImage
                    source={{ uri: coverUri }}
                    style={[styles.resultCover, { backgroundColor: colors.background }]}
                />
                <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.resultAuthor, { color: colors.textMuted }]}>{item.author}</Text>
                    <View style={[styles.resultBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>{item.genre || 'Story'}</Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
                    <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search for stories or people"
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        autoFocus={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setHasSearched(false); }}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Category Tabs */}
                <FlatList
                    horizontal
                    data={CATEGORIES}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesHeader}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.categoryTab, 
                                activeCategory === item && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                            ]}
                            onPress={() => setActiveCategory(item)}
                        >
                            <Text style={[
                                styles.categoryTabText, 
                                { color: activeCategory === item ? colors.primary : colors.textMuted }
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : hasSearched ? (
                results.length > 0 ? (
                    <FlatList
                        data={results}
                        renderItem={renderBookResult}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.resultsList}
                        ListHeaderComponent={
                            <View style={styles.resultsHeader}>
                                <Text style={[styles.resultsCount, { color: colors.text }]}>{results.length} Stories</Text>
                                <TouchableOpacity
                                    style={[styles.filterBtn, { backgroundColor: colors.surface }]}
                                    onPress={() => { /* Filter logic placeholder */ }}
                                >
                                    <MaterialCommunityIcons name="tune" size={18} color={colors.primary} />
                                    <Text style={[styles.filterBtnText, { color: colors.primary }]}>Filter</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="book-search-outline" size={80} color={colors.border} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Try searching for something else or explore trending categories.</Text>
                    </View>
                )
            ) : (
                <FlatList
                    data={CATEGORIES}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.categoriesList}
                    ListHeaderComponent={<Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.categoryItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push({ pathname: '/BookListing', params: { category: item } })}
                        >
                            <Text style={[styles.categoryText, { color: colors.text }]}>{item}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    categoriesHeader: {
        paddingTop: 10,
        paddingLeft: 4,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 4,
    },
    categoryTabText: {
        fontSize: 15,
        fontWeight: '700',
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        marginBottom: 5,
    },
    resultsCount: {
        fontSize: 20,
        fontWeight: '900',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsList: {
        padding: 20,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    resultCover: {
        width: 60,
        height: 90,
        borderRadius: 4,
    },
    resultInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    resultAuthor: {
        fontSize: 13,
        marginTop: 4,
    },
    resultBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    categoriesList: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 15,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '700',
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
});
