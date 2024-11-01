import consola from "consola";
import { runProjectSetup } from "../questions/initialSetup.question";
import { QUESTIONS, QUESTIONSLIST } from "../utils/constants";

const { JAVASCRIPT, TYPESCRIPT, GO, PYTHON } = QUESTIONS.LANGUAGE;
const { EXPRESS, NEST, FLASK, GIN, FASTAPI, FIBER } = QUESTIONS.FRAMEWORK;
const { POSTGRESQL, MONGODB, MYSQL } = QUESTIONS.DATABASE;
const { JWT, SESSION, OAUTH } = QUESTIONS.AUTH_TYPE;

const actionFunctions: any = {
  jsexpresspgjwt: () =>
    consola.info("Running JavaScript:Express:PostgreSQL:JWT"),
  jsexpresspgsession: () =>
    consola.info("Running JavaScript:Express:PostgreSQL:SESSION"),
  jsexpresspgoauth: () =>
    consola.info("Running JavaScript:Express:PostgreSQL:OAUTH"),
  // Add other functions here...
};

// Initialize mappings
const createProjectSetupActions = () => {
  const projectSetupActions: any = {};

  // Generate all combinations
  QUESTIONSLIST.LANGUAGE.forEach((language) => {
    QUESTIONSLIST.FRAMEWORK.forEach((framework) => {
      QUESTIONSLIST.DATABASE.forEach((database) => {
        QUESTIONSLIST.AUTHTYPE.forEach((authType) => {
          const key = `${language}:${framework}:${database}:${authType}`;

          // Dynamically map functions
          const funcKey = `${language.toLowerCase()}${framework.toLowerCase()}${database.toLowerCase()}${authType.toLowerCase()}`;
          projectSetupActions[key] =
            actionFunctions[funcKey] ||
            (() => consola.warn(`No function for ${key}`));
        });
      });
    });
  });

  return projectSetupActions;
};

// Assign actions
const projectSetupActions = createProjectSetupActions();

export const initProject = async () => {
  const answers = await runProjectSetup();
  console.log(answers);

  const { language, framework, database, authType } = answers;

  // Construct the key based on user selections
  const key = `${language}:${framework}:${database}:${authType}`;

  // Check if the key exists in the actions map
  if (projectSetupActions[key]) {
    projectSetupActions[key]();
  } else {
    consola.error("Invalid selection");
  }
};
