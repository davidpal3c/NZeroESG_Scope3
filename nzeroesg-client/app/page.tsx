"use client"
import Link from "next/link";
import { useRef } from "react";

export default function Home() {
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-700">🌱 NZeroESG</h1>
        <div className="space-x-4">
          <Link href="#about">
            <span className="text-gray-700 hover:text-green-700 cursor-pointer">About</span>
          </Link>
          <Link href="/login">
            <button className="bg-green-600 text-white px-4 py-2 rounded">Login</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Empower Your Procurement with <span className="text-green-700">AI-Driven Sustainability</span>
        </h2>
        <p className="max-w-xl mx-auto text-gray-600 text-lg mb-8">
          NZeroESG helps you track and reduce carbon emissions across suppliers and shipments — 
          interactively and intelligently. Make procurement decisions that are both eco-conscious and cost-effective.
        </p>
        <button
          onClick={scrollToChat}
          className="bg-green-700 text-white px-6 py-3 rounded hover:bg-green-800"
        >
          Try the Chatbot
        </button>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">What Can It Do?</h3>
          <p className="text-gray-600 text-md leading-relaxed">
            🟢 Calculate real-time CO₂ emissions from shipping, procurement, and logistics.<br />
            🧠 Use an intelligent chatbot to get greener alternatives for your shipments.<br />
            📉 Visualize emission reductions with easy-to-understand comparisons.<br />
            🔁 Track and compare suppliers by region, emission profile, or transport mode.<br />
            🌍 Built with Agentic AI, FastAPI, LangChain, and real emission APIs like Climatiq and Carbon Interface.
          </p>
        </div>
      </section>

      {/* Placeholder for Chat Section */}
      <section ref={chatRef} className="min-h-[500px] bg-gray-100 p-8">
        <h4 className="text-xl font-semibold text-gray-700 text-center mb-4">Chat Assistant (Coming Below)</h4>
        {/* Later insert <ChatWindow /> or full chatbot SPA here */}
        <div className="text-center text-gray-400 italic">[ Chatbot will appear here ]</div>
      </section>
    </div>
  );
}
