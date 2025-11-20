// app/(admin)/admin/page.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HelpCircle, FileText, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "./hooks/useAdminStats"; // Import our new custom hook

// This is a presentational component. It receives data as props.
function StatCard({ title, value, icon: Icon, loading }: { title: string, value: number | undefined, icon: React.ElementType, loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );
}

// The main page component is now much simpler.
export default function AdminDashboardPage() {
  // All the complex logic is now handled by this single line!
  const { stats, loading, error } = useAdminStats();

  if (error) {
    return <div className="text-red-500 font-semibold p-4 border border-red-200 bg-red-50 rounded-md">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} loading={loading} />
        <StatCard title="Question Bank" value={stats?.totalQuestions} icon={HelpCircle} loading={loading} />
        <StatCard title="Assessments" value={stats?.totalAssessments} icon={FileText} loading={loading} />
        <StatCard title="Submissions" value={stats?.totalSubmissions} icon={CheckSquare} loading={loading} />
      </div>
      {/* We can add more dashboard components here later */}
    </div>
  );
}