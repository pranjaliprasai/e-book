import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMilestone } from '../../hooks/use-milestone';
import { useTheme } from '../../hooks/use-theme';

export default function MilestoneStatusBar() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeMilestone, elapsed, refreshMilestone } = useMilestone();
  const { colors } = useTheme();
  
  useEffect(() => {
    if (user) {
      refreshMilestone();
    }
  }, [refreshMilestone, user]);

  if (!user || !activeMilestone) return null;

  const targetSeconds = activeMilestone.targetMinutes * 60;
  const progress = Math.min(elapsed / targetSeconds, 1);
  const remainingSeconds = Math.max(targetSeconds - elapsed, 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface, 
          paddingTop: Math.max(insets.top, 5) + 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }
      ]}
      onPress={() => router.push('/ReadingMilestones')}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name="timer-outline" size={18} color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>
          Session Milestone: <Text style={{ color: colors.primary, fontWeight: '900' }}>{formatTime(remainingSeconds)}</Text> left
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      </View>
      <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  }
});
