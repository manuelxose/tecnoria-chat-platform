import { IAIProvider } from "@tecnoria-chat/application";
import OpenAI from "openai";

export class OpenAIAdapter implements IAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async ask(prompt: string, context: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Authorize context: " + context },
        { role: "user", content: prompt }
      ]
    });

    return response.choices[0].message.content || "";
  }
}
