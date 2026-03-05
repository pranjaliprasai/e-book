import React from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

export default function Reader() {
    const { url, title } = useLocalSearchParams();
    const router = useRouter();
    const webViewRef = React.useRef<WebView>(null);

    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    const [rate, setRate] = React.useState(1.0);
    const [showControls, setShowControls] = React.useState(false);
    const [fullText, setFullText] = React.useState('');
    const [currentCharIndex, setCurrentCharIndex] = React.useState(0);

    // Get a stable URL string
    const urlString = Array.isArray(url) ? url[0] : url;

    // Reset state and stop speech when the URL changes
    React.useEffect(() => {
        if (urlString) {
            Speech.stop();
            setIsSpeaking(false);
            setIsPaused(false);
            setFullText('');
            setCurrentCharIndex(0);
        }
    }, [urlString]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const toggleSpeech = async () => {
        if (isSpeaking && !isPaused) {
            // Currently speaking, so pause
            await Speech.pause();
            setIsPaused(true);
        } else if (isSpeaking && isPaused) {
            // Currently paused, so resume
            await Speech.resume();
            setIsPaused(false);
        } else {
            // Not speaking yet, start fresh
            webViewRef.current?.injectJavaScript(`
                (function() {
                    const selection = window.getSelection().toString();
                    const text = selection || document.body.innerText || document.body.textContent;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'TEXT_EXTRACTED', 
                        text: text.substring(0, 100000),
                        isSelection: !!selection 
                    }));
                })();
            `);
        }
    };

    const stopSpeech = () => {
        Speech.stop();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentCharIndex(0);
        setFullText('');
    };

    const startSpeech = (textToRead: string, startFrom: number, speakRate: number) => {
        const remainingText = textToRead.substring(startFrom);
        if (!remainingText.trim()) {
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        setIsPaused(false);

        Speech.speak(remainingText, {
            rate: speakRate,
            onBoundary: (boundary: any) => {
                // Tracking total progress: startFrom + relative index in remainingText
                setCurrentCharIndex(startFrom + boundary.charIndex);
            },
            onDone: () => {
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentCharIndex(0);
                setFullText('');
            },
            onError: (err) => {
                console.error('Speech error:', err);
                setIsSpeaking(false);
                setIsPaused(false);
            }
        });
    };

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'TEXT_EXTRACTED' && data.text) {
                setFullText(data.text);
                setCurrentCharIndex(0);
                startSpeech(data.text, 0, rate);
            }
        } catch (err) {
            console.error('Failed to parse message:', err);
        }
    };

    const changeSpeed = () => {
        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const nextIndex = (speeds.indexOf(rate) + 1) % speeds.length;
        const nextRate = speeds[nextIndex];
        setRate(nextRate);

        if (isSpeaking) {
            // Restart with the same text starting from current position but with the new rate
            Speech.stop();
            // We give it a tiny timeout to ensure Speech.stop() finished processing
            setTimeout(() => {
                startSpeech(fullText, currentCharIndex, nextRate);
            }, 50);
        }
    };

    if (!url) {
        return (
            <View style={styles.center}>
                <Text>No document URL provided.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Android: WebView doesn't support direct PDF viewing. 
    // We use Google Docs Viewer as a proxy for remote PDFs.
    const finalUrl = urlString?.toLowerCase().endsWith('.pdf')
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(urlString)}&embedded=true`
        : urlString;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Reading'}</Text>
                <TouchableOpacity onPress={() => setShowControls(!showControls)} style={styles.iconButton}>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {showControls && (
                <View style={styles.controlsPanel}>
                    <TouchableOpacity onPress={toggleSpeech} style={styles.controlBtn}>
                        <MaterialCommunityIcons
                            name={isSpeaking && !isPaused ? "pause-circle" : "play-circle"}
                            size={32}
                            color="#6B8E23"
                        />
                        <Text style={styles.controlLabel}>{isSpeaking && !isPaused ? "Pause" : (isPaused ? "Resume" : "Read Aloud")}</Text>
                    </TouchableOpacity>

                    {isSpeaking && (
                        <TouchableOpacity onPress={stopSpeech} style={styles.controlBtn}>
                            <MaterialCommunityIcons name="stop-circle" size={32} color="#CD5C5C" />
                            <Text style={styles.controlLabel}>Stop</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={changeSpeed} style={styles.controlBtn}>
                        <View style={styles.speedBadge}>
                            <Text style={styles.speedText}>{rate}x</Text>
                        </View>
                        <Text style={styles.controlLabel}>Speed</Text>
                    </TouchableOpacity>
                </View>
            )}

            <WebView
                key={urlString}
                ref={webViewRef}
                source={{ uri: finalUrl }}
                style={styles.webview}
                onMessage={onMessage}
                startInLoadingState={true}
                renderLoading={() => (
                    <ActivityIndicator
                        color="#6B8E23"
                        size="large"
                        style={styles.loading}
                    />
                )}
                scalesPageToFit={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    iconButton: {
        padding: 5,
    },
    webview: {
        flex: 1,
    },
    controlsPanel: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    controlBtn: {
        alignItems: 'center',
    },
    controlLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    speedBadge: {
        backgroundColor: '#6B8E23',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 40,
        alignItems: 'center',
    },
    speedText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
    },
    backButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#6B8E23',
        borderRadius: 5,
    },
    backText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
