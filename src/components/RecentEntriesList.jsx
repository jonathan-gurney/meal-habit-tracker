import { formatDay } from "../utils/date";
import { formatCurrency } from "../utils/format";
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
            <div>
              <span>{formatDay(entry.date)}</span>
              {entry.amountPence !== null ? (
                <span className="entryRow__meta">{formatCurrency(entry.amountPence)}</span>
              ) : null}
            </div>
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
