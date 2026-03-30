import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { 
  startMilestone, 
  completeMilestone, 
  cancelMilestone,
} from "../components/services/milestoneServices";
import { useMilestone } from "../hooks/use-milestone";
import { useTheme } from "../hooks/use-theme";

export default function ReadingMilestones() {
  const router = useRouter();
  const { activeMilestone: activeGoal, elapsed: elapsedSeconds, refreshMilestone, setMilestone } = useMilestone();
  const { colors } = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshMilestone();
  }, []);


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
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reading Milestones</Text>
      </View>

      <View style={styles.content}>
        {activeGoal ? (
          <View style={[styles.activeGoalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.activeGoalHeader}>
              <MaterialCommunityIcons name="target" size={32} color={colors.primary} />
              <Text style={[styles.activeGoalTitle, { color: colors.text }]}>Active Session Goal</Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                  {formatTime(elapsedSeconds)} / {activeGoal.targetMinutes}m
                </Text>
                <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                  {Math.round(getProgressPercentage())}%
                </Text>
              </View>
              
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                <View 
                  style={[styles.progressBarFill, { width: `${getProgressPercentage()}%`, backgroundColor: colors.primary }]} 
                />
              </View>

              <Text style={[styles.remainingText, { color: colors.textMuted }]}>
                {Math.max(0, (activeGoal.targetMinutes * 60) - elapsedSeconds)}s remaining
              </Text>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelGoal}>
              <Text style={styles.cancelBtnText}>Cancel Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noGoalContainer}>
            <MaterialCommunityIcons name="flag-checkered" size={64} color={colors.border} />
            <Text style={[styles.noGoalTitle, { color: colors.text }]}>Ready to Read?</Text>
            <Text style={[styles.noGoalSubtitle, { color: colors.textMuted }]}>Set a time milestone for your current reading session.</Text>

            <View style={styles.quickOptionsContainer}>
              {[15, 30, 45, 60].map(mins => (
                <TouchableOpacity 
                  key={mins} 
                  style={[styles.quickOptionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleSetGoal(mins)}
                >
                  <Text style={[styles.quickOptionText, { color: colors.primary }]}>{mins} min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.customGoalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.customGoalBtnText}>Set Custom Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontFamily: "Inter-SemiBold" },
  content: { flex: 1, padding: 20 },
  
  // Active Goal Styles
  activeGoalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center"
  },
  activeGoalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  activeGoalTitle: { fontSize: 20, fontFamily: "Inter-SemiBold", marginLeft: 12, color: "#333" },
  progressSection: { width: "100%", marginBottom: 32 },
  progressInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressText: { fontSize: 16, fontFamily: "Inter-Medium", color: "#666" },
  progressPercentage: { fontSize: 16, fontFamily: "Inter-Bold", color: "#4F7942" },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#E8F0EA",
    borderRadius: 6,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4F7942",
    borderRadius: 6,
  },
  remainingText: { marginTop: 8, fontSize: 14, color: "#999", textAlign: "center" },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  cancelBtnText: { color: "#ff4444", fontFamily: "Inter-SemiBold", fontSize: 16 },

  // No Goal Styles
  noGoalContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  noGoalTitle: { fontSize: 24, fontFamily: "Inter-Bold", color: "#333", marginTop: 16, marginBottom: 8 },
  noGoalSubtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  quickOptionsContainer: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 32 },
  quickOptionBtn: {
    backgroundColor: "#E8F0EA",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  quickOptionText: { color: "#4F7942", fontFamily: "Inter-SemiBold", fontSize: 16 },
  customGoalBtn: {
    backgroundColor: "#4F7942",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center"
  },
  customGoalBtnText: { color: "#fff", fontFamily: "Inter-Bold", fontSize: 16 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#fff",
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
  modalTitle: { fontSize: 20, fontFamily: "Inter-SemiBold", color: "#333" },
  modalLabel: { fontSize: 14, color: "#666", marginBottom: 8, fontFamily: "Inter-Medium" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
    fontFamily: "Inter-Regular"
  },
  modalStartBtn: {
    backgroundColor: "#4F7942",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  modalStartBtnText: { color: "#fff", fontFamily: "Inter-Bold", fontSize: 16 }
});
