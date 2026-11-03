export default function ConfiguratorSkeleton({ label = "Preparing your custom design" }) {
  return (
    <main className="configurator-skeleton" role="status" aria-live="polite" aria-label={label}>
      <div className="configurator-skeleton__preview" />
      <aside className="configurator-skeleton__panel" aria-hidden="true">
        <div className="configurator-skeleton__tabs">
          <i />
          <i />
        </div>
        <div className="configurator-skeleton__scroll">
          <div className="configurator-skeleton__section-label" />
          <div className="configurator-skeleton__options">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </div>
          <div className="configurator-skeleton__section-label configurator-skeleton__section-label--band" />
          <div className="configurator-skeleton__options">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </div>
        </div>
        <div className="configurator-skeleton__footer">
          <div><i /><b /></div>
          <span />
          <span />
          <span />
        </div>
      </aside>
    </main>
  );
}
