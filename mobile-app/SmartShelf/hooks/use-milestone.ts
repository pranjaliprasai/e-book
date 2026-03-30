import { useState, useEffect, useCallback } from 'react';
import { getActiveMilestone, Milestone, completeMilestone } from '../components/services/milestoneServices';

let globalActiveMilestone: Milestone | null = null;
let listeners: Array<(m: Milestone | null) => void> = [];

const notifyListeners = () => {
  listeners.forEach(l => l(globalActiveMilestone));
};

export const setGlobalMilestone = (m: Milestone | null) => {
  globalActiveMilestone = m;
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

      const target = activeMilestone.targetMinutes * 60;
      if (diff >= target) {
        // Auto-complete if finished
        completeMilestone(activeMilestone._id).then(() => {
          setGlobalMilestone(null);
        }).catch(console.error);
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
