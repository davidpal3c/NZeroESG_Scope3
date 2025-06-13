import { useState } from 'react';
import axios from 'axios';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';

interface Message {
    role: "user" | "agent";
    content: string;
}

// export default function ChatBox({ apiUrl }: { apiUrl: string })
export default function ChatInterface() {
    const [messages, setMessages ] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [ chatOpen, setChatOpen ] = useState(false);

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
            console.log('Response from server:', data);
            setMessages([...newMessages, { role: 'agent' as const, content: data.reply.output}])
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
            { chatOpen ? (
                <div className="fixed bottom-4 right-4 z-50 w-96 bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden text-sm">
                    <div className='bg-gray-100 border-b border-gray-300 flex items-center justify-between'>
                        <div></div>
                        <div className="p-3 font-semibold">Carb0n Ai Assistant</div>
                        <div className='flex justify-end p-2'>
                            <button onClick={toggleChat} className="text-gray-500 hover:text-green-500 transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="h-64 overflow-y-auto px-3 py-2 space-y-2 text-gray-800">
                        {messages.map((msg, idx) => (
                        <div key={idx} className={`text-${msg.role === "user" ? "right" : "left"}`}>
                            <p className={`p-2 rounded ${msg.role === "user" ? "bg-blue-100" : "bg-green-100"}`}>
                            <strong>{msg.role === "user" ? "You" : "Agent"}:</strong> {msg.content}
                            </p>
                        </div>
                        ))}
                    </div>
                    <div className="border-t flex">
                        <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 p-2 text-sm border-r outline-none"
                        placeholder="Ask about emissions..."
                        />
                        <button onClick={sendMessage} className="bg-green-600 text-white px-4 text-sm">
                        Send
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={toggleChat} 
                    className="group fixed bottom-4 right-4 z-50 bg-background p-3 rounded-full shadow-lg transition-colors
                    border border-border hover:bg-accent hover:border-primary focus:ring-offset-2 cursor-pointer"
                >
                    <EnergySavingsLeafIcon className="text-accent text-2xl transition-colors group-hover:text-white" />
                </button>
            )}x
        </div>
    );
}

