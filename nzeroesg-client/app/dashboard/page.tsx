"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getBackendUrl } from "@/app/api/urls";

type Quota = { used: number; limit: number };

type WorkspaceSession = {
  workspace_id: string;
  expires_at: number;
  quotas: Record<string, Quota>;
  retention: { expires_at: number; policy: string };
};

type ShipmentRow = {
  shipment_id: string;
  origin: string;
  destination: string;
  weight_kg: number;
  distance_km: number;
  transport_method: string;
  source_row: number;
};

type ShipmentAnalysis = {
  shipment_count: number;
  total_weight_kg: number;
  total_emissions_kg: number;
  total_emissions_tonnes: number;
  mode_breakdown: Record<
    string,
    { shipment_count: number; weight_kg: number; emissions_kg: number }
  >;
  hotspots: Array<{
    shipment_id: string;
    origin: string;
    destination: string;
    transport_method: string;
    emissions_kg: number;
  }>;
  warnings: string[];
  factor_source: string;
  factor_version: string;
  factor_applicability: string;
  assumptions: string[];
};

type ShipmentData = {
  accepted_rows: number;
  errors: Array<{
    row_number: number | null;
    field: string | null;
    message: string;
  }>;
  warnings: string[];
  rows: ShipmentRow[];
  analysis: ShipmentAnalysis;
};

const navigation = [
  { label: "Overview", status: "Ready", href: "#overview" },
  { label: "Shipments", status: "Ready", href: "#shipments" },
  { label: "Suppliers / Evidence", status: "Next sprint", href: "#" },
  { label: "Scenarios", status: "Planned", href: "#" },
  { label: "Report", status: "Planned", href: "#" },
];

function formatExpiry(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

export default function UserPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    fetch(`${getBackendUrl()}/demo/session`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!response.ok) {
          throw new Error("The workspace could not be loaded.");
        }
        return (await response.json()) as WorkspaceSession;
      })
      .then((workspace) => {
        if (workspace && isCurrent) {
          setSession(workspace);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setError(
            "The API is unavailable. Start the backend and reload this page.",
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [router]);

  useEffect(() => {
    if (!session) {
      return;
    }
    let isCurrent = true;

    fetch(`${getBackendUrl()}/shipments`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Shipment data could not be loaded.");
        }
        return (await response.json()) as ShipmentData;
      })
      .then((shipments) => {
        if (isCurrent) {
          setShipmentData(shipments);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setShipmentError("Shipment data could not be loaded from the API.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [session]);

  function selectShipmentFile(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setShipmentError(null);
  }

  async function uploadShipments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setShipmentError("Choose a CSV file before uploading.");
      return;
    }

    setIsUploading(true);
    setShipmentError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(`${getBackendUrl()}/shipments/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        throw new Error(
          detail?.detail ?? "Shipment CSV could not be uploaded.",
        );
      }
      setShipmentData((await response.json()) as ShipmentData);
      setSelectedFile(null);
      const workspaceResponse = await fetch(`${getBackendUrl()}/demo/session`, {
        credentials: "include",
      });
      if (workspaceResponse.ok) {
        setSession((await workspaceResponse.json()) as WorkspaceSession);
      }
    } catch (requestError) {
      setShipmentError(
        requestError instanceof Error
          ? requestError.message
          : "Shipment CSV could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function leaveWorkspace() {
    await fetch(`${getBackendUrl()}/demo/session`, {
      method: "DELETE",
      credentials: "include",
    });
    router.replace("/");
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="rounded-lg border border-red-300 bg-red-50 px-5 py-4 text-red-800">
          {error}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading private workspace…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
      <aside className="border-b border-border px-6 py-6 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:py-8">
        <div className="mb-10">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            🌱 NZeroESG
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Scope 3 demo portal
          </p>
        </div>
        <nav aria-label="Workspace navigation" className="space-y-2">
          {navigation.map((item, index) => (
            <a
              href={item.href}
              key={item.label}
              className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm ${
                index === 0 ? "bg-secondary text-white" : "text-primary"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={
                  index === 0 ? "text-white/70" : "text-muted-foreground"
                }
              >
                {item.status}
              </span>
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={leaveWorkspace}
          className="mt-10 text-sm font-semibold text-primary hover:text-accent"
        >
          Leave workspace
        </button>
      </aside>

      <section id="overview" className="flex-1 px-6 py-8 lg:px-10 lg:py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
              Private workspace
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              Overview
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              The protected portal is ready for shipment data, supplier
              evidence, and decision reports to land in the next roadmap phases.
            </p>
          </div>
          <code className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-primary">
            {session.workspace_id}
          </code>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-muted p-5">
            <p className="text-sm text-muted-foreground">Workspace retention</p>
            <p className="mt-2 text-2xl font-bold text-primary">Active</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Expires {formatExpiry(session.retention.expires_at)}
            </p>
          </article>
          <article className="rounded-xl border border-border bg-muted p-5">
            <p className="text-sm text-muted-foreground">Evidence documents</p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {session.quotas.evidence_documents.used} /{" "}
              {session.quotas.evidence_documents.limit}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Documents per workspace
            </p>
          </article>
          <article className="rounded-xl border border-border bg-muted p-5">
            <p className="text-sm text-muted-foreground">Analysis runs today</p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {session.quotas.analysis_runs_per_day.used} /{" "}
              {session.quotas.analysis_runs_per_day.limit}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Deterministic calculations
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold text-primary">
            Phase 2 boundary verified
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            This page only loads after the API accepts the signed workspace
            cookie. Direct emissions calls without that cookie receive a safe
            401 response, and each new visitor receives a different workspace
            id.
          </p>
        </div>

        <section
          id="shipments"
          className="mt-8 rounded-xl border border-border bg-muted p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
                Phase 3
              </p>
              <h2 className="text-2xl font-semibold text-primary">
                Shipment baseline
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                Upload the documented CSV schema. Invalid rows stay visible as
                quality warnings while accepted rows are normalized and counted.
              </p>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-primary">
              Max 500 rows · 10 MB
            </span>
          </div>

          <form
            onSubmit={uploadShipments}
            className="mt-6 flex flex-wrap items-end gap-3"
          >
            <label className="flex min-w-64 flex-1 flex-col gap-2 text-sm font-semibold text-primary">
              Shipment CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={selectShipmentFile}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-primary file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-white"
              />
            </label>
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-full bg-secondary px-5 py-3 font-semibold text-white transition hover:bg-accent disabled:cursor-wait disabled:opacity-60"
            >
              {isUploading ? "Analyzing…" : "Upload and analyze"}
            </button>
          </form>

          {shipmentError ? (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {shipmentError}
            </p>
          ) : null}

          {shipmentData ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <article className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    Accepted shipments
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {shipmentData.analysis.shipment_count}
                  </p>
                </article>
                <article className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    Total emissions
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {shipmentData.analysis.total_emissions_kg.toFixed(2)} kg
                    CO₂e
                  </p>
                </article>
                <article className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    Total freight weight
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {shipmentData.analysis.total_weight_kg.toFixed(2)} kg
                  </p>
                </article>
              </div>

              {shipmentData.errors.length > 0 ? (
                <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Data-quality issues</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {shipmentData.errors.slice(0, 8).map((issue, index) => (
                      <li key={`${issue.row_number}-${issue.field}-${index}`}>
                        {issue.row_number ? `Row ${issue.row_number}: ` : ""}
                        {issue.field ? `${issue.field} — ` : ""}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-primary">
                    Emissions by mode
                  </h3>
                  <div className="mt-3 space-y-2">
                    {Object.entries(shipmentData.analysis.mode_breakdown).map(
                      ([mode, breakdown]) => (
                        <div
                          key={mode}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm"
                        >
                          <span className="font-semibold capitalize text-primary">
                            {mode}
                          </span>
                          <span className="text-muted-foreground">
                            {breakdown.emissions_kg.toFixed(2)} kg ·{" "}
                            {breakdown.shipment_count} shipments
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    Top shipment hotspots
                  </h3>
                  <div className="mt-3 space-y-2">
                    {shipmentData.analysis.hotspots
                      .slice(0, 5)
                      .map((hotspot) => (
                        <div
                          key={hotspot.shipment_id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm"
                        >
                          <span className="text-primary">
                            <strong>{hotspot.shipment_id}</strong>
                            <span className="ml-2 text-muted-foreground">
                              {hotspot.origin} → {hotspot.destination}
                            </span>
                          </span>
                          <span className="font-semibold text-primary">
                            {hotspot.emissions_kg.toFixed(2)} kg
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
                <table className="min-w-full text-left text-sm">
                  <caption className="sr-only">
                    Normalized shipment rows
                  </caption>
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Shipment</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipmentData.rows.slice(0, 10).map((row) => (
                      <tr
                        key={`${row.shipment_id}-${row.source_row}`}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-semibold text-primary">
                          {row.shipment_id}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.origin} → {row.destination}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.weight_kg} kg
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.distance_km} km
                        </td>
                        <td className="px-4 py-3 capitalize text-primary">
                          {row.transport_method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Factor source: {shipmentData.analysis.factor_source} · version{" "}
                {shipmentData.analysis.factor_version}.{" "}
                {shipmentData.analysis.factor_applicability}
              </p>
            </>
          ) : null}
        </section>
      </section>
    </div>
  );
}
