type RightPanelFooterProps = {
  readOnly: boolean;
  connected: boolean;
};

export const RightPanelFooter = ({
  readOnly,
  connected,
}: RightPanelFooterProps) => (
  <div className="rp-footer">
    <span>
      {readOnly ? 'Simulation running · View only' : 'Scenario Manager'}
    </span>
    <span
      className={`rp-connection${connected ? ' connected' : ''}`}
      title={
        connected ? 'Live status connected' : 'Reconnecting to status channel'
      }
    >
      <span className="rp-footer-dot" />
      {connected ? 'Connected' : 'Reconnecting'}
    </span>
  </div>
);
