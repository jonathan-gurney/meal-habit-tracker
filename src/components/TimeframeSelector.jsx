function TimeframeSelector({ options, selectedValue, onChange }) {
  return (
    <div className="timeframeRow">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            option.value === selectedValue ? "timePill timePill--active" : "timePill"
          }
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default TimeframeSelector;
