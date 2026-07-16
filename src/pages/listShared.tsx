import { type ReactNode } from "react";
import { ActionIcon, Group, Select, Skeleton, TextInput, Tooltip } from "@mantine/core";
import { IconFilterOff, IconSearch } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { UI } from "@/lib/prototype";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";

export const TABLE_MIN_HEIGHT = 420;
export const TABLE_SKELETON_ROWS = 10;

export function StatsGrid({
  cards,
}: {
  cards: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <span className="stat-card-label">{card.label}</span>
          <span className="stat-card-value">{card.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FiltersCard({
  title = "Filters",
  hasActive,
  onClear,
  children,
}: {
  title?: string;
  hasActive: boolean;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div className="card filters-card">
      <div className="filters-stack">
        <Group justify="space-between" align="center" mb={0} gap={8} wrap="nowrap">
          <h2 className="filters-title" style={{ margin: 0 }}>
            {title}
          </h2>
          {/* Always mounted so header height / filter gap does not jump */}
          <Tooltip label="Clear all filters" disabled={!hasActive}>
            <ActionIcon
              className="filters-clear-btn"
              size="sm"
              variant="light"
              color="blue"
              aria-label="Clear all filters"
              onClick={onClear}
              style={{
                visibility: hasActive ? "visible" : "hidden",
                pointerEvents: hasActive ? "auto" : "none",
              }}
            >
              <IconFilterOff size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Group
          align="flex-end"
          grow
          preventGrowOverflow={false}
          wrap="wrap"
          gap={8}
        >
          {children}
        </Group>
      </div>
    </div>
  );
}

export function FilterSearch({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      leftSection={<IconSearch size={16} />}
      size="sm"
      styles={{
        root: { gap: 4, rowGap: 4 },
        wrapper: { marginTop: 0 },
        label: {
          marginBottom: 4,
          paddingBottom: 0,
          lineHeight: 1.25,
          fontSize: 12,
        },
      }}
      style={{ flex: "1 1 220px", minWidth: 200 }}
    />
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const data = options.map((opt) =>
    opt.value === "" ? { ...opt, value: "all" } : opt,
  );
  return (
    <Select
      label={label}
      value={value || "all"}
      onChange={(v) => onChange(!v || v === "all" ? "" : v)}
      data={data}
      clearable={false}
      allowDeselect={false}
      size="sm"
      styles={{
        root: { gap: 4, rowGap: 4 },
        wrapper: { marginTop: 0 },
        label: {
          marginBottom: 4,
          paddingBottom: 0,
          lineHeight: 1.25,
          fontSize: 12,
        },
      }}
      style={{ flex: "1 1 160px", minWidth: 150 }}
    />
  );
}

export function ResultsBar({
  shown,
  total,
  entity,
  suffix = "",
}: {
  shown: number;
  total: number;
  entity: string;
  suffix?: string;
}) {
  const start = shown === 0 ? 0 : 1;
  return (
    <div className="results-bar">
      <p className="results-bar-text">
        Showing {start} - {shown} of {total} {entity}
        {suffix}
      </p>
      <span className="badge badge-count">{shown} shown</span>
    </div>
  );
}

export function EmptyFilterState({
  message,
  onClear,
}: {
  message: string;
  onClear: () => void;
}) {
  return (
    <div className="card" style={{ padding: 24, textAlign: "center" }}>
      <p style={{ margin: "0 0 12px" }}>{message}</p>
      <IgnisButton leftSection={IgnisIcons.clear} onClick={onClear}>
        Clear filters
      </IgnisButton>
    </div>
  );
}

/** Fixed-height table shell so loading / empty / data do not jump layout. */
export function DataTableShell({
  children,
  className = "",
  minHeight = TABLE_MIN_HEIGHT,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: number;
}) {
  return (
    <div
      className={`card data-table-wrap${className ? ` ${className}` : ""}`}
      style={{ minHeight }}
    >
      {children}
    </div>
  );
}

/** Skeleton rows for list tables (replaces spinner loading). */
export function TableSkeletonRows({
  columns,
  rows = TABLE_SKELETON_ROWS,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={`skeleton-${rowIndex}-${colIndex}`}>
              <Skeleton
                height={14}
                width={colIndex === 0 ? "72%" : colIndex === columns - 1 ? 40 : "58%"}
                radius="sm"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableEmptyRow({
  columns,
  message,
  onClear,
}: {
  columns: number;
  message: string;
  onClear: () => void;
}) {
  return (
    <tr>
      <td colSpan={columns} style={{ padding: 32, textAlign: "center" }}>
        <p style={{ margin: "0 0 12px" }}>{message}</p>
        <IgnisButton leftSection={IgnisIcons.clear} onClick={onClear}>
          Clear filters
        </IgnisButton>
      </td>
    </tr>
  );
}

export function ProtoBadge({ text, variant }: { text: string; variant?: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: UI.badge(text, variant || text),
      }}
    />
  );
}

export function AddActionButton({ to, label }: { to: string; label: string }) {
  return (
    <IgnisButton component={Link} to={to} leftSection={IgnisIcons.plus}>
      {label}
    </IgnisButton>
  );
}
