import { InfoboardFromAPI } from "@/types/infoboard";
import axios, { AxiosResponse } from "axios";

export type NgaugeDataRow = Record<string, string | number | boolean | null>;

export type PrimaryKeyData = {
  primaryKey: string;
  value: string;
};

export interface ActionStats {
  total_count: number;
  overdue_count: number;
  tasks_completed_today: number;
}

export interface ActionStatsResponse {
  Task?: ActionStats;
  call?: ActionStats;
  email?: ActionStats;
  Follow_up?: ActionStats;
  proposal?: ActionStats;
  demo?: ActionStats;
  linkedIn?: ActionStats;
  meeting?: ActionStats;
}

type NgaugeFormResponse = {
  formSchema?: string;
  FormSchema?: string;
  dataSourceId?: number;
  DataSourceId?: number;
};

type NgaugeGetDataResponse = {
  data?: NgaugeDataRow[];
  TotalRowCount?: number;
  FilterData?: Record<string, unknown>;
  DeletedColumns?: string[];
  CompiledQuery?: string;
  tableName?: string;
};

type NgaugeGetRowResponse = {
  data?: NgaugeDataRow;
  Data?: NgaugeDataRow;
};

type NgaugeAddRowResponse = {
  data?: unknown;
};

export type PaginatedDataResponse = {
  data: NgaugeDataRow[];
  totalRowCount: number;
};

export type InfoveaveQueryRequest = {
  dataSourceId: number;
  query: string;
  dateFilters?: string[];
  startDate?: string;
  endDate?: string;
  filters?: Array<{
    name: string;
    operator: string;
    items: string[];
  }>;
};

export type RevisedAllocationScheduleRow = {
  patientId: string;
  newStaffId: string;
  newStaffName: string;
};

type InfoveaveQueryResponse = {
  data?: Array<Array<unknown>>;
  Data?: Array<Array<unknown>>;
  exceptionMessage?: string;
  ExceptionMessage?: string;
};

export const INFOVEAVE_TENANT = "acmehealth";
export const INFOVEAVE_BASE_URL = `https://${INFOVEAVE_TENANT}.infoveave.app`;

class NgaugeStore {
  private readonly baseUrl = `${INFOVEAVE_BASE_URL}/api/v10/ngauge/forms`;
  private readonly queryBaseUrl = `https://${INFOVEAVE_TENANT}.infoveave.app/api/v10/insights/queries`;

  private getHeaders() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getFormById(formId: number): Promise<NgaugeFormResponse> {
    const { data } = await axios.get<NgaugeFormResponse>(
      `${this.baseUrl}/${formId}`,
      { headers: this.getHeaders(), withCredentials: true },
    );
    return data;
  }

  async getData(
    formId: number,
    table: string,
    skip = 0,
    take = 200,
    filters?:
      | { [key: string]: { items: string[]; operator: string }[] }
      | undefined,
    sort?: { [keyValue: string]: string } | undefined,
  ): Promise<NgaugeDataRow[]> {
    const payload = {
      table,
      NGaugeId: formId,
      skip,
      take,
      filters,
      sort,
    };

    const { data } = await axios.post<NgaugeGetDataResponse>(
      `${this.baseUrl}/${formId}/get-data`,
      payload,
      { headers: this.getHeaders(), withCredentials: true },
    );

    const maybeEnvelope = data?.data;

    if (Array.isArray(maybeEnvelope)) {
      return maybeEnvelope;
    }
    return [];
  }

  async getPaginatedData(
    formId: number,
    table: string,
    pageNo: number,
    limit: number,
    filters?:
      | { [key: string]: { items: string[]; operator: string }[] }
      | undefined,
    sort?: { [keyValue: string]: string } | undefined,
  ): Promise<PaginatedDataResponse> {
    const skip = (pageNo - 1) * limit;
    const take = limit;
    const payload = {
      table,
      NGaugeId: formId,
      skip,
      take,
      filters,
      sort,
    };

    const { data } = await axios.post<NgaugeGetDataResponse>(
      `${this.baseUrl}/${formId}/get-data`,
      payload,
      { headers: this.getHeaders(), withCredentials: true },
    );

    let dataArray: NgaugeDataRow[] = data?.data ?? [];

    const totalRowCount = data?.TotalRowCount ?? 0;

    return {
      data: dataArray,
      totalRowCount,
    };
  }

  async addRow(
    formId: number,
    tableName: string,
    rowData: NgaugeDataRow,
  ): Promise<unknown> {
    const { data } = await axios.post<NgaugeAddRowResponse>(
      `${this.baseUrl}/${formId}/row`,
      {
        rowData,
        tableName,
      },
      { headers: this.getHeaders(), withCredentials: true },
    );

    return data?.data ?? data;
  }

  async EditRowData(
    formId: number,
    table: string,
    editRowData: { rowData: NgaugeDataRow; primaryKeyData: PrimaryKeyData },
  ): Promise<{ result: boolean; error: string }> {
    try {
      await axios.put(
        `${this.baseUrl}/${formId}/row`,
        { ...editRowData, tableName: table },
        { headers: this.getHeaders(), withCredentials: true },
      );
      return { result: true, error: "" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { result: false, error: errorMessage };
    }
  }

  async getRow(
    formId: number,
    tableName: string,
    rowId: string | number,
    primaryKey = "ROWID",
  ): Promise<NgaugeDataRow | null> {
    const { data } = await axios.post<NgaugeGetRowResponse>(
      `${this.baseUrl}/${formId}/get-row`,
      {
        primaryKeyData: {
          primaryKey,
          value: String(rowId),
        },
        tableName,
      },
      { headers: this.getHeaders(), withCredentials: true },
    );

    if (data?.data && typeof data.data === "object") {
      return data.data;
    }
    if (data?.Data && typeof data.Data === "object") {
      return data.Data;
    }
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      ("id" in data || "ROWID" in data)
    ) {
      return data as unknown as NgaugeDataRow;
    }
    return null;
  }

  async deleteRow(
    formId: number,
    rowId: string | number,
    tableName: string,
    primaryKey: string,
  ): Promise<unknown> {
    const { data } = await axios.patch<NgaugeAddRowResponse>(
      `${this.baseUrl}/${formId}/row/delete`,
      {
        primaryKeyData: {
          primaryKey: primaryKey,
          value: String(rowId),
        },
        tableName,
      },
      { headers: this.getHeaders(), withCredentials: true },
    );

    return data?.data ?? data;
  }

  async executeInfoveaveQuery(
    request: InfoveaveQueryRequest,
  ): Promise<Array<Array<unknown>>> {
    const payload = {
      dataSourceId: request.dataSourceId,
      query: request.query,
      dateFilters: request.dateFilters ?? [],
      startDate: request.startDate ?? "",
      endDate: request.endDate ?? "",
      filters: request.filters ?? [],
    };

    const { data } = await axios.post<InfoveaveQueryResponse>(
      `${this.queryBaseUrl}/execute-infoveave-query`,
      payload,
      { headers: this.getHeaders(), withCredentials: true },
    );

    const exceptionMessage = data?.exceptionMessage ?? data?.ExceptionMessage;
    if (exceptionMessage) {
      throw new Error(exceptionMessage);
    }

    const rows = data?.data;
    return Array.isArray(rows) ? rows : [];
  }

  async GetColumnItems(
    id: number,
    column: string,
    search?: string,
  ): Promise<string[]> {
    try {
      const request = {
        sourceName: column,
        query: search,
      };
      const { data }: AxiosResponse<string[]> = await axios.post(
        `${this.baseUrl}/${id}/column/get-distinct-values`,
        request,
        { headers: this.getHeaders(), withCredentials: true },
      );
      return data.sort();
    } catch (_e) {
      return [];
    }
  }

  async getContactCountByAccountId(
    dataSourceId: number,
  ): Promise<Record<string, number>> {
    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query:
        "SELECT account_id, COUNT(id) AS contact_count FROM contacts GROUP BY account_id",
    });

    const result: Record<string, number> = {};
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) {
        continue;
      }

      const rawAccountId = row[0];
      const rawCount = row[1];
      const accountId = `${rawAccountId ?? ""}`.trim();
      const countText = `${rawCount ?? ""}`.trim();

      // Skip header row returned by execute query.
      if (
        accountId.toLowerCase() === "account_id" &&
        countText.toLowerCase() === "contact_count"
      ) {
        continue;
      }

      if (!accountId) {
        continue;
      }

      const count = Number(countText);
      result[accountId] = Number.isFinite(count) ? count : 0;
    }

    return result;
  }

  async getContactsRoles(
    dataSourceId: number,
    contactId: string,
  ): Promise<string[]> {
    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query: `select role_type from contact_roles where contact_id = '${contactId}'`,
    });

    // Skip header row and extract role_type values
    return rows.slice(1).map((row) => row[0] as string);
  }

  async getActionsStatsForWorkSpace(
    dataSourceId: number,
  ): Promise<ActionStatsResponse> {
    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query: `SELECT
        action_category,
        action_type,
        SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS total_count,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
        SUM(CASE WHEN status = 'completed' AND DATE(updated_at) = DATE('now') THEN 1 ELSE 0 END) AS tasks_completed_today
    FROM action_items
    GROUP BY action_category, action_type
    ORDER BY action_type;`,
    });

    const result: ActionStatsResponse = {};

    // Skip header row
    rows
      .slice(1)
      .forEach(
        ([
          action_category,
          action_type,
          total_count,
          overdue_count,
          tasks_completed_today,
        ]) => {
          const stats = {
            total_count: Number(total_count) || 0,
            overdue_count: Number(overdue_count) || 0,
            tasks_completed_today: Number(tasks_completed_today) || 0,
          };

          // 1. Aggregate by action_type (e.g. "Call", "Email") — summing across all categories
          const typeKey = action_type as keyof ActionStatsResponse;
          if (!result[typeKey]) {
            result[typeKey] = {
              total_count: 0,
              overdue_count: 0,
              tasks_completed_today: 0,
            };
          }
          result[typeKey]!.total_count += stats.total_count;
          result[typeKey]!.overdue_count += stats.overdue_count;
          result[typeKey]!.tasks_completed_today += stats.tasks_completed_today;

          // 2. Aggregate by action_category (e.g. "Follow_up", "Task") — summing across all types
          const categoryKey = action_category as keyof ActionStatsResponse;
          if (!result[categoryKey]) {
            result[categoryKey] = {
              total_count: 0,
              overdue_count: 0,
              tasks_completed_today: 0,
            };
          }
          result[categoryKey]!.total_count += stats.total_count;
          result[categoryKey]!.overdue_count += stats.overdue_count;
          result[categoryKey]!.tasks_completed_today +=
            stats.tasks_completed_today;
        },
      );

    return result;
  }

  async getAccountsStats(dataSourceId: number): Promise<ActionStatsResponse> {
    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query: `SELECT
    COUNT(DISTINCT a.id) AS total_accounts,
    COUNT(c.id) AS total_contacts,
    COUNT(DISTINCT CASE
        WHEN a.health_status = 'Hot' THEN a.id
    END) AS hot_accounts,
    ROUND(
        COUNT(c.id) * 1.0 / COUNT(DISTINCT a.id),
        2
    ) AS avg_contacts_per_account
FROM accounts a
LEFT JOIN contacts c
    ON c.account_id = a.id;`,
    });

    const result: ActionStatsResponse = {};

    if (rows && rows.length >= 2) {
      const headers = rows[0];
      const dataRow = rows[1];
      headers.forEach((header, index) => {
        if (header !== undefined && header !== null) {
          const key = String(header);
          const val = dataRow[index];
          const numVal = Number(val);
          (result as any)[key] =
            isNaN(numVal) || val === "" || val === null ? val : numVal;
        }
      });
    }

    return result;
  }

  async getContactsStats(dataSourceId: number): Promise<ActionStatsResponse> {
    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query: `SELECT
    COUNT(c.id) AS total_contacts,

    COUNT(
        CASE
            WHEN cr.role_type = 'Decision Maker'
            THEN cr.contact_id
        END
    ) AS total_decision_makers,

    COUNT(
        CASE
            WHEN datetime(c.updated_at) >= datetime('now', '-7 days')
            THEN c.id
        END
    ) AS active_this_week,

    '0%' AS avg_engagement

FROM contacts c
LEFT JOIN contact_roles cr
    ON c.id = cr.contact_id;`,
    });

    const result: ActionStatsResponse = {};

    if (rows && rows.length >= 2) {
      const headers = rows[0];
      const dataRow = rows[1];
      headers.forEach((header, index) => {
        if (header !== undefined && header !== null) {
          const key = String(header);
          const val = dataRow[index];
          const numVal = Number(val);
          (result as any)[key] =
            isNaN(numVal) || val === "" || val === null ? val : numVal;
        }
      });
    }

    return result;
  }

  /**
   * Mark diagnostic request(s) as Assigned via Infoveave SQL.
   * Returns true on success, false on failure / empty id list.
   */
  async allocatePatients(
    dataSourceId: number,
    requestIds: string[],
  ): Promise<boolean> {
    const ids = (requestIds ?? [])
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);

    if (!dataSourceId || ids.length === 0) {
      return false;
    }

    const idList = ids
      .map((id) => `'${id.replace(/'/g, "''")}'`)
      .join(", ");

    const query = `
UPDATE hosp_diagnostic_requests
SET
  status = 'Assigned',
  requested_date = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (${idList})
  AND status IN ('Pending', 'Re-Scheduled');
`.trim();

    try {
      await this.executeInfoveaveQuery({
        dataSourceId,
        query,
      });
      return true;
    } catch (error) {
      console.error("allocatePatients failed:", error);
      return false;
    }
  }

  async reAllocatePatientsBackToQueue(
    dataSourceId: number,
    requestIds: string[],
  ): Promise<boolean> {
    const ids = (requestIds ?? [])
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);

    if (!dataSourceId || ids.length === 0) {
      return false;
    }

    const idList = ids
      .map((id) => `'${id.replace(/'/g, "''")}'`)
      .join(", ");

    const query = `
UPDATE hosp_diagnostic_requests
SET
  status = 'Re-Scheduled',
  setup_id = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (${idList})
  AND status = 'Assigned';
`.trim();

    try {
      await this.executeInfoveaveQuery({
        dataSourceId,
        query,
      });
      return true;
    } catch (error) {
      console.error("reAllocatePatientsBackToQueue failed:", error);
      return false;
    }
  }

  async assignBedsToAllocations(
    formId: number,
    tableName: string,
    assignments: Array<{ recordId: string; bedId: string }>,
    recordIdField = "recordid",
  ): Promise<boolean> {
    const rows = (assignments ?? [])
      .map((item) => ({
        recordId: String(item?.recordId ?? "").trim(),
        bedId: String(item?.bedId ?? "").trim(),
      }))
      .filter((item) => item.recordId && item.bedId);

    if (!formId || !tableName || rows.length === 0) {
      return false;
    }

    for (const { recordId, bedId } of rows) {
      const primaryKeys = [recordIdField, "recordId", "id"];
      let existing: NgaugeDataRow | null = null;
      let resolvedPrimaryKey = recordIdField;

      for (const primaryKey of primaryKeys) {
        existing = await this.getRow(formId, tableName, recordId, primaryKey);
        if (existing) {
          resolvedPrimaryKey = primaryKey;
          break;
        }
      }

      if (!existing) {
        console.error("assignBedsToAllocations: row not found", recordId);
        return false;
      }

      const result = await this.EditRowData(formId, tableName, {
        rowData: { ...existing, bed_id: bedId },
        primaryKeyData: { primaryKey: resolvedPrimaryKey, value: recordId },
      });

      if (!result.result) {
        console.error(
          "assignBedsToAllocations failed:",
          recordId,
          result.error,
        );
        return false;
      }
    }

    return true;
  }

  async getRevisedAllocationSchedule(
    dataSourceId: number,
    patientIds: string | string[],
  ): Promise<RevisedAllocationScheduleRow[]> {
    const ids = (Array.isArray(patientIds) ? patientIds : [patientIds])
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);

    if (!dataSourceId || ids.length === 0) {
      return [];
    }

    const escapeSql = (value: string) => value.replace(/'/g, "''");
    const idList = ids.map((id) => `'${escapeSql(id)}'`).join(", ");

    const rows = await this.executeInfoveaveQuery({
      dataSourceId,
      query: `
SELECT patientid, new_staffid, new_staffname
FROM revised_allocation_schedule
WHERE patientid IN (${idList});
`.trim(),
    });

    return rows
      .slice(1)
      .map((row) => {
        if (!Array.isArray(row) || row.length < 3) {
          return null;
        }

        const patientIdValue = String(row[0] ?? "").trim();
        const newStaffId = String(row[1] ?? "").trim();
        const newStaffName = String(row[2] ?? "").trim();

        if (
          patientIdValue.toLowerCase() === "patientid" &&
          newStaffId.toLowerCase() === "new_staffid"
        ) {
          return null;
        }

        if (!patientIdValue) {
          return null;
        }

        return {
          patientId: patientIdValue,
          newStaffId,
          newStaffName,
        };
      })
      .filter((row): row is RevisedAllocationScheduleRow => row !== null);
  }

  async GetInfoboards(): Promise<InfoboardFromAPI[] | null> {
    try {
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("access_token");
      }
      const result: AxiosResponse<InfoboardFromAPI[]> = await axios.get(
        `${INFOVEAVE_BASE_URL}/api/v10/Infoboards`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );
      return result.data;
    } catch (error) {
      console.error("Error fetching infoboards:", error);
      return null;
    }
  }
}

export const ngaugeStore = new NgaugeStore();
