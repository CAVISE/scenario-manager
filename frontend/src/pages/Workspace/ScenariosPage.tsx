import { useMemo, useState } from 'react';
import { useScenarioManager } from '../StartPage/hooks/useScenarioManager';
import { ScenarioCards } from './ScenarioCards';

export default function ScenariosPage() {
  const manager = useScenarioManager();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const items = useMemo(
    () =>
      manager.scenarios
        .filter((item) =>
          `${item.name} ${item.annotation ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .sort((a, b) =>
          sort === 'name' ? a.name.localeCompare(b.name) : b.id - a.id
        ),
    [manager.scenarios, query, sort]
  );
  return (
    <section>
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">SCENARIO LIBRARY</span>
          <h1>Scenarios</h1>
          <p>Open a saved scenario or start a new one.</p>
        </div>
        <button
          type="button"
          className="workspace-primary"
          onClick={manager.handleCreateNew}
        >
          + Create scenario
        </button>
      </div>
      <div className="workspace-list-tools">
        <input
          type="search"
          aria-label="Search scenarios"
          placeholder="Search scenarios…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label>
          Sort by{' '}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest created</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      {!manager.isLoading && !manager.isError && (
        <p className="workspace-count">
          {items.length} scenarios{query ? ` matching “${query}”` : ''}
        </p>
      )}
      <ScenarioCards
        items={items}
        currentId={manager.scenario.id}
        onOpen={manager.handleOpen}
        isLoading={manager.isLoading}
        error={manager.error}
        onRetry={manager.refetch}
      />
    </section>
  );
}
