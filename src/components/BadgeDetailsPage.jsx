import { formatDay } from "../utils/date";

function BadgeDetailsPage({ rewards, onBack }) {
  return (
    <main className="shell">
      <section className="pageHeader">
        <button className="backLink" type="button" onClick={onBack}>
          Back to dashboard
        </button>
        <span className="eyebrow">Rewards</span>
        <h1>Home streak badges</h1>
        <p>
          Some badges track pure at-home streaks, while others track a qualifying logged run
          with limits on takeaway or eat-out days. Unlocked badges stay with you once earned.
        </p>
      </section>

      <section className="badgeMetrics">
        <article className="stat">
          <span>Current at-home streak</span>
          <strong>{rewards?.currentStreak ?? 0} days</strong>
        </article>
        <article className="stat">
          <span>Longest at-home streak</span>
          <strong>{rewards?.longestStreak ?? 0} days</strong>
        </article>
        <article className="stat">
          <span>Total at-home days</span>
          <strong>{rewards?.totalHomeDays ?? 0}</strong>
        </article>
      </section>

      <section className="badgeList">
        {(rewards?.badges ?? []).map((badge) => {
          const progressPercent = Math.round((badge.progress / badge.streak) * 100);

          return (
            <article
              className={`panel badgeCard ${badge.unlocked ? "badgeCard--unlocked" : ""}`}
              key={badge.id}
            >
              <div className="badgeCard__top">
                <div>
                  <span className="badgeCard__streak">{badge.streak} day badge</span>
                  <h2>{badge.name}</h2>
                </div>
                <span className="badgeCard__state">
                  {badge.unlocked ? "Unlocked" : `${badge.remaining} days left`}
                </span>
              </div>

              <p>{badge.description}</p>

              <span className="badgeCard__meta">
                Awarded {badge.rewardCount} time{badge.rewardCount === 1 ? "" : "s"}
              </span>

              <div className="badgeProgress">
                <div className="badgeProgress__track">
                  <div
                    className="badgeProgress__fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span>
                  {badge.unlocked
                    ? `Earned ${formatDay(badge.earnedOn)}`
                    : `${badge.progress}/${badge.streak} days on your current run`}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default BadgeDetailsPage;
