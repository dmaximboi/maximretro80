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
        ⏻
      </button>
      <img src="/icon.jpg" alt="MAXIM RETRO" className="boot-logo is-dim" />
      <div className="boot-name">MAXIM RETRO</div>
      <p>POWER OFF</p>
    </div>
  );
}
