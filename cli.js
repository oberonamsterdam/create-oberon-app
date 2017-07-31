/* eslint-disable no-console */

import promisify from 'es6-promisify';
import chalk from 'chalk';
import _package from './package.json';
import questions from './questions';
import inquirer from 'inquirer';
import program from 'commander';
import cmd from 'node-cmd';
import log from './services/log';
import { postInstall } from './questions/index';
import run from './services/run';
import path from 'path';

const get = promisify(cmd.get, {
    thisArg: cmd,
    multiArgs: true
});

(async () => {
    log(chalk`{blue v${_package.version}}`);

    program
        .arguments('<appname>')
        .version(_package.version)
        .parse(process.argv);

    let useYarn = false;
    try {
        await get('which yarn');
        useYarn = true;
        // I wish there was a way to force create-react-app / create-razzle-app to not use yarn...
        log(chalk`{bold Using yarn!} If you wish to use npm instead, you will have to remove yarn: {dim npm remove yarn -g} (if you installed it with npm)`, 'warn');
    } catch(ex) {
        //eslint disable-line no-empty
    }
    
    try {
        await get('which npx');
    } catch(ex) {
        log(chalk`Unable to locate npx, please update npm to 5.3+ by running {dim npm i npm -g}`, 'error');
        process.exit(1);
    }
    
    const appname = program.args[0];
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

    log('📋  Please enter your order:');
    const answers = await inquirer.prompt(questionsArray);
    if(!answers.appname) {
        answers.appname = appname;
    }
    
    log(chalk`🍳  Cooking up a fresh new app...`);
    
    let packages = [], devPackages = [];
    for(const key of Object.keys(questions)) {
        const question = questions[key];
        await question.execute(answers[key], answers, packages, devPackages);
    }
    
    if(packages.length) {
        console.log();
        console.log(chalk`Installing {bold.blue packages}:`);
        for(const pkg of packages) {
            console.log(chalk`    - {blue ${pkg}}`);
        }
        console.log();

        await run(`${useYarn ? 'yarn add' : 'npm install'} ${packages.join(' ')} --${useYarn ? 'dev' : 'save-dev'}`, {
            cwd: path.join(process.cwd(), answers.appname)
        });
    }
    if(devPackages.length) {
        console.log();
        console.log(chalk`Installing {bold.green dev packages}:`);
        for(const pkg of devPackages) {
            console.log(chalk`    - {green ${pkg}}`);
        }
        console.log();
        
        await run(`${useYarn ? 'yarn add' : 'npm install'} ${devPackages.join(' ')} --${useYarn ? 'dev' : 'save-dev'}`, {
            cwd: path.join(process.cwd(), answers.appname)
        });
    }

    log('🚚  All packages installed.');

    for(const key of Object.keys(questions)) {
        if(key in postInstall) {
            await postInstall[key](answers[key], answers);
        }
    }

    log('🔥  All done! Your app is ready to use.');
    log(chalk`Feel free to {blue cd ${answers.appname}} and {blue npm start}!`);
})().catch(err => {
    log(err, 'error');
    process.exit(1);
});