import { dirname, join, relative, sep as pathSep } from 'path';
import { readFileSync } from 'fs';
import stripBom from 'strip-bom';
import sourceMapSupport from 'source-map-support';
import nodeVer from 'node-version';
import Globals from '../api/globals';
import { TestCompilationError, GlobalsAPIError } from '../errors/runtime';
import stackCleaningHook from '../errors/stack-cleaning-hook';

const COMMON_API_PATH   = join(__dirname, '../api/common');
const NODE_MODULES_PATH = join(__dirname, '../../node_modules');
const NODE_VER          = parseInt(nodeVer.major, 10);
const CWD               = process.cwd();

const FIXTURE_RE = /(^|;|\s+)fixture\s*(\(\s*('|").+?\3\s*\)|`.+?`)/;
const TEST_RE    = /(^|;|\s+)test\s*(\(\s*('|").+?\3\s*,)/;

var Module = module.constructor;

export default class ESNextCompiler {
    constructor () {
        this.sourceMaps = {};
        this.cache      = {};

        this._setupSourceMapsSupport();
    }

    static _getNodeModulesLookupPath (filename) {
        var dir   = dirname(filename);
        var paths = Module._nodeModulePaths(dir);

        // HACK: for npm v2 installations, we need to expose our node_modules,
        // so that Module will be able to require babel-runtime.
        paths.push(NODE_MODULES_PATH);

        return paths;
    }

    static _getBabelOptions (filename) {
        // NOTE: lazy load heavy dependencies
        var presetStage2     = require('babel-preset-stage-2');
        var transformRuntime = require('babel-plugin-transform-runtime');
        var presetES2015     = NODE_VER < 4 ?
                               require('babel-preset-es2015-loose') :
                               require('babel-preset-es2015-node4');

        return {
            presets:             [presetStage2, presetES2015],
            plugins:             [transformRuntime],
            filename:            filename,
            sourceMaps:          true,
            retainLines:         true,
            ast:                 false,
            babelrc:             false,
            highlightCode:       false,
            resolveModuleSource: source => source === 'testcafe' ? COMMON_API_PATH : source
        };
    }

    static _isNodeModulesDep (filename) {
        return relative(CWD, filename)
                   .split(pathSep)
                   .indexOf('node_modules') >= 0;
    }

    static _execAsModule (code, filename) {
        var mod = new Module(filename, module.parent);

        mod.filename = filename;
        mod.paths    = ESNextCompiler._getNodeModulesLookupPath(filename);

        mod._compile(code, filename);
    }

    _setupSourceMapsSupport () {
        sourceMapSupport.install({
            handleUncaughtExceptions: false,

            retrieveSourceMap: filename => {
                var map = this.sourceMaps[filename];

                if (map)
                    return { url: filename, map };
            }
        });
    }

    _compileES (code, filename) {
        // NOTE: lazy load heavy dependencies
        var babel = require('babel-core');

        if (this.cache[filename])
            return this.cache[filename];

        var opts     = ESNextCompiler._getBabelOptions(filename);
        var compiled = babel.transform(code, opts);

        this.cache[filename]      = compiled.code;
        this.sourceMaps[filename] = compiled.map;

        return compiled.code;
    }

    _setupRequireHook (globals) {
        var origRequireExtension = require.extensions['.js'];

        require.extensions['.js'] = (mod, filename) => {
            // NOTE: remove global API so that it will be unavailable for the dependencies
            globals.remove();

            if (ESNextCompiler._isNodeModulesDep(filename))
                origRequireExtension(mod, filename);
            else {
                var code         = readFileSync(filename);
                var compiledCode = this._compileES(stripBom(code), filename);

                mod.paths = ESNextCompiler._getNodeModulesLookupPath(filename);

                mod._compile(compiledCode, filename);
            }

            globals.setup();
        };

        return origRequireExtension;
    }

    _compileESForTestFile (code, filename) {
        var compiledCode = null;

        stackCleaningHook.enabled = true;

        try {
            compiledCode = this._compileES(code, filename);
        }
        catch (err) {
            throw new TestCompilationError(err);
        }
        finally {
            stackCleaningHook.enabled = false;
        }

        return compiledCode;
    }

    canCompile (code, filename) {
        return /\.js$/.test(filename) &&
               FIXTURE_RE.test(code) &&
               TEST_RE.test(code);
    }

    compile (code, filename) {
        var compiledCode = this._compileESForTestFile(code, filename);
        var globals      = new Globals(filename);

        globals.setup();

        stackCleaningHook.enabled = true;

        var origRequireExtension = this._setupRequireHook(globals);

        try {
            ESNextCompiler._execAsModule(compiledCode, filename);
        }
        catch (err) {
            // HACK: workaround for the `instanceof` problem
            // (see: http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node)
            if (err.constructor !== GlobalsAPIError)
                throw new TestCompilationError(err);

            throw err;
        }
        finally {
            require.extensions['.js'] = origRequireExtension;
            stackCleaningHook.enabled = false;

            globals.remove();
        }

        return globals.collectedTests;
    }

    cleanUpCache () {
        this.cache = null;
    }
}
