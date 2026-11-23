"use client";

import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ResponseChart({ data }: { data: Array<{ day: string; responses: number }> }) {
  return (
    <div className="chart-area" role="img" aria-label="Gráfico de respostas recebidas nos últimos sete dias">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="responses-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2ff2e" stopOpacity={0.19} />
              <stop offset="100%" stopColor="#e2ff2e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#818693", fontSize: 11 }}
            dataKey="day"
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#818693", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#151820",
              border: "1px solid #3a3e48",
              borderRadius: 0,
              fontSize: 12,
            }}
            labelStyle={{ color: "#b1b5be", marginBottom: 4 }}
            itemStyle={{ color: "#e2ff2e", fontWeight: 600 }}
          />
          <Area
            type="linear"
            dataKey="responses"
            name="Respostas"
            stroke="#e2ff2e"
            fill="url(#responses-fill)"
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ fill: "#e2ff2e", strokeWidth: 0, r: 2 }}
            activeDot={{ fill: "#e2ff2e", stroke: "#0b0d12", strokeWidth: 2, r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
