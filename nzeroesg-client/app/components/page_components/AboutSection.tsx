"use client";

import { BarChart3, FileCheck2, Route, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const principles = [
  {
    title: "Grounded by design",
    description:
      "Answers preserve artifact, document, page, and chunk provenance instead of turning generated prose into a supplier fact.",
    icon: Route,
  },
  {
    title: "Evaluated retrieval",
    description:
      "Lexical, pgvector semantic, and hybrid search are compared against representative questions to tune routing and ranking.",
    icon: FileCheck2,
  },
  {
    title: "Tools own the numbers",
    description:
      "Typed deterministic services own calculations, scenarios, citations, and chart data while the agent retrieves and explains.",
    icon: BarChart3,
  },
  {
    title: "Product-shaped, not SaaS-sized",
    description:
      "A small control plane, one embed path, and one connector prove the product thesis without billing, RBAC, or integration sprawl.",
    icon: Wrench,
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-muted px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-5 text-3xl font-extrabold text-primary">
            What CarbonSage is proving
          </h2>
          <p className="leading-7 text-muted-foreground">
            A useful agent needs more than a chat box. CarbonSage combines
            recoverable evidence, evaluated retrieval, deterministic tools, and
            structured interaction inside a focused Scope 3 workflow.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((principle, index) => (
            <motion.article
              key={principle.title}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
            >
              <principle.icon className="mb-4 h-7 w-7 text-accent" />
              <h3 className="mb-2 text-lg font-semibold text-primary">
                {principle.title}
              </h3>
              <p className="leading-6 text-muted-foreground">
                {principle.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
