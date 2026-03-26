import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import PanelHeader from "./PanelHeader";

const tooltipStyles = {
  background: "#151922",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px"
};

function HabitSplitChart({ summaryCards }) {
  return (
    <article className="panel chartPanel">
      <PanelHeader
        title="Habit Split"
        description="Share of logged days within the selected timeframe."
      />
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={summaryCards}
              dataKey="count"
              nameKey="label"
              innerRadius={78}
              outerRadius={110}
              paddingAngle={4}
            >
              {summaryCards.map((entry) => (
                <Cell key={entry.value} fill={entry.accent} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyles}
              labelStyle={{ color: "#f5f7fb" }}
              itemStyle={{ color: "#f5f7fb" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default HabitSplitChart;
