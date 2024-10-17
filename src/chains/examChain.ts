import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const createExamChain = (groq_api_key: string) => {
  const llm = new ChatGroq({
    apiKey: groq_api_key,
    model: "llama-3.1-8b-instant",
  });

  const template = `Genera una pregunta {type} sobre un tema aleatorio para evaluar a un estudiante de nivel {level}. 
  La pregunta debe ser de dificultad {difficulty}.
  Utiliza formato Markdown para estructurar la pregunta.

  Tipo de pregunta: {type}
  Formato: {format}
  Dificultad: {difficulty}
  Nivel educativo: {level}

  Pregunta (en Markdown):
  No respondas nada, solo genera la pregunta.
  `;

  const chatPrompt = ChatPromptTemplate.fromMessages<{ type: string, format: string, difficulty: string, level: string }>([
    ["system", template],
    ["user", "Genera una pregunta del tipo {type} en formato {format} de dificultad {difficulty} para nivel {level} usando Markdown"],
  ]);

  const parser = new StringOutputParser();

  return chatPrompt.pipe(llm).pipe(parser);
};