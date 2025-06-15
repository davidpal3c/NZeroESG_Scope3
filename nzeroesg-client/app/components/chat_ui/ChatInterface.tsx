import { useState, useRef } from 'react';
import axios from 'axios';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
// import { Message } from "@/app/types/chat"


interface Message {
    role: "user" | "agent";
    content: string;
    // timestamp: Date
}

// export default function ChatBox({ apiUrl }: { apiUrl: string })
export default function ChatInterface() {
    const [messages, setMessages ] = useState<Message[]>([
        {
            role: "agent" as const,
            content: "Welcome to NZeroESG! 🌱 I'm your advanced emissions intelligence assistant. I can analyze carbon data, provide sustainability insights, and help you build a greener future. What would you like to explore today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [ chatOpen, setChatOpen ] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    const sendMessage = async () => {
        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput('');
        
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
                    { input },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );  

            const data = await response.data;

            // TODO: change for server-side timestamp
            // data.timestamp = 
            
                
            console.log('Response from server:', data);
            setMessages([...newMessages, { role: 'agent' as const, content: data.reply.output }])
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages([...newMessages, { role: 'agent' as const, content: 'Failed to send message.' }]);
            throw new Error('Failed to send message. ChatBox.tsx');
        }
    }

    const toggleChat = () => {
        setChatOpen(!chatOpen);
    };

    return (
    <div>
      {chatOpen ? (
        <div
            ref={chatRef}
            className="fixed bottom-4 right-4 w-8/12 max-w-full h-[35rem] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 flex flex-col  overflow-hidden z-50 animate-fade-in">
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
                    <button onClick={toggleChat} className="text-primary hover:text-green-500 transition-colors cursor-pointer">
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
                      ? 'bg-blue-100 text-right'
                      : 'bg-green-100 text-left'
                  }`}
                >
                    <strong className="block text-gray-700 text-xs mb-1">
                        {msg.role === 'user' ? 'You' : 'Agent'}
                    </strong>
                    <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* <div className="text-xs opacity-60 mt-2 border border-red-600">
                        {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        })}
                    </div> */}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about emissions..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 text-sm bg-gradient-to-tr from-green-500 to-emerald-500 text-white rounded-lg hover:bg-green-800 transition"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className="group fixed bottom-4 right-4 z-50 p-4 bg-accent text-white rounded-full shadow-lg border border-green-700 hover:bg-tertiary transition"
        >
          <EnergySavingsLeafIcon className="text-white text-2xl group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}

