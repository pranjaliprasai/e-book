import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { 
  startMilestone, 
  completeMilestone, 
  cancelMilestone,
} from "../components/services/milestoneServices";
import { getProfile } from "../components/services/authServices";
import { useAuth } from "../hooks/use-auth";
import { useMilestone } from "../hooks/use-milestone";
import { useTheme } from "../hooks/use-theme";

const { width } = Dimensions.get('window');

export default function ReadingMilestones() {
  const router = useRouter();
  const { activeMilestone: activeGoal, elapsed: elapsedSeconds, refreshMilestone, setMilestone } = useMilestone();
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    refreshMilestone();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setUserProfile(res.user);
        updateUser(res.user);
      }
    } catch (e) {
      console.log("Error loading profile in milestones:", e);
    }
  };


  const handleSetGoal = async (minutes: number) => {
    try {
      setLoading(true);
      const res = await startMilestone(minutes);
      if (res.data) {
        setMilestone(res.data);
        setModalVisible(false);
        Alert.alert("Goal Set", `Your ${minutes} minute reading goal has started!`);
      }
    } catch (e) {
      Alert.alert("Error", "Could not start milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGoal = async () => {
    if (!activeGoal) return;
    Alert.alert("Cancel Goal", "Are you sure you want to cancel your current goal?", [
      { text: "No", style: "cancel" },
      { 
        text: "Yes", 
        style: "destructive", 
        onPress: async () => {
          try {
            await cancelMilestone(activeGoal._id);
            setMilestone(null);
          } catch (e) {
            Alert.alert("Error", "Could not cancel milestone");
          }
        } 
      }
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getProgressPercentage = () => {
    if (!activeGoal) return 0;
    const targetSeconds = activeGoal.targetMinutes * 60;
    const percentage = (elapsedSeconds / targetSeconds) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2E4D2E" />
      </View>
    );
  }

  const renderReadingStats = () => {
    if (!userProfile) return null;

    const stats = userProfile.readingStats || { totalPagesRead: 0, totalReadingTime: 0, achievedMilestones: [], booksReadThisMonth: 0, readingTimeThisMonth: 0, pagesReadToday: 0, highestReadingSessionMonth: 0, highestReadingSessionEver: 0, totalMilestonesSet: 0, completedBooksCount: 0 };
    const readBooksThisMonth = stats.booksReadThisMonth || 0;
    const milestoneCount = stats.achievedMilestones?.length || 0;
    const pagesToday = stats.pagesReadToday || 0;

    const monthlyTime = stats.readingTimeThisMonth || 0;
    const hours = Math.floor(monthlyTime / 3600);
    const minutes = Math.floor((monthlyTime % 3600) / 60);

    const totalLifetimeTime = stats.totalReadingTime || 0;
    const totalHours = Math.floor(totalLifetimeTime / 3600);
    const totalMinutes = Math.floor((totalLifetimeTime % 3600) / 60);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={[styles.statsTitle, { color: colors.textMuted }]}>YOUR STATISTICS</Text>
        </View>

        <View style={[styles.statsCardCol, { backgroundColor: colors.surface, width: '100%', marginBottom: 16 }]}>
            <View style={[styles.statsCardInner, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>TOTAL READING THIS MONTH</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                  <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{hours}</Text>
                  <Text style={[styles.statsValueUnit, { color: colors.textMuted, marginRight: 12 }]}>h</Text>
                  <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{minutes}</Text>
                  <Text style={[styles.statsValueUnit, { color: colors.textMuted }]}>m</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="calendar-clock" size={40} color={colors.primary} opacity={0.2} />
            </View>
        </View>

        <View style={[styles.statsCardCol, { backgroundColor: colors.surface, width: '100%', marginBottom: 16 }]}>
            <View style={[styles.statsCardInner, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>LIFETIME TOTAL READING</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                  <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{totalHours}</Text>
                  <Text style={[styles.statsValueUnit, { color: colors.textMuted, marginRight: 12 }]}>h</Text>
                  <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{totalMinutes}</Text>
                  <Text style={[styles.statsValueUnit, { color: colors.textMuted }]}>m</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="infinity" size={40} color={colors.primary} opacity={0.2} />
            </View>
        </View>
 
        <View style={styles.statsGrid}>
          <View style={[styles.statsCardCol, { backgroundColor: colors.surface }]}>
            <View style={styles.statsCardInner}>
              <View style={styles.statsSubHeader}>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>BOOKS COMPLETED</Text>
                <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{stats.completedBooksCount || 0}</Text>
            </View>
          </View>
 
          <View style={[styles.statsCardCol, { backgroundColor: colors.surface }]}>
            <View style={styles.statsCardInner}>
              <View style={styles.statsSubHeader}>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>BOOKS IN PROGRESS</Text>
                <MaterialCommunityIcons name="book-sync" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{stats.booksInProgressCount || 0}</Text>
            </View>
          </View>
        </View>
 
        <View style={[styles.statsGrid, { marginTop: 16 }]}>
          <View style={[styles.statsCardCol, { backgroundColor: colors.surface }]}>
            <View style={styles.statsCardInner}>
              <View style={styles.statsSubHeader}>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>PAGES READ TODAY</Text>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{pagesToday}</Text>
            </View>
          </View>
 
          <View style={[styles.statsCardCol, { backgroundColor: colors.surface }]}>
            <View style={styles.statsCardInner}>
              <View style={styles.statsSubHeader}>
                <Text style={[styles.statsLabelSmall, { color: colors.textMuted }]}>TOTAL MILESTONES</Text>
                <MaterialCommunityIcons name="target" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.statsValueLarge, { color: colors.primary }]}>{stats.totalMilestonesSet || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: 'transparent', backgroundColor: 'transparent' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reading Milestones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeGoal ? (
          <View style={styles.mainSection}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>CURRENT GOAL</Text>
            <View style={[styles.activeGoalCard, { backgroundColor: colors.surface }]}>
               <View style={styles.activeGoalContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTargetTitle, { color: colors.text }]}>Read for {activeGoal.targetMinutes} minutes</Text>
                    <Text style={[styles.goalProgressSubtitle, { color: colors.textMuted }]}>
                      {Math.floor(elapsedSeconds / 60)} of {activeGoal.targetMinutes} completed ({Math.round(getProgressPercentage())}%)
                    </Text>
                    
                    <View style={[styles.linearProgressContainer, { backgroundColor: colors.border }]}>
                      <View style={[styles.linearProgressBar, { width: `${getProgressPercentage()}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>

                  <View style={styles.circularPlaceholder}>
                    <View style={[styles.circularRing, { borderColor: colors.border }]}>
                       <View 
                         style={[
                           styles.circularActive, 
                           { 
                             borderColor: colors.primary, 
                             transform: [{ rotate: `${getProgressPercentage() * 3.6}deg` }] 
                           }
                         ]} 
                       />
                       <Text style={[styles.circularText, { color: colors.text }]}>{Math.round(getProgressPercentage())}%</Text>
                    </View>
                  </View>
               </View>

               <TouchableOpacity style={styles.cancelSessionBtn} onPress={handleCancelGoal}>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color="#ff4444" />
                  <Text style={styles.cancelSessionText}>End Session</Text>
               </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.mainSection}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>START READING</Text>
            <View style={[styles.noGoalCard, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="bookmark-check" size={48} color={colors.border} />
                <Text style={[styles.noGoalTitle, { color: colors.text }]}>Pick a Session Goal</Text>
                <View style={styles.quickOptionsWrapper}>
                  {[15, 30, 45, 60].map(mins => (
                    <TouchableOpacity 
                      key={mins} 
                      style={[styles.quickOptBtn, { backgroundColor: colors.border }]}
                      onPress={() => handleSetGoal(mins)}
                    >
                      <Text style={[styles.quickOptText, { color: colors.primary }]}>{mins}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity 
                  style={[styles.customSessionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.customSessionBtnText}>Set Custom Goal</Text>
                </TouchableOpacity>
            </View>
          </View>
        )}

        {renderReadingStats()}
      </ScrollView>

      {/* Custom Goal Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Goal</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
 
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Target Time (minutes)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={customMinutes}
                onChangeText={setCustomMinutes}
                keyboardType="numeric"
                placeholder="e.g. 45"
                placeholderTextColor={colors.textMuted}
                autoFocus={true}
              />

              <TouchableOpacity 
                style={[styles.modalStartBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  const mins = parseInt(customMinutes);
                  if (mins > 0) {
                    handleSetGoal(mins);
                  } else {
                    Alert.alert("Invalid Input", "Please enter a valid number of minutes.");
                  }
                }}
              >
                <Text style={styles.modalStartBtnText}>Start Reading</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "900" },
  content: { flex: 1, padding: 20 },
  
  // New Styled Dashboard
  mainSection: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  activeGoalCard: {
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  activeGoalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalTargetTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  goalProgressSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  linearProgressContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4F1E9',
    width: '90%',
    overflow: 'hidden',
  },
  linearProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  circularPlaceholder: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularActive: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  circularText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2E4D2E',
  },
  cancelSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F1E9',
    paddingTop: 16,
  },
  cancelSessionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#ff4444',
  },

  // No goal card
  noGoalCard: {
    borderRadius: 30,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  noGoalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 20,
  },
  quickOptionsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  quickOptBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  quickOptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E4D2E',
  },
  customSessionBtn: {
    paddingVertical: 14,
    backgroundColor: '#2E4D2E',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  customSessionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },

  // Lifetime Stats redesign
  statsContainer: {
    marginBottom: 40,
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCardCol: {
    width: (width - 56) / 2,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsCardInner: {
    padding: 20,
  },
  statsSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsLabelSmall: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsValueLarge: {
    fontSize: 32,
    fontWeight: '900',
  },
  statsValueUnit: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  modalTitle: { fontSize: 20, fontWeight: "900" },
  modalLabel: { fontSize: 14, marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
  },
  modalStartBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center"
  },
  modalStartBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
