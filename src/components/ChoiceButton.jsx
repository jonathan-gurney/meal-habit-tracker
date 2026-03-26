function ChoiceButton({ isActive, accent, label, onClick }) {
  return (
    <button
      type="button"
      className={isActive ? "choice choice--active" : "choice"}
      onClick={onClick}
    >
      <span className="choice__dot" style={{ backgroundColor: accent }} />
      {label}
    </button>
  );
}

export default ChoiceButton;
