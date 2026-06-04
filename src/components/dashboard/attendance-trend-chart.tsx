"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ATTENDANCE_STATUS_META } from "@/lib/constants";

export interface TrendDatum {
  date: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
}

export function AttendanceTrendChart({ data }: { data: TrendDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        No attendance recorded yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="present"
            stackId="a"
            fill={ATTENDANCE_STATUS_META.PRESENT.color}
            name="Present"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="late"
            stackId="a"
            fill={ATTENDANCE_STATUS_META.LATE.color}
            name="Late"
          />
          <Bar
            dataKey="excused"
            stackId="a"
            fill={ATTENDANCE_STATUS_META.EXCUSED.color}
            name="Excused"
          />
          <Bar
            dataKey="absent"
            stackId="a"
            fill={ATTENDANCE_STATUS_META.ABSENT.color}
            name="Absent"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
