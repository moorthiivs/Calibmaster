import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function ReusableBarChart({
  title,
  data,
  bars = [], // Array of { dataKey, fill, name, stackId, radius, barSize }
  layout = "vertical",
  xAxisType = "number",
  yAxisType = "category",
  xAxisDataKey,
  yAxisDataKey = "name",
  yAxisWidth = 60,
  yAxisTick,
  containerClassName = "w-full h-[250px] sm:h-[300px]",
  wrapperClassName = "",
  margin = { top: 0, right: 0, left: 0, bottom: 0 },
  gridHorizontal = false,
  gridVertical = true,
  onBarClick,
}) {
  return (
    <div className={`flex flex-col w-full ${wrapperClassName}`}>
      {title && <h3 className="font-display font-semibold text-base mb-6">{title}</h3>}
      <div className={containerClassName}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={layout} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" horizontal={gridHorizontal} vertical={gridVertical} stroke="hsl(var(--border))" />
            <XAxis 
              type={xAxisType} 
              dataKey={xAxisDataKey}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            />
            <YAxis 
              dataKey={yAxisDataKey} 
              type={yAxisType} 
              axisLine={false} 
              tickLine={false} 
              tick={yAxisTick} 
              width={yAxisWidth} 
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--secondary))' }} 
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }} 
            />
            {bars.map((bar, index) => (
              <Bar 
                key={index}
                dataKey={bar.dataKey} 
                fill={bar.fill || "hsl(var(--primary))"} 
                radius={bar.radius || [0, 4, 4, 0]} 
                barSize={bar.barSize || 20} 
                stackId={bar.stackId}
                name={bar.name}
                onClick={onBarClick ? (entry) => onBarClick(entry, bar.dataKey) : undefined}
                style={onBarClick ? { cursor: "pointer" } : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
