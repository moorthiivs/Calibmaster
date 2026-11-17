import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function ReusablePieChart({
  data,
  dataKey = "value",
  title,
  totalValue,
  totalLabel = "Total",
  containerClassName = "w-full h-[250px] sm:h-[300px]",
  wrapperClassName = "",
  innerRadius = "60%",
  outerRadius = "90%",
  paddingAngle = 5,
  stroke = "none",
  strokeWidth = 1,
  cornerRadius = 4,
  tooltipFormatter,
  valueSize = "text-2xl",
  labelSize = "text-xs",
  onSliceClick,
}) {
  return (
    <div className={`flex flex-col w-full ${wrapperClassName}`}>
      {title && <h3 className="font-display font-semibold text-base mb-6">{title}</h3>}
      <div className={`relative flex items-center justify-center ${containerClassName}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={cornerRadius}
              style={onSliceClick ? { cursor: "pointer" } : undefined}
            >
              {data && data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || "hsl(var(--primary))"}
                  onClick={() => onSliceClick && onSliceClick(entry, index)}
                  style={onSliceClick ? { cursor: "pointer" } : undefined}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
              formatter={tooltipFormatter}
            />
          </PieChart>
        </ResponsiveContainer>
        {totalValue !== undefined && totalValue !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`${valueSize} font-bold`}>{totalValue}</span>
            <span className={`${labelSize} text-muted-foreground`}>{totalLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
