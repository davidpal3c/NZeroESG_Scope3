"use client";
import { motion } from "framer-motion";
import ParticlesContainer from "@/app/components/ParticlesContainer";

export default function HeroSection({ onScrollToChat }: { onScrollToChat: () => void }) {
    return(
        <section className="relative h-[700px] pt-72 pb-32 bg-gradient-to-b from-background via-muted to-card overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <ParticlesContainer />
            </div>
            <motion.div 
                className="relative z-10 max-w-4xl mx-auto px-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl text-primary font-extrabold tracking-tight leading-tight mb-4">
                  Sustainable Sourcing Through <span className="text-accent">Agentic AI</span>
              </h2>
              <p className="text-lg text-primary max-w-2xl mx-auto">
                  Track emissions, materials, and vendor compliance across your supply chain —
                  interactively and in real time.
              </p>
              <button onClick={onScrollToChat} className="mt-8 bg-accent dark:bg-muted hover:bg-secondary text-white px-6 py-3 rounded-lg shadow cursor-pointer transition-colors delay-100">
                  Try our Carbon Assistant
              </button>
            </motion.div>
        </section>
    )
}