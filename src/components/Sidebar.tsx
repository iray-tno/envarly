import React, { useState, useMemo } from 'react';
import type { EnvVar, VarScope } from '../types';

interface Props {
  vars: EnvVar[];
  selected: EnvVar | null;
  onSelect: (v: EnvVar) => void;
  loading: boolean;
}

export function Sidebar({ vars, selected, onSelect, loading }: Props) {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<VarScope | 'All'>('All');

  const filtered = useMemo(() => {
    return vars.filter((v) => {
      const matchScope = scopeFilter === 'All' || v.scope === scopeFilter;
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.value.toLowerCase().includes(search.toLowerCase());
      return matchScope && matchSearch;
    });
  }, [vars, search, scopeFilter]);

  const userCount = vars.filter((v) => v.scope === 'User').length;
  const systemCount = vars.filter((v) => v.scope === 'System').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <input
          className="search-input"
          type="text"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="scope-tabs">
        {(['All', 'User', 'System'] as const).map((scope) => (
          <button
            key={scope}
            className={`scope-tab ${scopeFilter === scope ? 'active' : ''}`}
            onClick={() => setScopeFilter(scope)}
          >
            {scope}
            <span className="scope-count">
              {scope === 'All'
                ? vars.length
                : scope === 'User'
                ? userCount
                : systemCount}
            </span>
          </button>
        ))}
      </div>

      <div className="var-list">
        {loading && <div className="var-list-empty">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="var-list-empty">No variables found</div>
        )}
        {filtered.map((v) => (
          <button
            key={`${v.scope}:${v.name}`}
            className={`var-item ${selected?.name === v.name && selected?.scope === v.scope ? 'selected' : ''}`}
            onClick={() => onSelect(v)}
          >
            <span className="var-item-name">{v.name}</span>
            <span className={`var-item-scope scope-${v.scope.toLowerCase()}`}>
              {v.scope[0]}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
