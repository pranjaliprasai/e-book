import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { getBookRecommendations, RecommendedBook } from './services/recommendationServices';
import { API_BASE_URL } from './constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecommendationSectionProps {
    bookId: string;
}

const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ bookId }) => {
    const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            const data = await getBookRecommendations(bookId);
            setRecommendations(data);
            setLoading(false);
        };

        if (bookId) {
            fetchRecommendations();
        }
    }, [bookId]);

    const renderBookItem = ({ item }: { item: RecommendedBook }) => {
        const imageUrl = item.coverImageUrl.startsWith('http')
            ? item.coverImageUrl
            : `${IMAGE_BASE_URL}/${item.coverImageUrl.replace(/\\/g, '/')}`;

        return (
            <TouchableOpacity
                style={styles.bookCard}
                onPress={() => router.push({
                    pathname: '/BookDetails',
                    params: { id: item._id }
                })}
            >
                <Image source={{ uri: imageUrl }} style={styles.coverImage} />
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#6B8E23" />
            </View>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>You might also like</Text>
                <MaterialCommunityIcons name="star-face" size={20} color="#6B8E23" />
            </View>
            <FlatList
                data={recommendations}
                renderItem={renderBookItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 20,
    },
    loaderContainer: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#333',
        marginRight: 8,
    },
    listContent: {
        paddingRight: 20,
    },
    bookCard: {
        width: 140,
        marginRight: 15,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        // Shadow for premium feel
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 5,
    },
    coverImage: {
        width: '100%',
        height: 190,
        borderRadius: 8,
    },
    bookInfo: {
        padding: 8,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        height: 36,
    },
    bookAuthor: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#444',
        marginLeft: 4,
    },
});

export default RecommendationSection;
