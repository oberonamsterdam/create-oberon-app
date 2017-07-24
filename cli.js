import promisify from 'es6-promisify';
import chalk from 'chalk';
import _package from './package.json';
import questions from './questions';
import { execute } from './questions';
import inquirer from 'inquirer';
import program from 'commander';
import cmd from 'node-cmd';

const get = promisify(cmd.get, {
    thisArg: cmd,
    multiArgs: true
});

export const log = (message, type = 'log') => console[type](chalk`{bold.green create-oberon-app} ${type === 'error' ? chalk`{bold.red ERR!}` : chalk`{bold.cyan INFO}`}`, message);

(async () => {
    log(chalk`{blue v${_package.version}}`);

    program
        .arguments('<appname>')
        .version(_package.version)
        .parse(process.argv);
    
    try {
        await get('which npx');
    } catch(ex) {
        log(chalk`Unable to locate npx, please update npm to 5.3+ by running {dim npm i npm -g}`, 'error');
        process.exit(1);
    }
    
    let appname = program.args[0];
    let questionsArray = Object.values(questions).map(({ question }) => question);
    
    if(!appname) {
        questionsArray = [
            {
                message: chalk`You didn't provide a directory for the app to be created in.
Remember, you can run COA as follows: {dim create-oberon-app my-awesome-app}
Please specify a name now:`,
                name: 'appname',
                default: 'my-awesome-app'
            },
            ...questionsArray
        ];
    }
    
    const answers = await inquirer.prompt(questionsArray);
    if(!answers.appname) {
        answers.appname = appname;
    }
    
    log(chalk`🍳  Cooking up a fresh new app...`);
    
    for(const key of Object.keys(questions)) {
        const question = questions[key];
        await question.execute(answers[key], answers);
    }
})().catch(err => {
    log(err, 'error');
    process.exit(1);
});