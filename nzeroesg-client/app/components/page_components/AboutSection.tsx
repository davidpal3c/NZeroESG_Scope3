"use client";

import { BarChart3, FileCheck2, Route, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const principles = [
  {
    title: "Deterministic first",
    description:
      "Unit conversion, factors, calculations, filters, and report data remain inspectable and testable without an LLM.",
    icon: Route,
  },
  {
    title: "Evidence over claims",
    description:
      "Supplier facts will link back to uploaded documents and recoverable source locations.",
    icon: FileCheck2,
  },
  {
    title: "Decision-ready output",
    description:
      "The target workflow ends with scenarios, useful charts, caveats, and an exportable report.",
    icon: BarChart3,
  },
  {
    title: "Lean by design",
    description:
      "One modular application, a strict cost ceiling, and infrastructure added only when measured needs justify it.",
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
            What this project is becoming
          </h2>
          <p className="leading-7 text-muted-foreground">
            The historical prototype proved that freight tools and
            conversational interaction could be connected. The rebuild focuses
            on making the result credible, maintainable, and genuinely demoable.
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
