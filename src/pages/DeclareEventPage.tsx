import { NumberInput, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { PageCard, SaveActions, useChrome } from "./_shared";

export function DeclareEventPage() {
  const [params] = useSearchParams(); const type = params.get("type") || "emergency"; const navigate = useNavigate(); const { refresh } = useAppStore();
  useChrome("Declare Event", type === "setup_down" ? "Mark a setup unavailable" : "Block a setup for an emergency");
  const form = useForm({ initialValues: { setupId: params.get("setupId") || "", date: params.get("date") || "2026-07-08", startTime: "09:00", durationMinutes: 60, effectiveTo: params.get("date") || "2026-07-08", reason: "" } });
  return <PageCard><form onSubmit={form.onSubmit((v) => { const payload: any = { type, setupId: v.setupId, reason: v.reason }; if (type === "emergency") Object.assign(payload, { date: v.date, startTime: v.startTime, durationMinutes: v.durationMinutes }); else Object.assign(payload, { date: v.date, effectiveFrom: v.date, effectiveTo: v.effectiveTo }); const result = Store.declareEvent(payload); refresh(); navigate(`/reschedule/${result.plan.id}`); })}><Stack>
    <Select label="Setup" data={Store.getSetups().filter((s: any) => s.status === "Active").map((s: any) => ({ value: s.id, label: s.name }))} required {...form.getInputProps("setupId")} /><TextInput label={type === "emergency" ? "Date" : "Effective from"} type="date" required {...form.getInputProps("date")} />
    {type === "emergency" ? <><TextInput label="Start time" type="time" required {...form.getInputProps("startTime")} /><NumberInput label="Duration (minutes)" min={15} step={15} {...form.getInputProps("durationMinutes")} /></> : <TextInput label="Effective to" type="date" required {...form.getInputProps("effectiveTo")} />}
    <Textarea label="Reason" {...form.getInputProps("reason")} />
  </Stack><SaveActions cancelTo="/events" label="Generate reschedule plan" /></form></PageCard>;
}
