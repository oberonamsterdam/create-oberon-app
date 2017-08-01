import path from 'path';
import replace from 'replace-in-file';
import addRazzleMod from '../services/addRazzleMod';

export default {
    type: 'confirm',
    name: 'eslint',
    message: 'Use ESLint (http://eslint.js.org/)',
    
    // CRA already includes ESLint.
    when: ({ ssr, mobile }) => !!ssr || mobile
};

export const execute = async (answer, { appname, ssr }, packages, devPackages) => {
    if(answer && ssr) {
        devPackages.push('eslint-loader');
        packages.push('oberon-razzle-modifications');
        await addRazzleMod(appname);
        await replace({
            from: /const useESLint = false;/,
            to: 'const useESLint = true;',
            files: path.join(process.cwd(), appname, 'razzle.config.js')
        });
    }
};