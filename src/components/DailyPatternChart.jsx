import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatDay } from "../utils/date";
import PanelHeader from "./PanelHeader";

const tooltipStyles = {
  background: "#151922",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px"
};

function DailyPatternChart({ timeline, optionLookup }) {
  return (
    <article className="panel chartPanel">
      <PanelHeader
        title="Daily Pattern"
        description="Each day shows the chosen category as a weighted activity."
      />
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={timeline}>
            <defs>
              <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              stroke="rgba(255,255,255,0.45)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              ticks={[0, 1, 2, 3]}
              tickFormatter={(value) => ["", "Home", "Out", "Takeaway"][value] || ""}
              stroke="rgba(255,255,255,0.45)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyles}
              formatter={(value, _name, item) => [
                optionLookup[item.payload.category]?.label ?? "No entry",
                "Habit"
              ]}
              labelFormatter={formatDay}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#9b87f5"
              strokeWidth={3}
              fill="url(#timelineFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default DailyPatternChart;
