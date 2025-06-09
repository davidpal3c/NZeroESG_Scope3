"use client"
import Link from "next/link";
import { useRef } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { featuresData, comingSoonData } from "@/app/lib/data"
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

      const navBarLinks = [
        {
            "name": "About",
            "link": "#about"
        },
        {
            "name": "Features",
            "link": "#features"
        },
        {
            "name": "Roadmap",
            "link": "#roadmap"
        },
        {
            "name": "API",
            "link": "#roadmap"
        },
        {
            "name": "Chat",
            "link": "#chat"
        }
    ]

    return (
    <>
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background shadow-lg dark:shadow-xl dark:shadow-indigo-600 transition-colors">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="#" className="text-2xl font-bold text-primary tracking-tight">🌱 NZeroESG</a>
          <div className="flex flex-row justify-center items-center space-x-6 text-sm font-medium">
            {navBarLinks.map((item, index) => (
                <div key={index}>
                    <a href={item.link} className="hover:text-secondary text-primary text-[1rem] font-semibold">
                        {item.name}
                    </a>
                </div>
            ))}
            <Link href="/login" className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-secondary text-secondary text-[1rem] font-semibold">Login</Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>


      {/* HERO */}
      <section className="pt-44 pb-26 bg-gradient-to-b from-background via-muted to-card">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            <p className="text-primary">Sustainable Sourcing Through <span className="text-accent">Agentic AI</span></p>
          </h2>
          <p className="text-lg text-primary max-w-2xl mx-auto">
            Track emissions, materials, and vendor compliance across your supply chain —
            interactively and in real time.
          </p>
          <button onClick={scrollToChat} className="mt-8 bg-accent dark:bg-muted hover:bg-secondary text-white px-6 py-3 rounded-lg shadow cursor-pointer transition-colors delay-100">
            Try our Carbon Assistant
          </button>
        </div>
      </section>


        {/* ABOUT SECTION */}
    <section id="about" className="py-24 bg-muted dark:bg-gray-950 transition-colors">
        <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.h3
                className="text-3xl font-extrabold text-primary mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
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
                    <h4 className="text-lg font-semibold text-accent mb-2">🎯 Our Goal</h4>
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
        </section>


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
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="py-20 bg-gradient-to-bl from-background via-muted to-background">
        <div className="max-w-6xl mx-auto px-12 text-center">
            <div className="justify-items-start">
                <h3 className="text-2xl font-bold mb-10 text-primary ml-8">...Coming Soon</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-sm">
                {comingSoonData.map((c, index) => {
                return(
                    <div key={index} className="bg-secondary-bg p-6 rounded-lg shadow border border-border">
                    <h4 className="font-semibold mb-2 text-secondary">{c.title}</h4>
                    <p className="text-primary">{c.description}</p>
                    </div>
                )
                })}
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

      {/* CHAT PREVIEW SECTION */}
      
      <section id="chat" ref={chatRef} className="py-20 bg-white dark:bg-gray-900 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h3 className="text-2xl font-bold mb-4 text-green-700">Try It Out</h3>
          <p className="text-gray-500 dark:text-gray-300 mb-6">
            This is an early-stage prototype. Expect active development and new tools soon!
          </p>
          <div className="text-gray-400 italic border border-dashed p-12 rounded-lg dark:border-gray-700">
            [ 💬 Chatbot Interface Coming Here Soon ]
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} NZeroESG · Made for sustainable supply chains
      </footer>
    </>
  );
}

//   return (
//     <div className="min-h-screen transition-colors bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100">
//       {/* Navbar */}
//        <nav className="bg-card border-b border-border p-4 flex justify-between items-center transition-colors">
//         <h1 className="text-xl font-bold text-primary">🌱 NZeroESG</h1>
//         <div className="space-x-4 flex items-center">
//           <Link href="#about">
//             <span className="text-primary dark:text-[var(--accent)] hover:text-foreground cursor-pointer transition-colors">
//               About
//             </span>
//           </Link>
//           <Link href="/login">
//             <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
//               Login
//             </button>
//           </Link>
//           <ThemeToggle /> 
//         </div>
//       </nav>
      

//       {/* Hero Section */}
//       <section className="text-center py-20 px-6 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
//         <h2 className="text-4xl font-bold text-gray-800 mb-4">
//           Empower Your Procurement with <span className="text-green-700">AI-Driven Sustainability</span>
//         </h2>
//         <p className="max-w-xl mx-auto text-gray-600 text-lg mb-8">
//           NZeroESG helps you track and reduce carbon emissions across suppliers and shipments — 
//           interactively and intelligently. Make procurement decisions that are both eco-conscious and cost-effective.
//         </p>
//         <button
//           onClick={scrollToChat}
//           className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800"
//         >
//           Try our Agentic Ai Chatbot
//         </button>
//       </section>


//       {/* Content area */}
      // <main className="container mx-auto px-4 py-8">
      //   <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6 transition-colors">
      //     <h2 className="text-2xl font-bold text-card-foreground mb-4">
      //       Welcome to NZeroESG
      //     </h2>
      //     <p className="text-muted-foreground mb-4">
      //       This is a test paragraph to see if the dark mode is working properly. 
      //       The background should change when you toggle between light and dark modes.
      //     </p>
      //     <div className="space-y-2">
      //       <div className="p-3 bg-muted rounded transition-colors">
      //         <span className="text-[var(--primary)]">Test card 1 - Using custom properties</span>
      //       </div>
      //       <div className="p-3 bg-background rounded transition-colors">
      //         <span className="text-[var(--accent)]">Test card 2 - Using Tailwind classes</span>
      //       </div>
      //       <div className="p-3 bg-background rounded transition-colors">
      //         <span className="text-primary">Test card 3 - Traditional Tailwind dark mode</span>
      //       </div>
      //     </div>
      //   </div>
      // </main>

//       {/* About Section */}
//       <section id="about" className="bg-white py-16 px-6">
//         <div className="max-w-4xl mx-auto text-center">
//           <h3 className="text-2xl font-semibold text-gray-800 mb-4">What Can It Do?</h3>
//           <div className="flex justify-center mb-6">
//             <p className="text-gray-600 text-md leading-relaxed justify-items-start">
//               🟢 Calculate real-time CO₂ emissions from shipping, procurement, and logistics.<br />
//               🧠 Use an intelligent chatbot to get greener alternatives for your shipments.<br />
//               📉 Visualize emission reductions with easy-to-understand comparisons.<br />
//               🔁 Track and compare suppliers by region, emission profile, or transport mode.<br />
//               🌍 Built with Agentic AI, FastAPI, LangChain, and real emission APIs like Climatiq and Carbon Interface.
//             </p>

//           </div>
//         </div>
//       </section>

//       {/* Placeholder for Chat Section */}
//       <section ref={chatRef} className="min-h-[500px] bg-gray-100 p-8">
//         <h4 className="text-xl font-semibold text-gray-700 text-center mb-4">Chat Assistant (Coming Below)</h4>
//         {/* Later insert <ChatWindow /> or full chatbot SPA here */}
//         <div className="text-center text-gray-400 italic">[ Chatbot will appear here ]</div>
//       </section>
//     </div>
//   );
// }
