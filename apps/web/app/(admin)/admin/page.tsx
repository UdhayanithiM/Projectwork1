"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Code, FileText, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "./hooks/useAdminStats";
import { GlassPanel } from "@/components/ui/glass-panel";

// Presentational Component
function StatCard({ title, value, icon: Icon, loading }: { title: string, value: number | undefined, icon: React.ElementType, loading: boolean }) {
  return (
    <GlassPanel className="p-6 bg-black/40 border-white/10 hover:bg-white/5 transition-colors">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-24 bg-white/10" />
        ) : (
          <div className="text-3xl font-bold font-heading text-white">{value}</div>
        )}
      </div>
    </GlassPanel>
  );
}

export default function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats();

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time platform metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers} 
          icon={Users} 
          loading={loading} 
        />
        <StatCard 
          title="Question Bank" 
          value={stats?.totalQuestions} 
          icon={Code} 
          loading={loading} 
        />
        <StatCard 
          title="Active Missions" 
          value={stats?.totalAssessments} 
          icon={FileText} 
          loading={loading} 
        />
        <StatCard 
          title="Completed" 
          value={stats?.totalSubmissions} 
          icon={CheckCircle2} 
          loading={loading} 
        />
      </div>
    </div>
  );
}