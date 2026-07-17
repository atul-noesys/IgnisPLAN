import React, { useState } from "react";

export type TabItem = { label: string; id: string | number };

type TabsProps = {
  items: TabItem[];
  activeIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  tabClassName?: string;
  panelClassName?: string;
  renderPanel: (item: TabItem) => React.ReactNode;
};

export default function Tabs({
  items,
  activeIndex,
  onChange,
  className = "",
  tabClassName = "",
  panelClassName = "",
  renderPanel,
}: TabsProps) {
  const isControlled = typeof activeIndex === "number";
  const [uncontrolledIndex, setUncontrolledIndex] = useState<number>(activeIndex ?? 0);

  const index = isControlled ? (activeIndex as number) : uncontrolledIndex;

  if (!items || items.length === 0) return null;

  function handleClick(i: number) {
    if (onChange) onChange(i);
    if (!isControlled) setUncontrolledIndex(i);
  }

  const active = items[index] ?? items[0];

  return (
    <div className="dashboard-card">
      <div
        className={`dashboard-tabs-list ${className}`}
        role="tablist"
        aria-label="Dashboard views"
      >
        {items.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => handleClick(i)}
            className={`dashboard-tab ${i === index ? "dashboard-tab--active" : ""} ${tabClassName}`}
          >
            <span className="dashboard-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div
        className={`dashboard-tab-panel ${panelClassName}`}
        role="tabpanel"
        aria-label={active.label}
      >
        {renderPanel(active)}
      </div>
    </div>
  );
}
