import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getComments, addComment, deleteComment } from './services/commentServices';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL } from './constants/api';

const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

interface CommentSectionProps {
    bookId: string;
}

export default function CommentSection({ bookId }: CommentSectionProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchComments();
    }, [bookId]);

    const fetchComments = async () => {
        try {
            const res = await getComments(bookId);
            if (res.success) {
                setComments(res.data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await addComment(bookId, newComment);
            if (res.success) {
                // The backend returns the newly created comment with populated user info
                setComments([res.data, ...comments]);
                setNewComment('');
                Keyboard.dismiss();
            } else {
                Alert.alert('Error', res.message || 'Failed to add comment');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = (commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await deleteComment(commentId);
                            if (res.success) {
                                setComments(comments.filter(c => c._id !== commentId));
                            } else {
                                Alert.alert('Error', res.message || 'Failed to delete comment');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete comment');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6B8E23" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Readers' Thoughts</Text>

            {/* Input Section */}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newComment.trim() && styles.disabledButton]}
                    onPress={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <MaterialCommunityIcons name="send" size={24} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Comments List */}
            {comments.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="comment-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyText}>Be the first to share your thoughts!</Text>
                </View>
            ) : (
                comments.map((item) => (
                    <View key={item._id} style={styles.commentItem}>
                        <Image
                            source={
                                item.userId?.picture
                                    ? { uri: item.userId.picture.startsWith('http') ? item.userId.picture : `${IMAGE_BASE_URL}/${item.userId.picture}` }
                                    : require('../assets/images/favicon.png') // Fallback icon
                            }
                            style={styles.avatar}
                        />
                        <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.userName}>{item.userId?.fullName || 'Anonymous'}</Text>
                                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                            </View>
                            <Text style={styles.text}>{item.content}</Text>
                        </View>
                        {user && user._id === item.userId?._id && (
                            <TouchableOpacity
                                onPress={() => handleDeleteComment(item._id)}
                                style={styles.deleteButton}
                            >
                                <MaterialCommunityIcons name="dots-vertical" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#333',
        marginBottom: 15,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 15,
        color: '#333',
        paddingTop: 5,
    },
    sendButton: {
        backgroundColor: '#6B8E23',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    disabledButton: {
        backgroundColor: '#A9AF9E',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#FFF',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEE',
    },
    commentContent: {
        flex: 1,
        marginLeft: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginRight: 8,
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    text: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    deleteButton: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    },
});
