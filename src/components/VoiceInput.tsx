import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { speechService } from "../lib/speech";
import { VoiceRecognitionResult, ExpenseCategory } from "../types/expense";
import { cn } from "../lib/utils";

interface VoiceInputProps {
  onResult: (result: VoiceRecognitionResult) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onResult, onError, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceRecognitionResult | null>(
    null,
  );

  useEffect(() => {
    setIsSupported(speechService.isSupported_());
  }, []);

  const startListening = async () => {
    if (!isSupported || disabled) return;

    try {
      setIsListening(true);
      setLastResult(null);

      const result = await speechService.startListening();
      setLastResult(result);
      onResult(result);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Voice recognition failed",
      );
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="text-center text-muted-foreground">
          <MicOff className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">
            Voice recognition is not supported in this browser
          </p>
          <p className="text-xs mt-1">Try using Chrome, Edge, or Safari</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "p-6 transition-all duration-300",
          isListening &&
            "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30",
        )}
      >
        <div className="text-center space-y-4">
          <div className="relative">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              size="lg"
              className={cn(
                "relative h-16 w-16 rounded-full transition-all duration-300",
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse-gentle"
                  : "bg-purple-500 hover:bg-purple-600",
              )}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>

            {isListening && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">
              {isListening ? "Listening..." : "Voice Input"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isListening
                ? "Speak clearly about your expense"
                : "Click the microphone and describe your expense"}
            </p>
          </div>

          {isListening && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 bg-purple-500 rounded-full animate-pulse",
                      "h-8 animation-delay-" + i * 100,
                    )}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {lastResult && (
        <Card className="p-4 animate-slide-up">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Recognition Result
              </h4>
              <Badge
                variant={lastResult.confidence > 0.8 ? "default" : "secondary"}
              >
                {Math.round(lastResult.confidence * 100)}% confidence
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Raw Text:</p>
                <p className="font-medium">"{lastResult.rawText}"</p>
              </div>

              {lastResult.amount && (
                <div>
                  <p className="text-muted-foreground">Amount:</p>
                  <p className="font-medium text-green-600">
                    ${lastResult.amount.toFixed(2)}
                  </p>
                </div>
              )}

              {lastResult.category && (
                <div>
                  <p className="text-muted-foreground">Category:</p>
                  <p className="font-medium capitalize">
                    {lastResult.category}
                  </p>
                </div>
              )}

              <div className="md:col-span-3">
                <p className="text-muted-foreground">Description:</p>
                <p className="font-medium">{lastResult.description}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-muted/30">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Voice Input Examples:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>"I spent $25 on lunch at McDonald's"</li>
            <li>"Paid 60 dollars for gas"</li>
            <li>"Bought groceries for $120"</li>
            <li>"Coffee cost me 5 bucks"</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
