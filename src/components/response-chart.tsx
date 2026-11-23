"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ResponseChart({ data }: { data: Array<{ day: string; responses: number }> }) {
  return (
    <div className="chart-area" role="img" aria-label="Gráfico de respostas recebidas nos últimos sete dias">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#e4efec" strokeDasharray="4 5" vertical={false} />
          <XAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#607876", fontSize: 11 }}
            dataKey="day"
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#607876", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #dce8e4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(24, 59, 56, 0.08)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#54706d", marginBottom: 4 }}
            itemStyle={{ color: "#0f766e", fontWeight: 700 }}
          />
          <Line
            type="monotone"
            dataKey="responses"
            name="Respostas"
            stroke="#0f766e"
            strokeWidth={3}
            dot={{ fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2, r: 4 }}
            activeDot={{ fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
