import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { isThemeId, themeIds, type ThemeId } from '../theme/themes';
import { exportAllDataToCsv } from '../utils/exportCsv';
import { importAllDataFromCsv } from '../utils/importCsv';

const tabs = [
  { to: '/weight', label: 'Weight' },
  { to: '/food', label: 'Food' },
  { to: '/activity', label: 'Activity' },
  { to: '/overview', label: 'Overview' },
] as const;
const APP_VERSION = '0.1.0';

export function AppLayout() {
  const [theme, setTheme] = useState<ThemeId>('default');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fitslave.theme');
    if (stored && isThemeId(stored)) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fitslave.theme', theme);
  }, [theme]);

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const result = await importAllDataFromCsv(file);
    const summary = `Imported: ${result.addedWeight} weight, ${result.addedFood} food, ${result.addedActivity} activity, ${result.addedDishes} dishes. Skipped: ${result.skipped}.`;
    const errorNote =
      result.errors.length > 0 ? ` Issues found: ${result.errors.length}.` : '';
    setImportMessage(`${summary}${errorNote}`);
    event.target.value = '';
  }

  return (
    <div className="app-shell">
      <header className="top-bar" aria-label="Quick settings">
        <p className="top-bar-version" aria-label="App version">
          v{APP_VERSION}
        </p>
        <div className="top-bar-right">
          <div className="top-bar-controls">
            <label className="theme-select">
              Theme
              <select
                value={theme}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isThemeId(next)) {
                    setTheme(next);
                  }
                }}
                aria-label="Select app theme"
              >
                {themeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className="top-bar-action" onClick={exportAllDataToCsv}>
              Export CSV
            </button>
            <button
              type="button"
              className="button-secondary top-bar-action"
              onClick={() => importInputRef.current?.click()}
            >
              Import CSV
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportChange}
              className="visually-hidden"
            />
          </div>
          {importMessage ? <p className="top-bar-note">{importMessage}</p> : null}
        </div>
      </header>

      <header className="app-header">
        <div>
          <h1>FitSlave</h1>
          <p>
            Track weight, nutrition, and physical activity with a focused dashboard.
            Your data is stored only in your browser (localStorage) and never sent to
            our servers.
          </p>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Main tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              isActive ? 'tab-link tab-link-active' : 'tab-link'
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
