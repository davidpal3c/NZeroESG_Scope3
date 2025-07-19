import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import { timeStamp } from 'console';
import { Message } from "@/app/types/chat"
import ChatInput from './ChatInput';
import { getBackendUrl } from '@/app/api/urls'; // Adjust the import path as needed
import { LoadingIndicator } from './LoadingIndicator';


// interface Message {
//     id: string;
//     role: "user" | "agent";
//     content: string;
//     timestamp: Date;
//     // interactive?: InteractiveMessage;
// }

interface ChatInterfaceProps {
    initialOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

// export default function ChatBox({ apiUrl }: { apiUrl: string })
export default function ChatInterface({ initialOpen = false, onOpenChange }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
    {
        id: "1",
        content:
            "Welcome to NZeroESG! 🌱 I'm your advanced emissions intelligence assistant. I can analyze carbon data, provide sustainability insights, and help you build a greener future. What would you like to explore today?",
        role: "agent" as const,
        timestamp: new Date(),
        interactive: {
            type: "quick_replies",
            options: [
            { id: "analyze", label: "📊 Analyze Emissions", value: "I want to analyze my carbon emissions data" },
            { id: "reduce", label: "🎯 Reduction Strategies", value: "Show me ways to reduce carbon footprint" },
            { id: "report", label: "📋 Generate Report", value: "Help me create a sustainability report" },
            { id: "calculate", label: "🧮 Calculate Footprint", value: "Calculate carbon footprint for my activities" },
            ],
        },
    }])

    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);                
    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (message: string) => {
        const newMessages = [...messages, { 
            id: (Date.now() + Math.random()).toString(),
            content: message, 
            role: 'user' as const, 
            timestamp: new Date() 
        }];

        setMessages(newMessages);     
        setIsLoading(true);

        try {
            // debugging 
            const resolvedUrl = `${getBackendUrl()}/chat`;
            console.log("Final Axios Target:", resolvedUrl);
            
            const response = await axios.post(
                resolvedUrl,
                { message },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );  

            const data = await response.data;

            const agentMessage: Message = {
                id: (Date.now() + Math.random()).toString(),
                content: data.reply.output || "No response from server",
                role: 'agent' as const,
                timestamp: new Date(),
            };

            // TODO: change for server-side timestamp
            // data.timestamp =             
            console.log('Response from server:', data);
            setMessages([...newMessages, agentMessage]);
        
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
                role: "agent",
                timestamp: new Date(),
                isError: true,
            }
            
            setMessages([...newMessages, errorMessage]);
            throw new Error('Failed to send message. ChatBox.tsx');
        } finally {
            setIsLoading(false);
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const handleToggleChat = (newState: boolean) => {
        setIsOpen(newState);
        onOpenChange?.(newState);        
    };

    useEffect(() => {
        setIsOpen(initialOpen)
    }, [initialOpen])

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading])

    // debugging 
    // useEffect(() => {
    //     const backend = getBackendUrl();
    //     console.log("Final Backend URL:", backend);
    //     if (!backend.startsWith("https://")) {
    //         alert("backend starts with http://");
    //     }
    // }, []);

    return (
    <div>
      {isOpen ? (
        <div
            ref={chatRef}
            className="fixed bottom-4 right-4 w-9/12 max-w-full h-[45rem] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 flex flex-col  overflow-hidden z-50 animate-fade-in">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-5 rounded-t-3xl">
                <div className="flex items-center justify-between">
                    <div className="justify-items-start">
                        <h3 className="text-primary font-semibold text-lg ">AI Assistant</h3>
                        <p className="text-primary text-sm">Real-time emissions intelligence</p>
                    </div>
                    <div className="flex items-center justify-between w-22 gap-2">
                        <div className='flex items-center gap-1 text-primary'>
                            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                            <span className="text-primary text-xs">Online</span>
                        </div>
                        <div className='flex justify-end'>
                            <button onClick={() => handleToggleChat(false)} className="text-primary hover:text-green-500 transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-transparent text-sm">
                {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.role === 'user'
                        ? 'bg-indigo-200 text-right'
                        : 'bg-emerald-200 text-left'
                    }`}
                    >
                        <strong className="block text-gray-800 text-xs mb-1">
                            {msg.role === 'user' ? 'You' : 'Agent'}
                        </strong>
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                        <div className="text-xs text-slate-700 opacity-60 mt-2">
                            {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            })}
                        </div>
                    </div>
                </div>
                ))}
                 {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef}></div>
            </div>

            <ChatInput sendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      ) : (
        <button
          onClick={() => handleToggleChat(true)}
          className="group fixed bottom-4 right-4 z-50 p-4 bg-accent text-white rounded-full shadow-lg border border-green-700 hover:bg-tertiary transition"
        >
          <EnergySavingsLeafIcon className="text-white text-2xl group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}

