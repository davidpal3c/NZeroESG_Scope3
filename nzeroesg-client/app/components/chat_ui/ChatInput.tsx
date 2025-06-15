// TODO: add validation for input

import { useRef, useState, useEffect } from 'react';


interface ChatInputProps {
    sendMessage: (message: string) => void;
    disabled?: boolean;
}

export default function ChatInput({ sendMessage, disabled }: ChatInputProps) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState<string>('');
    
    const handleSend = () => {
        if (input.trim() && !disabled) {
            sendMessage(input); 
            setInput('');

            // TODO: add scroll to bottom of chat

            setTimeout(() => {
                if (textAreaRef.current) {
                    textAreaRef.current.style.height = 'auto';
                    textAreaRef.current.focus();
                }
            }, 0);
        }   
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSend();

            setTimeout(() => {
                textAreaRef.current?.focus();
            }, 0);
        }
    }

    // recalculate height of textarea when input changes
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; 
        }
    }, [input]);        


    return(
        <div className="p-3 border-t bg-white flex items-center gap-2">
            <textarea
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about emissions..."
                disabled={disabled}         
                rows={1}
                // className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                className="flex-1 px-3 py-2 text-sm text-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none overflow-hidden max-h-32"
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || disabled}        // Disable button if input is empty or disabled prop is true
                // className="px-4 py-2 text-sm bg-gradient-to-tr from-green-500 to-emerald-500 text-white rounded-lg hover:bg-green-800 transition"
                className="px-4 py-2 text-sm bg-gradient-to-tr from-green-500 to-emerald-500 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
            <div>
                <span></span>
                <span></span>
            </div>
        </div>
    );
}