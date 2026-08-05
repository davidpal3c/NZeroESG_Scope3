"use client";

import { motion } from "framer-motion";

import ParticlesContainer from "@/app/components/ParticlesContainer";

interface HeroSectionProps {
  onTry: () => void;
}

export default function HeroSection({ onTry }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[700px] items-center overflow-hidden bg-gradient-to-b from-background via-muted to-card px-6 pt-24">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticlesContainer />
      </div>
      <motion.div
        className="relative z-10 mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Scope 3 prototype rebuild
        </p>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-primary md:text-6xl">
          Traceable freight decisions,{" "}
          <span className="text-accent">grounded in evidence</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-primary">
          NZeroESG is being rebuilt around deterministic calculations, shipment
          data, supplier documents, and transparent sources—not an opaque
          chatbot score.
        </p>
        <button
          onClick={onTry}
          className="mt-10 rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow transition hover:bg-secondary"
        >
          Open the legacy assistant
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Optional and disabled by default during the rebuild.
        </p>
      </motion.div>
    </section>
  );
}
