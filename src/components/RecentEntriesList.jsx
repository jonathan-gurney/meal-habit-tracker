import { formatDay } from "../utils/date";
import PanelHeader from "./PanelHeader";

function RecentEntriesList({ entries, optionLookup }) {
  return (
    <section className="panel">
      <PanelHeader
        title="Recent Entries"
        description="Your latest logged days, shown most recent first."
      />
      <div className="entryList">
        {entries.map((entry) => (
          <div className="entryRow" key={entry.date}>
            <span>{formatDay(entry.date)}</span>
            <strong style={{ color: optionLookup[entry.category]?.accent ?? "#fff" }}>
              {optionLookup[entry.category]?.label ?? entry.category}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecentEntriesList;
