import chalk from 'chalk';
import promisify from 'es6-promisify';
import fs from 'fs';
import cmd from 'node-cmd';
import path from 'path';
import replace from 'replace-in-file';
import { GENERATOR_TYPES } from '../constants';
import { store } from '../createStore';
import log from '../services/log';
import run from '../services/run';
import { errors } from '../snippets';

const writeFile = promisify(fs.writeFile);
const get = promisify(cmd.get, {
    thisArg: cmd,
    multiArgs: true,
});

export default {
    default: ({ ssr, flow }) => ssr && !flow ? 'standard-react' : 'react-app',
    name: 'eslintConfig',
    message: chalk`{bold What ESLint config should to be used? Enter the eslint-config-{cyan name}}`,
    validate: async (answer) => {
        const packageName = 'eslint-config-' + answer;
        const res = await get(`npm s ${packageName} --json`);
        const results = JSON.parse(res[0]).filter(result => result.name === packageName);
        return results.length ? true : `${packageName} was not found on the npm registry.`;
    },
};

export const execute = async ({ answer, answers: { ssr, appname, mobile, eslint }, devPackages }) => {
    const { razzle, createReactApp, expo, reactNativeCli } = GENERATOR_TYPES;
    const { generator } = store.getState();

    if (answer !== 'react-app') {
        if (!mobile || (mobile && eslint)) {
            devPackages.push(`eslint-config-${answer}`);
            const res = await get(`npm info "eslint-config-${answer}@latest" peerDependencies --json`);
            const peerDeps = JSON.parse(res[0]);
            devPackages.push(...Object.keys(peerDeps).map(key => `${key}@${peerDeps[key]}`));
        }

        if (generator === createReactApp) {
            // eject if we're on create-react-app.
            log(errors.ejectCRA, 'warn');

            // update global state
            store.changeState({
                createReactAppEjected: true,
            });

            await run('npm run eject', {
                cwd: path.join(process.cwd(), appname),
            });
            await replace({
                files: path.join(process.cwd(), appname, 'package.json'),
                from: /"extends": "react-app"/g,
                to: `"extends": "${answer}"`,
            });
        }

        // this assumes we're on razzle in the first condition
        if (generator === razzle || (mobile && eslint)) {
            await writeFile(path.join(process.cwd(), appname, '.eslintrc'), `
{
    "extends": "${answer}"
}
`);
        }
    }
};

export const postInstall = async ({ answers: { appname, eslint, mobile } }) => {
    if (mobile && !eslint) {
        return;
    }

    // attempt auto fix now that config etc is in place.
    try {
        await run('npx eslint --fix src', {
            cwd: path.join(process.cwd(), appname),
        });
    } catch (ex) {
        log('ESLint auto fix failed! Check log above.', 'warn', ex);
    }
};
