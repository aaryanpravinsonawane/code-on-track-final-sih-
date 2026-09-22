import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyticsService, type Analytics } from "@/services/api";
import { ChartBox } from "./ChartBox";
import { Panel } from "./shared";

export function AIAnalyticsCharts() {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => { void analyticsService.get().then(setData).catch(() => setData(null)); }, []);
  if (!data) return null;
  return <div className="grid gap-4 xl:grid-cols-2">
    <Panel title="DELAY PREDICTION TREND"><ChartBox height={230}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.delay_prediction_trends}><CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="risk" fill="var(--primary)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartBox></Panel>
    <Panel title="PLATFORM UTILIZATION"><ChartBox height={230}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.platform_utilization}><CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" /><XAxis dataKey="platform" /><YAxis /><Tooltip /><Bar dataKey="utilization" fill="var(--info)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartBox></Panel>
    <Panel title="TRACK UTILIZATION"><ChartBox height={230}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.track_utilization}><CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" /><XAxis dataKey="track" /><YAxis /><Tooltip /><Bar dataKey="utilization" fill="var(--success)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartBox></Panel>
    <Panel title="CONFLICT STATISTICS"><ChartBox height={230}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.conflict_statistics}><CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" /><XAxis dataKey="type" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="var(--danger)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartBox></Panel>
  </div>;
}
