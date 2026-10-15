// src/api/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { MatchRecord, RankingEntry, PaginatedResponse, MatchConfig } from './types';
import { savePendingMatch, removePendingMatch, flushPendingMatches } from './pendingQueue';

export function useRanking(config: MatchConfig, page = 1) {
  return useQuery({
    queryKey: ['ranking', config.sessionDuration, config.spawnInterval, page],
    queryFn: async () => {
      void flushPendingMatches(); // Executa em segundo plano sem segurar a tela
      const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/api/ranking', {
        params: {
          page,
          limit: 5,
          sessionDuration: config.sessionDuration,
          spawnInterval: config.spawnInterval,
        },
      });
      return response.data;
    },
    staleTime: 2000,
  });
}

export function useMatchHistory(page = 1) {
  return useQuery({
    queryKey: ['matches', page],
    queryFn: async () => {
      void flushPendingMatches(); // Executa em segundo plano sem segurar a tela
      const response = await apiClient.get<PaginatedResponse<MatchRecord>>('/api/matches', {
        params: { page, limit: 5 },
      });
      return response.data;
    },
    staleTime: 2000,
  });
}

export function useRecordMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: MatchRecord) => {
      savePendingMatch(record);
      const response = await apiClient.post<MatchRecord>('/api/matches', record);
      removePendingMatch(record.id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    retry: 2,
  });
}