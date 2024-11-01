import { prompt } from 'enquirer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import consola from 'consola';
import { QUESTIONS, QUESTIONSLIST } from '../utils/constants';
import { CONFIG } from '../utils/config';
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface ProjectResponses {
  appType: string;
  language: string;
  database: string;
  useAuth: boolean;
  authType: string;
  purpose: string;
  features: string;
  additionalDetails: string[];
  models?: string[];
  functions?: string[];
}

interface RefinementQuestion {
  category: string;
  question: string;
}
interface ProceedResponse {
  proceed: boolean;
}

// Markdown formatter utility
const mdFormatter = {
  formatText(text: string): string {
    const lines = text.split('\n');
    let formattedLines = lines.map((line) => {
      // Headers
      if (line.startsWith('# ')) {
        return consola.info('\n' + line.substring(2) + '\n' + '='.repeat(line.length));
      }
      if (line.startsWith('## ')) {
        return consola.warn('\n' + line.substring(3) + '\n' + '-'.repeat(line.length));
      }
      if (line.startsWith('### ')) {
        return consola.success('\n' + line.substring(4) + '\n');
      }

      // Lists
      if (line.match(/^[*-] /)) {
        return consola.info('• ') + line.substring(2);
      }
      if (line.match(/^\d+\. /)) {
        return consola.info(line);
      }

      // Code blocks
      if (line.startsWith('```')) {
        return consola.debug('─'.repeat(80));
      }

      // Bold
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, (_: any, text: any) => {
        consola.info(text);
        return `**${text}**`;
      });

      // Italic
      formattedLine = formattedLine.replace(/\_(.*?)\_/g, (_: any, text: any) => {
        consola.info(text);
        return `_${text}_`;
      });

      return formattedLine;
    });

    // Handle code blocks
    let isInCodeBlock = false;
    formattedLines = formattedLines.map((line) => {
      if (line === consola.debug('─'.repeat(80))) {
        isInCodeBlock = !isInCodeBlock;
        return line;
      }
      return isInCodeBlock ? consola.debug(line) : line;
    });

    return formattedLines.join('\n');
  },

  displaySection(title: string, content: string) {
    consola.info('\n' + consola.info('┌' + '─'.repeat(78) + '┐'));
    consola.info(consola.info(`│ ${title.padEnd(76)} │`));
    consola.info(consola.info('└' + '─'.repeat(78) + '┘\n'));
    console.log(this.formatText(content));
  },
};

export const askInitialQuestions = async (): Promise<any> => {
  const responses = await prompt([
    {
      type: 'input',
      name: 'name',
      message: "Hi there! What's you want to name your project?",
    },
    {
      type: 'select',
      name: 'language',
      message: 'What language do you prefer for the backend?',
      choices: QUESTIONSLIST.LANGUAGE,
    },
    {
      type: 'select',
      name: 'framework',
      message: 'Which framework would you like to use?',
      choices: QUESTIONSLIST.FRAMEWORK,
    },
    {
      type: 'select',
      name: 'database',
      message: 'Which database would you like to use?',
      choices: QUESTIONSLIST.DATABASE,
    },
    {
      type: 'toggle',
      name: 'useAuth',
      message: 'Would you like to include authentication?',
      enabled: 'Yes',
      disabled: 'No',
      initial: true,
    },
    {
      type: 'select',
      name: 'authType',
      message: 'Which authentication method do you prefer?',
      choices: QUESTIONSLIST.AUTHTYPE,
    },
  ]);

  return { ...responses, additionalDetails: [] };
};

export const askDetailedQuestions = async (initialResponses: ProjectResponses): Promise<ProjectResponses> => {
  const detailedResponses = await prompt([
    {
      type: 'input',
      name: 'purpose',
      message: 'Please describe the main purpose and goals of your application:',
    },
    {
      type: 'input',
      name: 'features',
      message: "What are the key features you'd like to implement? (comma-separated)",
    },
  ]);

  return { ...initialResponses, ...detailedResponses };
};

const generateFollowUpQuestions = async (
  responses: ProjectResponses,
  previousAnalysis: string
): Promise<RefinementQuestion[]> => {
  const prompt = `
    Based on the following project information and previous analysis, generate 3-5 specific follow-up questions 
    that would help clarify important aspects of the project that haven't been addressed yet.
    Focus on technical details, user experience, scalability, and specific feature implementation.

    Current Project Info:
    ${JSON.stringify(responses, null, 2)}

    Previous Analysis:
    ${previousAnalysis}

    Format the response as a JSON array of objects with 'category' and 'question' fields.
    Example: [{"category": "Security", "question": "What level of user data encryption do you require?"}]
  `;

  const result = await model.generateContent(prompt);
  try {
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return [
      {
        category: 'General',
        question: 'What additional details would you like to share about your project?',
      },
    ];
  }
};

export const analyzeWithGemini = async (responses: ProjectResponses) => {
  const prompt = `
    Based on the following project requirements and additional details, provide a comprehensive analysis:
    
    App Type: ${responses.appType}
    Language: ${responses.language}
    Database: ${responses.database}
    Authentication: ${responses.useAuth ? responses.authType : 'None'}
    Purpose: ${responses.purpose}
    Features: ${responses.features}
    Additional Details: ${responses.additionalDetails.join('\n')}
    
    Please provide:
    1. Required data models with their fields
    2. Key functions and APIs needed
    3. Potential technical considerations or challenges
    4. Suggested architecture approach
    5. Specific implementation recommendations
    6. Areas that might need more clarification
    
    Format the response in a clear, structured way.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const askFollowUpQuestions = async (questions: RefinementQuestion[]): Promise<string[]> => {
  const responses: string[] = [];

  for (const q of questions) {
    console.log(`\nCategory: ${q.category}`);
    const { answer }: any = await prompt({
      type: 'input',
      name: 'answer',
      message: q.question,
    });
    if (answer.trim()) {
      responses.push(`[${q.category}] ${q.question}\nAnswer: ${answer}`);
    }
  }

  return responses;
};

export const iterativeRefinement = async (
  responses: ProjectResponses,
  previousAnalysis: string = ''
): Promise<ProjectResponses> => {
  // Generate and ask follow-up questions based on current state
  const followUpQuestions = await generateFollowUpQuestions(responses, previousAnalysis);
  const newDetails = await askFollowUpQuestions(followUpQuestions);

  // Add new details to the responses
  responses.additionalDetails = [...responses.additionalDetails, ...newDetails];

  // Get updated analysis
  const newAnalysis = await analyzeWithGemini(responses);

  // Show current state and analysis
  console.log('\nUpdated Analysis:');
  console.log('----------------');
  //   console.log(newAnalysis);
  mdFormatter.displaySection('Updated Analysis', newAnalysis);

  // Ask if user wants to continue refining
  const { continueRefining }: any = await prompt({
    type: 'confirm',
    name: 'continueRefining',
    message: 'Would you like to provide more details or clarifications?',
    initial: true,
  });

  if (continueRefining) {
    return iterativeRefinement(responses, newAnalysis);
  }

  return responses;
};

export const confirmProject = async (responses: ProjectResponses, geminiAnalysis: string) => {
  //   console.log("\nFinal Project Summary:");
  //   console.log("---------------------");
  //   console.log(JSON.stringify(responses, null, 2));
  //   console.log("\nFinal Analysis and Suggestions:");
  //   console.log("------------------------------");
  //   console.log(geminiAnalysis);

  mdFormatter.displaySection(
    'Final Project Summary',
    `
# Project Configuration
\`\`\`
${JSON.stringify(responses, null, 2)}
\`\`\`

# Analysis and Recommendations
${geminiAnalysis}
  `
  );

  const { proceed }: ProceedResponse = await prompt({
    type: 'confirm',
    name: 'proceed',
    message: 'Are you satisfied with these specifications and ready to proceed?',
    initial: true,
  });

  return { proceed, responses, analysis: geminiAnalysis };
};

export const runProjectSetup = async (): Promise<any> => {
  try {
    // Step 1: Initial technical questions
    const initialResponses = await askInitialQuestions();

    // Step 2: Detailed project questions
    let fullResponses = await askDetailedQuestions(initialResponses);

    // Step 3: Initial AI analysis
    let initialAnalysis = await analyzeWithGemini(fullResponses);

    // Step 4: Iterative refinement loop
    fullResponses = await iterativeRefinement(fullResponses, initialAnalysis);

    // Step 5: Final analysis
    const finalAnalysis = await analyzeWithGemini(fullResponses);

    // Step 6: Final confirmation
    const { proceed, responses, analysis } = await confirmProject(fullResponses, finalAnalysis);

    if (proceed) {
      return {
        responses,
        analysis,
        confirmed: true,
      };
    } else {
      console.log('Would you like to:');
      const { action }: any = await prompt({
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: ['Start over with new specifications', 'Continue refining current specifications', 'Exit setup'],
      });

      if (action === 'Continue refining current specifications') {
        return runProjectSetup();
      } else if (action === 'Start over with new specifications') {
        return runProjectSetup();
      } else {
        return { confirmed: false };
      }
    }
  } catch (error) {
    console.error('Error during project setup:', error);
    throw error;
  }
};
