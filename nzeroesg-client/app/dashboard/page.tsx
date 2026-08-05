"use client";

import { useEffect, useState } from "react";
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

const navigation = [
  { label: "Overview", status: "Ready" },
  { label: "Shipments", status: "Next sprint" },
  { label: "Suppliers / Evidence", status: "Next sprint" },
  { label: "Scenarios", status: "Planned" },
  { label: "Report", status: "Planned" },
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
            <div
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
            </div>
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

      <section className="flex-1 px-6 py-8 lg:px-10 lg:py-12">
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
      </section>
    </div>
  );
}
