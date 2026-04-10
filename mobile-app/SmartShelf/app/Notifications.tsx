import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useFocusEffect } from '@react-navigation/native';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead 
} from '../components/services/notificationServices';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotifications();
            if (res.success) {
                setNotifications(res.data || []);
                setUnreadCount(res.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadNotifications();
            }
        }, [user])
    );

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return; // Already read
        
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            await markAsRead(id);
        } catch (err) {
            console.error('Error marking as read:', err);
            // Revert on error if needed, but usually fine
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            
            await markAllAsRead();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const renderNotification = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.notifItem, 
                { borderBottomColor: colors.border },
                !item.isRead && [styles.unreadItem, { backgroundColor: colors.surface }]
            ]}
            onPress={() => handleMarkAsRead(item._id, item.isRead)}
        >
            <View style={[styles.notifIcon, { backgroundColor: colors.border }]}>
                <MaterialCommunityIcons
                    name={item.type === 'milestone' ? 'trophy' : 'bell'}
                    size={22}
                    color={item.isRead ? colors.textMuted : colors.primary}
                />
            </View>
            <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.notifMessage, { color: colors.textMuted }]}>{item.message}</Text>
                <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 80 }} />}
            </View>

            {loading && notifications.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={loadNotifications}
                />
            ) : (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="bell-off-outline" size={80} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No notifications yet</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    markAllText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    listContent: {
        flexGrow: 1,
    },
    notifItem: {
        padding: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    unreadItem: {
        // backgroundColor matches colors.surface inline
    },
    notifIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notifMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    notifTime: {
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        alignSelf: 'center',
        marginLeft: 10,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 20,
        textAlign: 'center',
    },
});
