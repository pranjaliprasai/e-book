import { useState, useEffect, useCallback } from 'react';
import { getActiveMilestone, Milestone, completeMilestone } from '../components/services/milestoneServices';
import { createNotification } from '../components/services/notificationServices';

let globalActiveMilestone: Milestone | null = null;
let listeners: Array<(m: Milestone | null) => void> = [];

let isCompleting = false;
let warningSent = false;

const notifyListeners = () => {
  listeners.forEach(l => l(globalActiveMilestone));
};

export const setGlobalMilestone = (m: Milestone | null) => {
  globalActiveMilestone = m;
  isCompleting = false;
  warningSent = false; // Reset for new session
  notifyListeners();
};

export function useMilestone() {
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(globalActiveMilestone);

  useEffect(() => {
    const listener = (m: Milestone | null) => setActiveMilestone(m);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const refreshMilestone = useCallback(async () => {
    try {
      const res = await getActiveMilestone();
      setGlobalMilestone(res?.data || null);
    } catch (e) {
      console.error('Error refreshing milestone:', e);
    }
  }, []);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeMilestone) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(activeMilestone.startTime).getTime();
      const diff = Math.floor((now - start) / 1000);
      setElapsed(diff);

      const targetSeconds = activeMilestone.targetMinutes * 60;
      
      // 1 minute warning
      if (targetSeconds > 60 && (targetSeconds - diff) <= 60 && !warningSent && !isCompleting) {
        warningSent = true;
        createNotification(
          "⏳ Almost there!", 
          "You have 1 minute left to reach your reading goal. Keep going!",
          "milestone_warning"
        ).catch(console.error);
      }

      if (diff >= targetSeconds && !isCompleting) {
        // Auto-complete if finished
        isCompleting = true;
        completeMilestone(activeMilestone._id).then(() => {
          setGlobalMilestone(null);
        }).catch((err) => {
          console.error(err);
          isCompleting = false; // Reset if it failed
        });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMilestone]);

  return {
    activeMilestone,
    elapsed,
    refreshMilestone,
    setMilestone: setGlobalMilestone
  };
}
