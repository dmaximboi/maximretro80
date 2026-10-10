import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="boot-splash">
          <img src="/icon.jpg" alt="MAXIM RETRO" className="boot-logo" />
          <div className="boot-name">MAXIM RETRO</div>
          <div className="boot-label">RESTART THE CABINET</div>
          <button type="button" className="play-howto-go" onClick={() => window.location.reload()}>
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
