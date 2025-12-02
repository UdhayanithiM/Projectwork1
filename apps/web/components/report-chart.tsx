// components/report-chart.tsx

"use client"

import { useTheme } from "next-themes";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { subject: 'Communication', A: 92, B: 70, fullMark: 100 },
  { subject: 'Problem Solving', A: 85, B: 65, fullMark: 100 },
  { subject: 'Adaptability', A: 70, B: 60, fullMark: 100 },
  { subject: 'Leadership', A: 65, B: 55, fullMark: 100 },
  { subject: 'Emotional Intel.', A: 78, B: 60, fullMark: 100 },
  { subject: 'Teamwork', A: 80, B: 65, fullMark: 100 },
];

export function ReportChart() {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#888' : '#333';
  const primaryColor = 'hsl(var(--primary))';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Your Profile" dataKey="A" stroke={primaryColor} fill={primaryColor} fillOpacity={0.6} />
        <Radar name="Average Candidate" dataKey="B" stroke="#8884d8" fill="#8884d8" fillOpacity={0.4} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

