#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import picocolors from 'picocolors';
import consola from 'consola';
import { runProjectSetup } from './questions/initialSetup.question';
import { initProject } from './commands/initProject';

const program = new Command();

program
  .version('1.0.0')
  .description('A sample CLI application')
  .option('-n, --name <type>', 'Your name')
  .action((options) => {
    consola.info(`Hello, ${picocolors.green(options.name || 'World')}!`);
  });

program.command('init').description('Initialize a new project').action(initProject);

program.parse(process.argv);
