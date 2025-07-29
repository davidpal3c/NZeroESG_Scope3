"use client";

import { motion } from "framer-motion";
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';

export default function AboutSection() {
    const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            viewport={{ once: true, amount: 0.3 }}
        >
            {children}
        </motion.div>
    );

    return (
        <section id="about" className="py-24 bg-muted dark:bg-gray-950 transition-colors">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <FadeInWhenVisible>
                    <h2 className="text-3xl font-extrabold text-primary mb-6">
                        About NZeroESG
                    </h2>
                </FadeInWhenVisible>

                <FadeInWhenVisible delay={0.1}>
                    <p className="text-muted-foreground text-md leading-relaxed mb-10 max-w-3xl mx-auto">
                    <strong>NZeroESG</strong> is an AI-powered sustainability assistant designed to support
                    enterprise procurement and supply chain teams. It transforms fragmented emissions data into
                    real-time, conversational insights — helping you make environmentally responsible, economically
                    sound decisions.
                    </p>
                </FadeInWhenVisible>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-sm max-w-4xl mx-auto">
                    <FadeInWhenVisible delay={0.2}>
                        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                            <div className="flex flex-row mb-2">
                                <PublicRoundedIcon sx={{ fontSize: 34, color: 'var(--tertiary)' }}/> 
                                <h4 className="ml-1 text-lg font-semibold text-accent mb-2">Purpose-Driven Procurement</h4>
                            </div>
                            <p className="text-muted-foreground">
                            From vendor selection to shipment methods, NZeroESG makes Scope 3 carbon intelligence
                            actionable and accessible through structured tools and AI reasoning. Every procurement decision
                            becomes an opportunity to reduce emissions.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={0.3}>
                        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                            <div className="flex flex-row mb-2">
                                <PsychologyRoundedIcon sx={{ fontSize: 34, color: 'var(--tertiary)' }}/> 
                                <h4 className="ml-1 text-lg font-semibold text-accent mb-2">Agentic AI at Work</h4>
                            </div>
                            <p className="text-muted-foreground">
                            This isn’t just a really cool embeddable chatbot. The system uses LangChain’s ReAct framework to reason,
                            select tools, query real-time emissions APIs, and compare transport or supplier options —
                            all while caching, handling fallback logic, and learning from context.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={0.4}>
                        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                            <div className="flex flex-row mb-2">
                                <InsightsRoundedIcon sx={{ fontSize: 34, color: 'var(--tertiary)' }}/> 
                                <h4 className="ml-1 text-lg font-semibold text-accent mb-2">Real-Time Insights</h4>
                            </div>
                            <p className="text-muted-foreground">
                            Upcoming features include CSV/Excel import for purchase orders, procurement simulation,
                            ESG policy reasoning via vector search (RAG), vendor compliance checks, and its own management portal — 
                            all designed to turn environmental reporting into proactive business decisions.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={0.5}>
                        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                            <div className="flex flex-row mb-2">
                                <HandymanRoundedIcon sx={{ fontSize: 32, color: 'var(--tertiary)' }}/>  
                                <h4 className="ml-2 text-lg font-semibold text-accent mb-2">Under Construction - Actively Evolving</h4>
                            </div>
                            <p className="text-muted-foreground">
                            This is an active prototype. Your feedback helps prioritize roadmap features like
                            real-time benchmarking, anomaly detection, and end-to-end emissions tracking pipelines.
                            <strong> We’re committed to making sustainability a core part of procurement workflows.</strong>
                            {/* <strong>Join us on this journey to make procurement more sustainable.</strong> */}
                            </p>
                        </div>
                    </FadeInWhenVisible>
                </div>
            </div>
        </section>
    );
}
