import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  HRMetrics, 
  DepartmentMetrics, 
  HRAlert, 
  HRAlertRule, 
  HRMetricSnapshot 
} from '../types/hr-dashboard';

const API_BASE = '/api/hr/dashboard';

// Хуки для получения данных
export const useHRDashboardOverview = () => {
  return useQuery<HRMetrics>(['hr-dashboard', 'overview'], 
    async () => {
      const { data } = await axios.get(`${API_BASE}/overview/`);
      return data;
    }
  );
};

export const useDepartmentMetrics = () => {
  return useQuery<DepartmentMetrics[]>(['hr-dashboard', 'departments'],
    async () => {
      const { data } = await axios.get(`${API_BASE}/departments/`);
      return data;
    }
  );
};

export const useAlerts = (filters?: Record<string, any>) => {
  return useQuery<HRAlert[]>(['hr-dashboard', 'alerts', filters],
    async () => {
      const { data } = await axios.get(`${API_BASE}/alerts/`, { params: filters });
      return data;
    }
  );
};

export const useAlertRules = (filters?: Record<string, any>) => {
  return useQuery<HRAlertRule[]>(['hr-dashboard', 'alert-rules', filters],
    async () => {
      const { data } = await axios.get(`${API_BASE}/alert-rules/`, { params: filters });
      return data;
    }
  );
};

export const useMetricHistory = (
  metricKey: string,
  departmentId?: number,
  days: number = 30
) => {
  return useQuery<HRMetricSnapshot[]>(
    ['hr-dashboard', 'metrics', metricKey, departmentId, days],
    async () => {
      const { data } = await axios.get(`${API_BASE}/metrics/`, {
        params: {
          metric_key: metricKey,
          department: departmentId,
          days
        }
      });
      return data;
    }
  );
};

// Мутации для изменения данных
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<HRAlert, Error, { id: number; notes: string }>(
    async ({ id, notes }) => {
      const { data } = await axios.post(
        `${API_BASE}/alerts/${id}/resolve/`,
        { notes }
      );
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hr-dashboard', 'alerts']);
        queryClient.invalidateQueries(['hr-dashboard', 'overview']);
      }
    }
  );
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation<HRAlertRule, Error, Partial<HRAlertRule>>(
    async (newRule) => {
      const { data } = await axios.post(`${API_BASE}/alert-rules/`, newRule);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hr-dashboard', 'alert-rules']);
      }
    }
  );
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation<HRAlertRule, Error, { id: number; data: Partial<HRAlertRule> }>(
    async ({ id, data }) => {
      const response = await axios.patch(`${API_BASE}/alert-rules/${id}/`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hr-dashboard', 'alert-rules']);
      }
    }
  );
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>(
    async (id) => {
      await axios.delete(`${API_BASE}/alert-rules/${id}/`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hr-dashboard', 'alert-rules']);
      }
    }
  );
