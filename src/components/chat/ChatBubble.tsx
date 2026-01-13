import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, Code, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface QueryResult {
  [key: string]: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  explanation?: string;
  results?: QueryResult[] | null;
  resultsError?: string | null;
  type?: "query" | "summary" | "declined" | "error";
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm MercatoMind's AI assistant. Ask me about products, sales, inventory, or any store analytics. I can also generate SQL queries for you!",
      type: "summary",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: input.trim(),
            conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.explanation || "Here's what I found:",
        sql: data.sql,
        explanation: data.explanation,
        results: data.results,
        resultsError: data.resultsError,
        type: data.type,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Sorry, something went wrong. Please try again.",
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderResults = (results: QueryResult[]) => {
    if (!results || results.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic">No results found</div>
      );
    }

    const columns = Object.keys(results[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              {columns.slice(0, 5).map((col) => (
                <th key={col} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              {columns.length > 5 && (
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">...</th>
              )}
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b border-border/30 last:border-0">
                {columns.slice(0, 5).map((col) => (
                  <td key={col} className="px-2 py-1.5 text-foreground max-w-[120px] truncate">
                    {formatValue(row[col])}
                  </td>
                ))}
                {columns.length > 5 && (
                  <td className="px-2 py-1.5 text-muted-foreground">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {results.length > 10 && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Showing 10 of {results.length} results
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            isOpen && "rotate-90"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[480px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">MercatoMind AI</h3>
                <p className="text-xs text-muted-foreground">Ask about your store data</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[480px] p-4" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* SQL Display */}
                      {message.sql && (
                        <div className="mt-3 rounded-lg bg-background/80 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Code className="h-3.5 w-3.5" />
                            <span>SQL Query</span>
                          </div>
                          <pre className="overflow-x-auto text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                            {message.sql}
                          </pre>
                        </div>
                      )}

                      {/* Results Display */}
                      {message.type === "query" && (
                        <div className="mt-3 rounded-lg bg-background/80 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Database className="h-3.5 w-3.5" />
                            <span>Results</span>
                          </div>
                          {message.resultsError ? (
                            <div className="text-sm text-destructive">{message.resultsError}</div>
                          ) : message.results ? (
                            renderResults(message.results)
                          ) : (
                            <div className="text-sm text-muted-foreground italic">No data available</div>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t bg-background/50 p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about products, sales, inventory..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-muted-foreground/20 bg-muted/50 px-4"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Only answers store-related questions
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
