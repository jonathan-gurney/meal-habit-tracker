function PanelHeader({ title, description }) {
  return (
    <div className="panel__header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export default PanelHeader;
