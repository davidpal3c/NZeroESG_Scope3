"use client"
import Link from "next/link";
import { useRef, useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import HeroSection from "@/app/components/page_components/HeroSection";
import AboutSection from "@/app/components/page_components/AboutSection";
import { featuresData, comingSoonData } from "@/app/lib/data";
import { useRouter } from "next/navigation";

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// import { motion, AnimatePresence } from "framer-motion";

import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import ChatInterface from "@/app/components/chat_ui/ChatInterface";

export default function HomePage() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const openExamplesModal = () => setOpen(true);
  const closeExamplesModal = () => setOpen(false);

  const router = useRouter();

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const navBarLinks = [
      {
          "name": "About",
          "link": "#about",
          "type": "hash"
      },
      {
          "name": "Features",
          "link": "#features",
          "type": "hash"
      },
      {
          "name": "Roadmap",
          "link": "#roadmap",
          "type": "hash"
      },
      {
          "name": "Portal",
          "link": "/dashboard",
          "type": "route"
      }
  ]

  const handleOpenChat = () => {
    setIsChatOpen(true);
    
    setTimeout(() => {
      scrollToChat();
    }, 50); 
  }

  return (
    <>
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm shadow-lg dark:shadow-xl dark:shadow-indigo-600 transition-colors">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="#" className="text-2xl font-bold text-primary tracking-tight">🌱 NZeroESG</a>
          <div className="flex flex-row justify-center items-center space-x-6 text-sm font-medium">
            {navBarLinks.map((item, index) => (
                <div key={index}>
                    {item.type === "hash" ? (
                    <a href={item.link} className="hover:text-secondary text-primary text-[1rem] font-semibold">
                        {item.name}
                    </a>
                    ) : (
                      <button
                        onClick={() => router.push(item.link)}
                        className="hover:text-secondary text-primary text-[1rem] font-semibold cursor-pointer"
                      >
                        {item.name}
                      </button>
                    )}
                </div>
            ))}
            <button
              onClick={handleOpenChat}
              className="hover:text-secondary text-primary text-[1rem] font-semibold cursor-pointer"
            >
              Try
            </button>
            <Link href="/login" className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-secondary text-[1rem] font-semibold">Login</Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* HERO */}
      <HeroSection onScrollToChat={scrollToChat} onTryBtn={handleOpenChat} />

      

      {/* ABOUT SECTION */}
      <AboutSection />
      {/* <section id="about" className="py-24 bg-muted dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h3
              className="text-3xl font-extrabold text-primary mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 4, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
          >
              About NZeroESG
          </motion.h3>

          <motion.p
              className="text-muted-foreground text-md leading-relaxed mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
          >
              <strong>NZeroESG</strong> is a work-in-progress AI system designed to help organizations
              make smarter, more sustainable procurement decisions. With a focus on Scope 3 emissions,
              it turns fragmented supply chain data into actionable insights — all through a conversational interface.
          </motion.p>

          <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-sm max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
          >
              <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-accent mb-2">🌍 Purpose-Driven Procurement</h4>
                  <p className="text-muted-foreground">
                  Empower procurement and logistics teams to understand the carbon impact of their decisions —
                  from vendor selection to shipment modes — using real-time data and agentic AI.
                  </p>
              </div>

              <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-accent mb-2">🤖 Why Agentic AI?</h4>
                  <p className="text-muted-foreground">
                  Our AI isn’t just answering questions — it chooses tools, runs emissions calculations, compares alternatives,
                  tracks memory, and handles fallback logic — making it decision-ready and truly helpful.
                  </p>
              </div>

              <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-accent mb-2">🌱 Built for Real Impact</h4>
                  <p className="text-muted-foreground">
                  From calculating emissions for a 100kg shipment to comparing cloud provider carbon costs,
                  our mission is to make environmental impact analysis as easy as asking a question.
                  </p>
              </div>

              <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-accent mb-2">🚧 In Active Development</h4>
                  <p className="text-muted-foreground">
                  This is an early prototype. Upcoming features include supplier audits, CSV uploads, and ESG compliance checks.
                  Your feedback will help shape what comes next.
                  </p>
              </div>
          </motion.div>
      </div>
      </section> */}


      {/* CHAT PREVIEW SECTION */}


      {/* FEATURES */}
      <section id="features" className="py-20 bg-background">
          <div className="mt-8 mb-16 max-w-6xl mx-auto px-12 text-center">
              <h3 className="text-primary text-2xl font-bold mb-10">What You Can Do Today</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-sm">
                  {featuresData.map((f, index) => {
                  return (
                      <div key={index} className="bg-muted p-6 rounded-lg shadow border border-border hover:border-accent cursor-pointer hover:scale-105 transition-colors transition-transform ease-in-out duration-200">
                      <h4 className="font-semibold mb-2 text-primary font-stretch-110%">{f.icon} {f.title}</h4>
                      <p className="text-muted-foreground">{f.description}</p>
                      </div>
                  );
                  } )}
              </div>
              <div>
                <button onClick={openExamplesModal} className="mt-12 -mb-4 bg-accent dark:bg-muted hover:bg-secondary text-white px-6 py-3 rounded-lg shadow cursor-pointer transition-colors delay-100">
                  See Interaction Examples
                </button>
                <Modal
                  open={open}
                  onClose={closeExamplesModal}
                  aria-labelledby="modal-examples-title"
                  aria-describedby="modal-examples-description"
                  closeAfterTransition
                  keepMounted
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '90%',
                      maxWidth: '600px',
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      p: 0,
                    }}
                  >
                    <div className="rounded-3xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl animate-fade-in">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/20 px-6 py-4">
                        <div className="flex items-center justify-start space-x-2">
                          <SmsRoundedIcon className="h-6 w-6 text-primary mb-2" />
                          <h2 id="modal-examples-title" className="text-lg font-bold text-primary">Interaction Examples</h2>
                        </div>
                        <p className="text-sm text-primary mt-1">Here's how to interact with the AI Assistant.</p>
                      </div>

                      {/* Body */}
                      <div className="p-6 space-y-4 text-sm text-muted-foreground bg-background">
                        <div className="bg-muted rounded-xl p-4 border border-border">
                          <strong className="text-primary">"What’s the carbon footprint of a 100kg shipment from Toronto to Vancouver by air?"</strong>
                          <p className="mt-1">→ Calculates emissions using real logistics APIs.</p>
                        </div>
                        <div className="bg-muted rounded-xl p-4 border border-border">
                          <strong className="text-primary">"Compare emissions between plane and ship for 2 tons over 5000km."</strong>
                          <p className="mt-1">→ Returns a side-by-side breakdown with fallback values if needed.</p>
                        </div>
                        <div className="bg-muted rounded-xl p-4 border border-border">
                          <strong className="text-primary">"Find suppliers in Canada that support carbon offset programs for this shipment."</strong>
                          <p className="mt-1">→ Uses smart RAG retrieval from your supplier vector database.</p>
                        </div>
                        <div className="bg-muted rounded-xl p-4 border border-border">
                          <strong className="text-primary">"What’s the best vendor for low carbon + cost within 5 days delivery?"</strong>
                          <p className="mt-1">→ Compares vendors based on your criteria and provides a ranked list.</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 flex justify-end bg-background border-t border-border">
                        {open && (
                          <button
                            onClick={closeExamplesModal}
                            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-secondary transition"
                          >
                            Got it
                          </button>
                        )}
                      </div>
                    </div>
                  </Box>
                </Modal>
                
              </div>
          </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="py-24 bg-gradient-to-bl from-background via-muted to-background text-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold mb-16 text-center tracking-tight">
            Roadmap — What’s Coming Next
          </h3>

          <div className="relative">
            {/* Center line for larger screens */}
            <div className="hidden md:block absolute left-1/2 top-0 h-full w-[2px] bg-border z-0 transform -translate-x-1/2"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 z-10 relative">
              {comingSoonData.map((item, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`relative flex items-start gap-4 ${
                      isLeft ? "md:justify-end pr-4 md:pr-12" : "md:pl-12"
                    }`}
                  >
                    {/* Dot */}
                    {/* <div className="absolute left-1/2 top-2 transform -translate-x-1/2 md:-translate-x-1/2 z-20">
                      <div className="w-4 h-4 rounded-full bg-accent border-4 border-background shadow-md"></div>
                    </div> */}

                    {/* Card */}
                    <div className="mt-8 bg-muted w-full md:max-w-md p-6 rounded-lg shadow-lg border border-border transition-all hover:shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <item.icon />
                        <h4 className="text-lg font-semibold mb-1">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile vertical line (optional) */}
            <div className="md:hidden mt-12 w-1 bg-border mx-auto h-[95%] rounded"></div>
          </div>

          <div className="mt-20 text-center text-sm text-muted-foreground">
            We're actively building and iterating with your feedback. Expect new tools, dashboards, and APIs rolling out through 2025.
          </div>
        </div>
      </section>

            {/* <main className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6 transition-colors">
          <h2 className="text-2xl font-bold text-card-foreground mb-4">
            Welcome to NZeroESG
          </h2>
          <p className="text-muted-foreground mb-4">
            This is a test paragraph to see if the dark mode is working properly. 
            The background should change when you toggle between light and dark modes.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded transition-colors">
              <span className="text-[var(--primary)]">Test card 1 - Using custom properties</span>
            </div>
            <div className="p-3 bg-background rounded transition-colors">
              <span className="text-[var(--accent)]">Test card 2 - Using Tailwind classes</span>
            </div>
            <div className="p-3 bg-background rounded transition-colors">
              <span className="text-primary">Test card 3 - Traditional Tailwind dark mode</span>
            </div>
          </div>  
        </div>
      </main> */}
      <div>
        <ChatInterface initialOpen={isChatOpen} onOpenChange={setIsChatOpen} />
      </div>
      
      {/* FOOTER */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} NZeroESG · Made for sustainable supply chains
      </footer>
    </>
  );
}
