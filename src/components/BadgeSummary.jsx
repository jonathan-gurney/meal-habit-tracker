function BadgeSummary({ rewards, onOpen }) {
  const nextBadge = rewards?.nextBadge ?? null;

  return (
    <section className="panel badgePanel">
      <div className="badgePanel__header">
        <div>
          <span className="eyebrow">Rewards</span>
          <h2>Home streak badges</h2>
          <p>
            Earn badges by stacking consecutive days of eating at home and keep an eye on
            your next milestone.
          </p>
        </div>
        <button className="secondaryButton" type="button" onClick={onOpen}>
          View all badges
        </button>
      </div>

      <div className="badgeSummaryGrid">
        <article className="badgeSpotlight">
          <span className="badgeSpotlight__label">Unlocked</span>
          <strong>
            {rewards?.unlockedCount ?? 0}/{rewards?.totalBadges ?? 0}
          </strong>
          <span>{rewards?.currentStreak ?? 0} day current at-home streak</span>
        </article>

        <article className="badgeSpotlight">
          <span className="badgeSpotlight__label">Next badge</span>
          <strong>{nextBadge?.name ?? "Every badge unlocked"}</strong>
          <span>
            {nextBadge
              ? `${nextBadge.remaining} more day${nextBadge.remaining === 1 ? "" : "s"} to go`
              : "You have earned the full set."}
          </span>
        </article>
      </div>

      <div className="badgePreviewRow">
        {(rewards?.badges ?? []).slice(0, 3).map((badge) => (
          <article
            className={`badgeCard badgeCard--compact ${badge.unlocked ? "badgeCard--unlocked" : ""}`}
            key={badge.id}
          >
            <span className="badgeCard__streak">{badge.streak} days</span>
            <strong>{badge.name}</strong>
            <span>{badge.unlocked ? "Unlocked" : `${badge.progress}/${badge.streak}`}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default BadgeSummary;
