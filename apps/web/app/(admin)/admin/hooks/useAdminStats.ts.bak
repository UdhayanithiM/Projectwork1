// app/(admin)/admin/hooks/useAdminStats.ts

"use client";

import { useState, useEffect } from 'react';

// Define the structure of the stats object for TypeScript
export interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalAssessments: number;
  totalSubmissions: number;
}

// This is our custom hook
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // The browser automatically sends the secure cookie
        const response = await fetch("/api/admin/stats");

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access Forbidden. You might not be an admin.");
          }
          throw new Error("Failed to fetch admin statistics");
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // The empty dependency array means this runs once when the component mounts

  // The hook returns the stateful values for the component to use
  return { stats, loading, error };
}