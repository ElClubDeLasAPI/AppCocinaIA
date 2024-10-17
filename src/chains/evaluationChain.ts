import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const createEvaluationChain = (groq_api_key: string) => {
  const llm = new ChatGroq({
    apiKey: groq_api_key,
    model: "llama-3.1-8b-instant",
  });

  const template = `Evalúa la siguiente respuesta del estudiante a la pregunta dada. 
  Proporciona una puntuación del 0 al 10 y una explicación detallada de la evaluación.
  Ten en cuenta que la pregunta es de dificultad {difficulty} para un nivel educativo {level}.
  Utiliza formato Markdown para estructurar tu respuesta.

  Pregunta: {question}

  Respuesta del estudiante: {answer}

  Evaluación (en Markdown):`;

  const chatPrompt = ChatPromptTemplate.fromMessages<{ question: string; answer: string; format: string; difficulty: string; level: string }>([
    ["system", template],
    ["user", "Evalúa la respuesta a la pregunta: {question}\n\nRespuesta del estudiante: {answer}\n\nFormato de pregunta: {format}\n\nDificultad: {difficulty}\n\nNivel educativo: {level}"],
  ]);

  const parser = new StringOutputParser();

  return chatPrompt.pipe(llm).pipe(parser);
};