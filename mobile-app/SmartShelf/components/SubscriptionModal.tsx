import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscribe: () => void;
}

const { width } = Dimensions.get('window');

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={60} color="#6B8E23" />
                        <View style={styles.lockBadge}>
                            <MaterialCommunityIcons name="lock" size={20} color="#FFF" />
                        </View>
                    </View>

                    <Text style={styles.modalTitle}>Limit Reached!</Text>
                    <Text style={styles.modalText}>
                        You've enjoyed your 14 free books. To continue reading more amazing titles, please subscribe to our premium plan.
                    </Text>

                    <View style={styles.planCard}>
                        <View>
                            <Text style={styles.planTitle}>Premium Plan</Text>
                            <Text style={styles.planPrice}>NPR 500 / month</Text>
                        </View>
                        <MaterialCommunityIcons name="check-decagram" size={28} color="#6B8E23" />
                    </View>

                    <View style={styles.features}>
                        <FeatureItem text="Unlimited access to all books" />
                        <FeatureItem text="Ad-free reading experience" />
                        <FeatureItem text="Support independent authors" />
                    </View>

                    <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={onSubscribe}
                    >
                        <Text style={styles.subscribeButtonText}>Pay with Khalti</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.maybeLater}>
                        <Text style={styles.maybeLaterText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#6B8E23" />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay for focus
    },
    modalView: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    closeButton: {
        position: 'absolute',
        top: 25,
        right: 25,
        zIndex: 1,
        backgroundColor: '#F5F5F5',
        padding: 4,
        borderRadius: 20,
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: '#F0F9E8', // Light tinted background for icon
        padding: 20,
        borderRadius: 40,
        position: 'relative',
    },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#CD5C5C',
        borderRadius: 15,
        padding: 6,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    modalText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    planCard: {
        width: '100%',
        backgroundColor: '#FAFAFA',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1.5,
        borderColor: '#6B8E23', // Active brand border
    },
    planTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#333',
        marginTop: 4,
    },
    features: {
        width: '100%',
        marginBottom: 35,
        backgroundColor: '#F9F9F9',
        padding: 20,
        borderRadius: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 15,
        color: '#444',
        marginLeft: 12,
        fontWeight: '500',
    },
    subscribeButton: {
        backgroundColor: '#6B8E23',
        paddingVertical: 18,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#6B8E23',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    subscribeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    maybeLater: {
        padding: 10,
    },
    maybeLaterText: {
        color: '#A9A9A9',
        fontSize: 15,
        fontWeight: '600',
    },
});
