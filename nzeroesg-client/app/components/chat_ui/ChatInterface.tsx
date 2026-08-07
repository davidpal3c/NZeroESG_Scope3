import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Leaf } from "lucide-react";

import { getBackendUrl } from "@/app/api/urls";
import { ApiError, ChatResponse, Message } from "@/app/types/chat";
import ChatInput from "./ChatInput";
import { LoadingIndicator } from "./LoadingIndicator";

interface ChatInterfaceProps {
  initialOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

type AssistantStatus = "checking" | "available" | "disabled" | "unreachable";

const statusLabels: Record<AssistantStatus, string> = {
  checking: "Checking",
  available: "Available",
  disabled: "Disabled",
  unreachable: "Unavailable",
};

export default function ChatInterface({
  initialOpen = false,
  onOpenChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "agent-preview-introduction",
      content:
        "This preview can estimate and compare freight emissions when a model provider is configured. The workspace already supports shipment data, supplier evidence, citations, scenarios, and reports; the next CarbonSage agent will connect those capabilities through grounded retrieval and typed tools.",
      role: "agent" as const,
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [assistantStatus, setAssistantStatus] =
    useState<AssistantStatus>("checking");
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string) => {
    const newMessages = [
      ...messages,
      {
        id: (Date.now() + Math.random()).toString(),
        content: message,
        role: "user" as const,
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const resolvedUrl = `${getBackendUrl()}/chat`;
      const response = await axios.post<ChatResponse>(
        resolvedUrl,
        { message },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const agentMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        content:
          response.data.reply || "The assistant returned an empty response.",
        role: "agent" as const,
        timestamp: new Date(),
        metadata: {
          processingTime: response.data.processing_time_ms,
        },
      };

      setMessages([...newMessages, agentMessage]);
    } catch (error) {
      const detail = axios.isAxiosError<ApiError>(error)
        ? error.response?.data?.detail
        : undefined;

      if (axios.isAxiosError(error) && error.response?.status === 503) {
        setAssistantStatus("disabled");
      }

      const errorMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        content:
          detail ??
          "The agent preview is unavailable. CarbonSage's deterministic workspace and evidence workflow does not depend on it.",
        role: "agent",
        timestamp: new Date(),
        isError: true,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleChat = (newState: boolean) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get<{ status: string; assistant_enabled: boolean }>(
        `${getBackendUrl()}/chat/health`,
        {
          signal: controller.signal,
          timeout: 5_000,
        },
      )
      .then((response) => {
        setAssistantStatus(
          response.data.assistant_enabled ? "available" : "disabled",
        );
      })
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setAssistantStatus("unreachable");
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const inputDisabled = isLoading || assistantStatus !== "available";
  const inputPlaceholder =
    assistantStatus === "checking"
      ? "Checking assistant availability..."
      : assistantStatus === "available"
        ? "Ask about a freight estimate..."
        : "Agent preview is not available";

  return (
    <div>
      {isOpen ? (
        <div
          ref={chatRef}
          className="fixed bottom-4 right-4 w-9/12 max-w-full h-[45rem] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 flex flex-col  overflow-hidden z-50 animate-fade-in"
        >
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-5 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="justify-items-start">
                <h3 className="text-primary font-semibold text-lg">
                  CarbonSage agent preview
                </h3>
                <p className="text-primary text-sm">
                  Current estimator · grounded workspace agent next
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-primary">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      assistantStatus === "available"
                        ? "bg-green-400"
                        : assistantStatus === "checking"
                          ? "animate-pulse bg-amber-400"
                          : "bg-slate-400"
                    }`}
                  />
                  <span className="text-primary text-xs">
                    {statusLabels[assistantStatus]}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleToggleChat(false)}
                    className="text-primary hover:text-green-500 transition-colors cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-transparent text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-200 text-right"
                      : "bg-emerald-200 text-left"
                  }`}
                >
                  <strong className="block text-gray-800 text-xs mb-1">
                    {msg.role === "user" ? "You" : "Agent"}
                  </strong>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  <div className="text-xs text-slate-700 opacity-60 mt-2">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.metadata?.processingTime !== undefined &&
                      ` · ${msg.metadata.processingTime} ms`}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef}></div>
          </div>

          <ChatInput
            sendMessage={handleSendMessage}
            disabled={inputDisabled}
            placeholder={inputPlaceholder}
          />
        </div>
      ) : (
        <button
          onClick={() => handleToggleChat(true)}
          className="group fixed bottom-4 right-4 z-50 p-4 bg-accent text-white rounded-full shadow-lg border border-green-700 hover:bg-tertiary transition"
        >
          <Leaf className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
        </button>
      )}
    </div>
  );
}
