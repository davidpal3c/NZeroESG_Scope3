import {
  BarChart3,
  Calculator,
  Database,
  FileInput,
  FileSearch,
  FileText,
  Users,
  Wrench,
} from "lucide-react";

export const featuresData = [
  {
    id: 1,
    title: "Offline-safe API",
    icon: Wrench,
    description:
      "Health checks, validation, and tests run without LLM credentials or live provider calls.",
  },
  {
    id: 2,
    title: "Legacy factor calculator",
    icon: Calculator,
    description:
      "A temporary deterministic fallback exposes normalized units, factors, provenance, and warnings.",
  },
  {
    id: 3,
    title: "Lean architecture",
    icon: Database,
    description:
      "The rebuild removes speculative services and prepares for one FastAPI application backed by PostgreSQL.",
  },
];

export const comingSoonData = [
  {
    id: 1,
    title: "Calculation core",
    icon: Calculator,
    description:
      "Versioned factors, explicit assumptions, regression tests, and stable result schemas.",
  },
  {
    id: 2,
    title: "Shipment CSV ingestion",
    icon: FileInput,
    description:
      "Validated uploads, normalized rows, baseline totals, hotspots, and quality warnings.",
  },
  {
    id: 3,
    title: "Supplier evidence",
    icon: FileSearch,
    description:
      "Text-based documents, structured supplier facts, full-text retrieval, and recoverable citations.",
  },
  {
    id: 4,
    title: "Isolated demo workspaces",
    icon: Users,
    description:
      "Signed sessions, tenant-scoped records, quotas, and automatic expiry.",
  },
  {
    id: 5,
    title: "Scenarios and charts",
    icon: BarChart3,
    description:
      "Compare alternatives using a small set of decision-useful visualizations.",
  },
  {
    id: 6,
    title: "Decision report",
    icon: FileText,
    description:
      "Export inputs, methodology, sources, results, deltas, and caveats.",
  },
];

// export const featuresData = {
//     "nzeroesg": {
//         "name": "nZeroesG",
//         "description": "A tool for analyzing and visualizing zeroes in datasets.",
//         "version": "1.0.0",
//         "author": "David Palacios",
//         "license": "",
//         "repository": ""
//     },
//     "nzeroesg-scope3": {
//         "name": "nZeroesG Scope 3",
//         "description": "A tool for analyzing and visualizing Scope 3 emissions data.",
//         "version": "1.0.0",
//         "author": "David Palacios",
//         "license": "MIT",
//         "repository": ""
//     }
// }
