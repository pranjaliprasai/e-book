import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image as RNImage,
    Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from '../../components/services/authServices';
import { API_BASE_URL } from '../../components/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { Themes, ThemeType } from '../../components/constants/Themes';

const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

export default function SettingsScreen() {
    const { user, logout, updateUser } = useAuth();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPicture, setEditPicture] = useState(user?.picture || '');
    const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
    const [editPassword, setEditPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const { theme, colors, setTheme } = useTheme();
    const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditPicture(user.picture || '');
        }
    }, [user]);

    const handleEditProfile = () => {
        setEditName(user?.name || '');
        setEditPicture(user?.picture || '');
        setPickedImageUri(null);
        setEditPassword('');
        setIsEditingProfile(true);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPickedImageUri(result.assets[0].uri);
        }
    };

    const handleUpdateProfile = async () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsUpdating(true);
        try {
            const updateData: any = {
                name: editName,
                profilePictureUri: pickedImageUri
            };

            if (editPassword.trim()) {
                updateData.password = editPassword;
            }

            const res = await updateProfile(updateData);
            if (res.success) {
                await updateUser(res.user);
                Alert.alert('Success', 'Profile updated successfully! ✨');
                setIsEditingProfile(false);
                setPickedImageUri(null);
            } else {
                Alert.alert('Error', res.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update Error:', err);
            Alert.alert('Error', 'Could not connect to server');
        } finally {
            setIsUpdating(false);
        }
    };

    const UserHeader = () => (
        <View style={styles.userProfileSection}>
            {user?.picture ? (
                <Image
                    source={{ uri: user.picture.startsWith('http') ? user.picture : `${IMAGE_BASE_URL}${user.picture}` }}
                    style={styles.largeProfileImage}
                />
            ) : (
                <View style={styles.largeProfilePlaceholder}>
                    <MaterialCommunityIcons name="account" size={50} color={colors.primary} />
                </View>
            )}
            <Text style={[styles.modalUserName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.modalUserEmail, { color: colors.textMuted }]}>{user?.email}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                {isEditingProfile && (
                    <TouchableOpacity onPress={() => setIsEditingProfile(false)} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditingProfile ? 'Edit Profile' : 'Profile'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {isEditingProfile ? (
                        <View style={styles.editForm}>
                            <View style={styles.previewContainer}>
                                <TouchableOpacity onPress={pickImage} style={styles.imagePickerTrigger}>
                                    {pickedImageUri || editPicture ? (
                                        <Image
                                            source={{ uri: pickedImageUri || (editPicture.startsWith('http') ? editPicture : `${IMAGE_BASE_URL}${editPicture}`) }}
                                            style={[styles.previewImage, { borderColor: colors.primary }]}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View style={[styles.largeProfilePlaceholder, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                            <MaterialCommunityIcons name="account-plus" size={40} color={colors.primary} />
                                        </View>
                                    )}
                                    <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                                        <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={[styles.previewSubtext, { color: colors.textMuted }]}>Tap to change photo</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>New Password (Optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={editPassword}
                                    onChangeText={setEditPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.saveProfileBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                                onPress={handleUpdateProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveProfileText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setIsEditingProfile(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <UserHeader />

                            <View style={[styles.menuItems, { backgroundColor: colors.surface }]}>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleEditProfile}>
                                    <MaterialCommunityIcons name="account-edit" size={24} color={colors.primary} />
                                    <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setIsThemeModalVisible(true)}>
                                    <MaterialCommunityIcons name="palette-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.menuText, { color: colors.text }]}>Color Theme</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.logoutMenuItem, { backgroundColor: colors.surface }]}
                                onPress={() => logout()}
                            >
                                <MaterialCommunityIcons name="logout" size={24} color="#CD5C5C" />
                                <Text style={[styles.menuText, { color: '#CD5C5C' }]}>Logout</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Theme Selection Modal */}
            <Modal
                visible={isThemeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsThemeModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsThemeModalVisible(false)}
                >
                    <View style={[styles.themeModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>
                            <TouchableOpacity onPress={() => setIsThemeModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.themeOptions}>
                            {(['green', 'pink', 'brown', 'yellow'] as ThemeType[]).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.themeOption,
                                        { 
                                            backgroundColor: Themes[t].background,
                                            borderColor: theme === t ? Themes[t].primary : Themes[t].border,
                                            borderWidth: theme === t ? 2 : 1
                                        }
                                    ]}
                                    onPress={() => {
                                        setTheme(t);
                                        setIsThemeModalVisible(false);
                                    }}
                                >
                                    <View style={[styles.colorCircle, { backgroundColor: Themes[t].primary }]} />
                                    <Text style={[styles.themeName, { color: Themes[t].text, fontWeight: theme === t ? '900' : '700' }]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'yellow' ? 'Butter' : t === 'brown' ? 'Dark' : ''}
                                    </Text>
                                    {theme === t && (
                                        <MaterialCommunityIcons name="check-circle" size={20} color={Themes[t].primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EBE9E2',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2F4F4F',
    },
    backBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 24,
    },
    userProfileSection: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    largeProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#F0F9E8',
    },
    largeProfilePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EBE9E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalUserName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#2F4F4F',
    },
    modalUserEmail: {
        fontSize: 14,
        color: '#8B7D6B',
        marginTop: 4,
    },
    menuItems: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginLeft: 15,
    },
    logoutMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginTop: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    editForm: {
        marginTop: 10,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imagePickerTrigger: {
        position: 'relative',
    },
    previewImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: '#4F7942',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4F7942',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    previewSubtext: {
        fontSize: 12,
        color: '#8B7D6B',
        marginTop: 8,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#8B7D6B',
        fontWeight: '700',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#EBE9E2',
    },
    saveProfileBtn: {
        backgroundColor: '#4F7942',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#4F7942",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    saveProfileText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
    },
    cancelBtn: {
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelBtnText: {
        color: '#8B7D6B',
        fontSize: 15,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    themeModalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    themeOptions: {
        gap: 12,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    themeName: {
        flex: 1,
        fontSize: 16,
    },
});
