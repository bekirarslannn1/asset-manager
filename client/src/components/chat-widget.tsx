import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem("chat_session_id");
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem("chat_session_id", sessionId);
  }
  return sessionId;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getOrCreateSessionId();

  // Fetch chat history
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${sessionId}`],
    enabled: isOpen,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", "/api/chat", {
        message: messageText,
        sessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
      setMessage("");
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-40 rounded-full p-3 transition-all duration-300",
          "bg-card border border-border text-foreground shadow-lg hover-elevate",
          "hover:bg-muted"
        )}
        data-testid="button-chat-widget"
        aria-label="Sohbet aç"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-16 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]",
            "bg-card border border-border rounded-lg shadow-2xl",
            "flex flex-col h-96"
          )}
          data-testid="chat-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-card to-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" style={{ color: "#39FF14" }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Yardım Merkezi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nasıl yardımcı olabilirim?
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              data-testid="button-chat-close"
              aria-label="Sohbeti kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            data-testid="chat-messages-container"
          >
            {messages.length === 0 && !sendMutation.isPending && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Merhaba! Ben AI asistanınız.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size nasıl yardımcı olabilirim?
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
                data-testid={`message-${msg.role}-${index}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#39FF14]/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3" style={{ color: "#39FF14" }} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-xs px-3 py-2 rounded-lg text-sm",
                    msg.role === "user"
                      ? "bg-[#39FF14] text-black font-medium"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div
                className="flex gap-2 justify-start"
                data-testid="typing-indicator"
              >
                <div className="w-6 h-6 rounded-full bg-[#39FF14]/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3" style={{ color: "#39FF14" }} />
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSend}
            className="border-t border-border p-4 bg-muted/30"
            data-testid="chat-form"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                disabled={sendMutation.isPending}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border border-border bg-card",
                  "text-sm text-foreground placeholder-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-[#39FF14]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || sendMutation.isPending}
                className="bg-[#39FF14] text-black hover:bg-[#33DD0C] font-medium"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
