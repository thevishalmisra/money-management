import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ChatMessage, ExpenseContext } from "../types/chatbot";
import { chatbotService } from "../lib/chatbot";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

interface ChatbotProps {
  expenseContext?: ExpenseContext;
}

export function Chatbot({ expenseContext }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
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
          "👋 Hi! I'm ExpenseBot, your personal finance assistant. I can help you with budgeting advice, expense categorization, savings tips, and analyzing your spending patterns. What would you like to know about your finances?",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

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
      const session = chatbotService.getCurrentSession();
      if (session) {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          content: userMessage,
          role: "user",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      // Show typing indicator
      setTimeout(() => {
        setIsTyping(true);
      }, 100);

      // Send message and get response
      const response = await chatbotService.sendMessage(
        userMessage,
        expenseContext,
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
        "👋 Chat cleared! I'm here to help with any financial questions you have. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    toast({
      title: "Chat Cleared",
      description: "Started a fresh conversation!",
    });
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

  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {[
        "Analyze my spending",
        "Budgeting tips",
        "How to save more?",
        "Categorize expense",
      ].map((action) => (
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                ExpenseBot
                <Badge variant="secondary" className="text-xs">
                  AI Assistant
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your personal finance advisor
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && <QuickActions />}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-purple-500/20">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
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
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-blue-500/20">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about your finances..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI-powered advice • Based on your expense data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
