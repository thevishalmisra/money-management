import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Search,
  DollarSign,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ChatMessage, ExpenseContext } from "../types/chatbot";
import { chatbotService } from "../lib/chatbot";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

interface FloatingChatbotProps {
  expenseContext?: ExpenseContext;
}

export function FloatingChatbot({ expenseContext }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"finance" | "search">("finance");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Load existing session or create new one
      const session = chatbotService.getCurrentSession();
      if (session) {
        setMessages(session.messages.filter((msg) => !msg.isTyping));
      }

      // Add welcome message if no messages
      if (!session || session.messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          content:
            "👋 Hi! I'm your AI assistant! I can help with:\n\n💰 **Finance Mode**: Budgeting, expense tracking, financial advice\n🔍 **Search Mode**: General knowledge, questions about anything\n\nWhat would you like to know?",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add user message to UI immediately
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        content: userMessage,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Show typing indicator
      setTimeout(() => {
        setIsTyping(true);
      }, 100);

      // Send message and get response (with search mode flag)
      const response = await chatbotService.sendMessage(
        userMessage,
        activeTab === "finance" ? expenseContext : undefined,
        activeTab === "search",
      );

      // Update messages with the response
      setIsTyping(false);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    chatbotService.clearCurrentSession();
    setMessages([]);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome-" + Date.now(),
      content:
        "👋 Chat cleared! Ready to help with finance or general questions. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-3 text-muted-foreground">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-purple-500/20">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    </div>
  );

  const QuickActions = () => {
    const financeActions = [
      "Analyze my spending",
      "Budgeting tips",
      "How to save more?",
      "Categorize expense",
    ];

    const searchActions = [
      "What's the weather like?",
      "Latest tech news",
      "Explain quantum physics",
      "Healthy recipes",
    ];

    const actions = activeTab === "finance" ? financeActions : searchActions;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {actions.map((action) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            onClick={() => setInputValue(action)}
            className="text-xs bg-white/5 border-white/20 hover:bg-white/10"
            disabled={isLoading}
          >
            {action}
          </Button>
        ))}
      </div>
    );
  };

  // Floating button when closed
  if (!isOpen) {
    console.log("FloatingChatbot: Rendering floating button");
    return (
      <div className="fixed bottom-6 right-6 z-50" style={{ zIndex: 9999 }}>
        <Button
          onClick={() => {
            console.log("FloatingChatbot: Button clicked, opening chatbot");
            setIsOpen(true);
          }}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-pulse border-2 border-white/20"
        >
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-500/20">
          <CardHeader
            className="p-4 cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <span className="font-medium">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Full chatbot interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[600px] flex flex-col bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border-purple-500/20 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  AI Assistant
                  <Badge variant="secondary" className="text-xs">
                    {activeTab === "finance" ? "Finance" : "Search"}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "finance"
                    ? "Personal finance advisor"
                    : "General knowledge assistant"}
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Mode Tabs */}
          <div className="p-3 border-b bg-muted/30">
            <Tabs
              value={activeTab}
              onValueChange={(value: any) => setActiveTab(value)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="finance" className="text-xs gap-1">
                  <DollarSign className="h-3 w-3" />
                  Finance
                </TabsTrigger>
                <TabsTrigger value="search" className="text-xs gap-1">
                  <Search className="h-3 w-3" />
                  Search
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && <QuickActions />}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="bg-purple-500/20">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-purple-500 text-white ml-auto"
                        : "bg-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="bg-blue-500/20">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-muted/30">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  activeTab === "finance"
                    ? "Ask about finances..."
                    : "Search anything..."
                }
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              {activeTab === "finance"
                ? "AI financial advice"
                : "AI-powered search"}{" "}
              • Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
