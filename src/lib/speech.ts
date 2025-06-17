import { VoiceRecognitionResult, ExpenseCategory } from "../types/expense";

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

    if (this.isSupported) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;
  }

  public isSupported_(): boolean {
    return this.isSupported;
  }

  public startListening(): Promise<VoiceRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported"));
        return;
      }

      this.recognition.onresult = (event) => {
        const result = event.results[0][0];
        const parsedResult = this.parseExpenseFromText(
          result.transcript,
          result.confidence,
        );
        resolve(parsedResult);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private parseExpenseFromText(
    text: string,
    confidence: number,
  ): VoiceRecognitionResult {
    const lowerText = text.toLowerCase();

    // Extract amount using various patterns
    const amountPatterns = [
      /\$(\d+(?:\.\d{2})?)/,
      /(\d+(?:\.\d{2})?) dollars?/,
      /(\d+(?:\.\d{2})?) bucks?/,
      /spent (\d+(?:\.\d{2})?)/,
      /cost (\d+(?:\.\d{2})?)/,
      /(\d+(?:\.\d{2})?) on/,
      /for (\d+(?:\.\d{2})?)/,
    ];

    let amount: number | undefined;
    for (const pattern of amountPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        break;
      }
    }

    // Extract category based on keywords
    const category = this.extractCategory(lowerText);

    // Clean description by removing amount and category indicators
    let description = text;
    if (amount) {
      description = description
        .replace(/\$?\d+(?:\.\d{2})?(?:\s*dollars?|\s*bucks?)?/gi, "")
        .trim();
    }
    description = description
      .replace(/^(spent|paid|bought|purchased|cost)\s*/gi, "")
      .trim();
    description = description.replace(/\s*(on|for)\s*/gi, " ").trim();

    return {
      amount,
      description: description || text,
      category,
      confidence,
      rawText: text,
    };
  }

  private extractCategory(text: string): ExpenseCategory | undefined {
    const categoryKeywords: Record<ExpenseCategory, string[]> = {
      food: [
        "food",
        "restaurant",
        "lunch",
        "dinner",
        "breakfast",
        "coffee",
        "snack",
        "grocery",
        "groceries",
        "pizza",
        "burger",
        "meal",
      ],
      transportation: [
        "gas",
        "fuel",
        "uber",
        "lyft",
        "taxi",
        "bus",
        "train",
        "subway",
        "parking",
        "car",
        "transportation",
      ],
      entertainment: [
        "movie",
        "cinema",
        "concert",
        "game",
        "gaming",
        "netflix",
        "spotify",
        "entertainment",
        "fun",
        "party",
      ],
      utilities: [
        "electricity",
        "water",
        "gas bill",
        "internet",
        "phone",
        "utilities",
        "bill",
      ],
      healthcare: [
        "doctor",
        "hospital",
        "medicine",
        "pharmacy",
        "health",
        "medical",
        "dentist",
      ],
      shopping: [
        "clothes",
        "shirt",
        "shoes",
        "shopping",
        "amazon",
        "store",
        "mall",
        "purchase",
      ],
      education: [
        "school",
        "course",
        "book",
        "education",
        "learning",
        "university",
        "college",
      ],
      travel: [
        "hotel",
        "flight",
        "vacation",
        "trip",
        "travel",
        "booking",
        "airbnb",
      ],
      housing: ["rent", "mortgage", "house", "apartment", "home", "housing"],
      insurance: ["insurance", "premium", "policy"],
      savings: ["save", "saving", "savings", "deposit"],
      investment: ["stock", "investment", "portfolio", "trading"],
      income: ["salary", "income", "paycheck", "earned", "bonus"],
      other: ["other", "miscellaneous", "misc"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }

    return undefined;
  }
}

// Global speech recognition instance
export const speechService = new SpeechRecognitionService();

// Type definitions for browser speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
