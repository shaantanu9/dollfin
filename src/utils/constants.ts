export const QUESTIONS = {
  LANGUAGE: {
    JAVASCRIPT: 'JavaScript',
    TYPESCRIPT: 'TypeScript',
    GO: 'Go',
    PYTHON: 'Python',
  },
  FRAMEWORK: {
    EXPRESS: 'Express',
    NEST: 'Nest',
    FLASK: 'Flask',
    GIN: 'Gin',
    FASTAPI: 'FastAPI',
    FIBER: 'Fiber',
  },
  DATABASE: {
    POSTGRESQL: 'PostgreSQL',
    MONGODB: 'MongoDB',
    MYSQL: 'MySQL',
    // SQLITE: "SQLite",
    // DYNAMODB: "DynamoDB",
  },
  AUTH_TYPE: {
    JWT: 'JWT',
    SESSION: 'Session',
    OAUTH: 'OAuth',
  },
};

export const QUESTIONSLIST = {
  LANGUAGE: Object.values(QUESTIONS.LANGUAGE),
  FRAMEWORK: Object.values(QUESTIONS.FRAMEWORK),
  DATABASE: Object.values(QUESTIONS.DATABASE),
  AUTHTYPE: Object.values(QUESTIONS.AUTH_TYPE),
};
