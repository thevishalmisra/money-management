import { ExpenseContext } from "../types/chatbot";

const GEMINI_API_KEY = "AIzaSyDtGf4qwW6-4y6WNAxvS_6jW3bfFV6ZuMc";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY;
  }

  async generateResponse(
    userMessage: string,
    expenseContext?: ExpenseContext,
    conversationHistory: Array<{ role: string; content: string }> = [],
    isGeneralSearch: boolean = false,
  ): Promise<string> {
    try {
      const systemPrompt = isGeneralSearch
        ? this.buildGeneralSearchPrompt()
        : this.buildFinanceSystemPrompt(expenseContext);

      // Build conversation context
      const messages = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...conversationHistory.slice(-10).map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);

      // Fallback responses for common queries
      return this.getFallbackResponse(
        userMessage,
        expenseContext,
        isGeneralSearch,
      );
    }
  }

  private buildGeneralSearchPrompt(): string {
    return `You are a helpful AI assistant that can answer questions about any topic. You have access to a vast knowledge base and can provide information, explanations, and insights on a wide variety of subjects.

Your personality:
- Helpful and informative
- Concise but thorough
- Friendly and engaging
- Use emojis occasionally to be engaging
- Provide accurate and up-to-date information

Keep responses concise (2-4 sentences) unless the user asks for detailed information.

You can help with:
- General knowledge questions
- Explanations of concepts
- Current events and news
- Technology and science
- History and culture
- Health and lifestyle tips
- Educational topics
- Entertainment recommendations
- And much more!

If you don't know something, say so honestly and suggest how the user might find the answer.`;
  }

  private buildFinanceSystemPrompt(expenseContext?: ExpenseContext): string {
    let prompt = `You are ExpenseBot, an AI assistant specialized in personal finance and expense tracking. You help users manage their expenses, provide budgeting advice, and offer financial insights.

Your personality:
- Friendly and supportive
- Knowledgeable about personal finance
- Practical and actionable advice
- Encouraging towards financial goals
- Use emojis occasionally to be engaging

Keep responses concise (2-3 sentences max) unless the user asks for detailed analysis.

You can help with:
- Expense categorization
- Budgeting advice
- Financial goal setting
- Spending pattern analysis
- Money-saving tips
- Investment basics
- Debt management

`;

    if (expenseContext) {
      prompt += `Current user's financial context:
- Total monthly expenses: $${expenseContext.totalExpenses.toFixed(2)}
- Total monthly income: $${expenseContext.totalIncome.toFixed(2)}
- Net amount: $${(expenseContext.totalIncome - expenseContext.totalExpenses).toFixed(2)}

Top spending categories:
${expenseContext.topCategories.map((cat) => `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`).join("\n")}

Recent transactions:
${expenseContext.recentTransactions
  .slice(0, 5)
  .map(
    (txn) =>
      `- ${txn.description}: $${txn.amount.toFixed(2)} (${txn.category})`,
  )
  .join("\n")}

Use this context to provide personalized advice.`;
    }

    return prompt;
  }

  private getFallbackResponse(
    userMessage: string,
    expenseContext?: ExpenseContext,
    isGeneralSearch: boolean = false,
  ): string {
    const lowerMessage = userMessage.toLowerCase();

    if (isGeneralSearch) {
      // General search fallbacks
      if (lowerMessage.includes("weather")) {
        return "🌤️ I can't check live weather data, but you can find current weather by searching 'weather [your city]' on Google or checking weather apps like Weather.com!";
      }

      if (lowerMessage.includes("news") || lowerMessage.includes("current")) {
        return "📰 For the latest news, I recommend checking reliable news sources like BBC, Reuters, AP News, or your local news outlets for current events!";
      }

      if (lowerMessage.includes("time") || lowerMessage.includes("date")) {
        return "🕐 I can't check the current time, but you can see it on your device's clock or search 'current time' on Google for any timezone!";
      }

      return "🤖 I'm having trouble connecting right now, but I'd love to help you with any questions! Try asking about topics like science, history, technology, or anything else you're curious about.";
    }

    // Finance-specific fallbacks
    if (lowerMessage.includes("budget") || lowerMessage.includes("spending")) {
      return "💰 Great question about budgeting! The 50/30/20 rule is a good starting point: 50% for needs, 30% for wants, and 20% for savings. Would you like me to analyze your current spending patterns?";
    }

    if (lowerMessage.includes("save") || lowerMessage.includes("saving")) {
      return "🎯 Smart thinking about saving! Start small - even $25/week adds up to $1,300 yearly. Track your expenses for a week to find areas where you can cut back. What's your savings goal?";
    }

    if (
      lowerMessage.includes("category") ||
      lowerMessage.includes("categorize")
    ) {
      return "📊 I can help you categorize expenses! Common categories include: Food & Dining, Transportation, Entertainment, Utilities, Shopping, and Healthcare. What transaction do you need help categorizing?";
    }

    if (lowerMessage.includes("voice") || lowerMessage.includes("speech")) {
      return "🎤 The voice feature is great! Just say things like 'I spent $25 on lunch' or 'Paid 60 dollars for gas' and I'll automatically detect the amount, category, and description for you.";
    }

    if (
      expenseContext &&
      (lowerMessage.includes("analyze") || lowerMessage.includes("insight"))
    ) {
      const netAmount =
        expenseContext.totalIncome - expenseContext.totalExpenses;
      if (netAmount > 0) {
        return `📈 Good news! You're saving $${netAmount.toFixed(2)} this month. Your top expense is ${expenseContext.topCategories[0]?.category || "unknown"}. Consider setting aside this surplus for emergency fund or investments!`;
      } else {
        return `⚠️ You're spending $${Math.abs(netAmount).toFixed(2)} more than you earn. Focus on reducing ${expenseContext.topCategories[0]?.category || "top"} expenses first. Need specific tips?`;
      }
    }

    return "👋 Hi! I'm your AI assistant. I can help with finance questions and general knowledge. Try asking me about budgeting, saving tips, or any topic you're curious about!";
  }
}

export const geminiService = new GeminiService();
