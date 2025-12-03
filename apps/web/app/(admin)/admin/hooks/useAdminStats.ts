"use client";

import { useState, useEffect } from 'react';

// Define the structure of the stats object for TypeScript
export interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalAssessments: number;
  totalSubmissions: number;
}

// Custom Hook for fetching Admin Dashboard Metrics
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/stats", { 
          signal,
          cache: "no-store" // Ensure we fetch fresh data
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: Failed to fetch stats`);
        }
        
        const data: AdminStats = await response.json();
        setStats(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Admin Stats Fetch Error:", err);
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => controller.abort();
  }, []);

  return { stats, loading, error };
}