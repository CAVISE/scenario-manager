import {
  ArticleOutlined,
  DownloadOutlined,
  ImageOutlined,
  TerminalOutlined,
} from '@mui/icons-material';
import { API_URL } from '@/VARS';
import type { RunArtifact } from '@/features/simulation-runs';

interface RunArtifactListProps {
  artifacts: RunArtifact[];
  formatDate: (value?: number | null) => string;
}

function artifactIcon(artifact: RunArtifact) {
  if (artifact.kind === 'image') return <ImageOutlined />;
  if (artifact.kind === 'log') return <TerminalOutlined />;
  return <ArticleOutlined />;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function RunArtifactList({
  artifacts,
  formatDate,
}: RunArtifactListProps) {
  return (
    <section
      className="workspace-artifact-explorer"
      aria-labelledby="artifact-title"
    >
      <div className="workspace-section-heading">
        <div>
          <span className="workspace-kicker">ARTIFACT EXPLORER</span>
          <h2 id="artifact-title">Results and diagnostics</h2>
        </div>
        <span className="workspace-count">{artifacts.length} available</span>
      </div>
      {artifacts.length ? (
        <div className="workspace-artifact-list">
          {artifacts.map((artifact) => (
            <article key={artifact.filename}>
              <span className="workspace-artifact-icon">
                {artifactIcon(artifact)}
              </span>
              <div>
                <strong>{artifact.filename}</strong>
                <span>
                  {artifact.kind} · {formatBytes(artifact.size_bytes)} ·{' '}
                  {formatDate(artifact.modified_at)}
                </span>
              </div>
              <a
                className="workspace-secondary"
                href={`${API_URL.replace(/\/$/, '')}${artifact.url}`}
                target="_blank"
                rel="noreferrer"
              >
                <DownloadOutlined /> Download
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty">
          <strong>No artifacts yet</strong>
          <p>
            Files will appear here as the simulation writes results, logs and
            configurations.
          </p>
        </div>
      )}
    </section>
  );
}
