export function BootSplash({ label = "LOADING" }: { label?: string }) {
  return (
    <div className="boot-splash">
      <img src="/icon.jpg" alt="MAXIM RETRO" className="boot-logo" />
      <div className="boot-name">MAXIM RETRO</div>
      <div className="boot-bar">
        <i />
      </div>
      <div className="boot-label">{label}</div>
    </div>
  );
}

export function PowerOffScreen({ onPower }: { onPower: () => void }) {
  return (
    <div className="power-off">
      <button type="button" className="power-btn is-off" onClick={onPower} title="Power on">
        <svg className="ui-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2v10M7.2 5.1a8 8 0 1 0 9.6 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <img src="/icon.jpg" alt="MAXIM RETRO" className="boot-logo is-dim" />
      <div className="boot-name">MAXIM RETRO</div>
      <p>POWER OFF</p>
    </div>
  );
}
