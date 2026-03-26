function SummaryCards({ cards }) {
  return (
    <section className="cardGrid">
      {cards.map((card) => (
        <article className="panel metricCard" key={card.value}>
          <span className="metricCard__label">{card.label}</span>
          <strong style={{ color: card.accent }}>{card.count}</strong>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;
