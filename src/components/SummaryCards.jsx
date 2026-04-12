import { formatCurrency } from "../utils/format";

function SummaryCards({ cards }) {
  return (
    <section className="cardGrid">
      {cards.map((card) => (
        <article className="panel metricCard" key={card.value}>
          <span className="metricCard__label">{card.label}</span>
          <strong style={{ color: card.accent }}>{card.count}</strong>
          <span className="metricCard__subtext">
            {card.averageAmountPence === null
              ? "No spend logged"
              : `Avg spend ${formatCurrency(card.averageAmountPence)}`}
          </span>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;
