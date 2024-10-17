export interface QuestionRequest {
    type: string;
    format: string;
    difficulty: string;
    level: string;
}

export interface EvaluateRequest {
    question: string;
    answer: string;
    format: string;
    difficulty: string;
    level: string;
}

export interface QuestionResponse {
    question: string;
}

export interface EvaluationResponse {
    evaluation: string;
}