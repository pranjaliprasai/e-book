import apiClient from './apiClient';

export interface Milestone {
  _id: string;
  user: string;
  targetMinutes: number;
  startTime: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export const startMilestone = async (targetMinutes: number) => {
  try {
    const response = await apiClient.post('/milestones', { targetMinutes });
    return response.data;
  } catch (error) {
    console.error('Error starting milestone:', error);
    throw error;
  }
};

export const getActiveMilestone = async () => {
  try {
    const response = await apiClient.get('/milestones/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active milestone:', error);
    throw error;
  }
};

export const completeMilestone = async (milestoneId: string) => {
  try {
    const response = await apiClient.put(`/milestones/complete/${milestoneId}`);
    return response.data;
  } catch (error) {
    console.error('Error completing milestone:', error);
    throw error;
  }
};

export const cancelMilestone = async (milestoneId?: string) => {
  try {
    const path = milestoneId ? `/milestones/cancel/${milestoneId}` : '/milestones/cancel';
    const response = await apiClient.delete(path);
    return response.data;
  } catch (error) {
    console.error('Error cancelling milestone:', error);
    throw error;
  }
};
