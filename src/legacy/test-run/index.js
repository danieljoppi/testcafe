import path from 'path';
import { readSync as read } from 'read-file-relative';
import Mustache from 'mustache';
import { Session } from 'testcafe-hammerhead';
import COMMAND from './command';
import ERROR_TYPE from '../test-run-error/type';
import TestRunError from '../test-run-error';


// Const
const TEST_RUN_TEMPLATE        = read('../../client/test-run/index.js.mustache');
const IFRAME_TEST_RUN_TEMPLATE = read('../../client/test-run/iframe.js.mustache');


export default class LegacyTestRun extends Session {
    constructor (test, browserConnection, screenshotCapturer, opts) {
        var uploadsRoot = path.dirname(test.fixture.path);

        super(uploadsRoot);

        this.running  = false;
        this.unstable = false;

        this.opts              = opts;
        this.test              = test;
        this.browserConnection = browserConnection;

        this.isFileDownloading = false;

        // TODO remove it then we move shared data to session storage
        this.errs                       = [];
        this.nativeDialogsInfo          = null;
        this.nativeDialogsInfoTimeStamp = 0;
        this.stepsSharedData            = {};
        this.screenshotCapturer         = screenshotCapturer;

        this.injectable.scripts.push('/testcafe-core.js');
        this.injectable.scripts.push('/testcafe-ui.js');
        this.injectable.scripts.push('/testcafe-runner.js');
        this.injectable.styles.push('/testcafe-ui-styles.css');
    }

    _getPayloadScript () {
        var sharedJs = this.test.fixture.getSharedJs();

        if (!this.running) {
            this.running = true;
            this.emit('start');
        }

        return Mustache.render(TEST_RUN_TEMPLATE, {
            stepNames:              JSON.stringify(this.test.stepData.names),
            testSteps:              this.test.stepData.js,
            sharedJs:               sharedJs,
            testRunId:              this.id,
            browserHeartbeatUrl:    this.browserConnection.heartbeatUrl,
            browserStatusUrl:       this.browserConnection.statusUrl,
            takeScreenshots:        this.screenshotCapturer.enabled,
            takeScreenshotsOnFails: this.opts.takeScreenshotsOnFails,
            skipJsErrors:           this.opts.skipJsErrors,
            nativeDialogsInfo:      JSON.stringify(this.nativeDialogsInfo)
        });
    }

    _getIframePayloadScript (iframeWithoutSrc) {
        var sharedJs      = this.test.fixture.getSharedJs();
        var payloadScript = Mustache.render(IFRAME_TEST_RUN_TEMPLATE, {
            sharedJs:               sharedJs,
            takeScreenshotsOnFails: this.opts.takeScreenshotsOnFails,
            skipJsErrors:           this.opts.skipJsErrors,
            nativeDialogsInfo:      JSON.stringify(this.nativeDialogsInfo)
        });

        return iframeWithoutSrc ? 'var isIFrameWithoutSrc = true;' + payloadScript : payloadScript;
    }

    async _addError (err) {
        if (err.__sourceIndex !== void 0 && err.__sourceIndex !== null) {
            err.relatedSourceCode = this.test.sourceIndex[err.__sourceIndex];
            delete err.__sourceIndex;
        }

        try {
            err.screenshotPath = await this.screenshotCapturer.captureError(err);
        }
        catch (e) {
            // NOTE: swallow the error silently if we can't take screenshots for some
            // reason (e.g. we don't have permissions to write a screenshot file).
        }

        this.errs.push(new TestRunError(err));
    }

    async _fatalError (err) {
        await this._addError(err);
        this.emit('done');
    }

    getAuthCredentials () {
        return this.test.fixture.authCredentials;
    }

    handleFileDownload () {
        this.isFileDownloading = true;
    }

    handlePageError (ctx, errMsg) {
        this._fatalError({
            type:    ERROR_TYPE.pageNotLoaded,
            message: errMsg
        });

        ctx.redirect(this.browserConnection.idleUrl);
    }
}

// Service message handlers
var ServiceMessages = LegacyTestRun.prototype;

ServiceMessages[COMMAND.fatalError] = function (msg) {
    return this._fatalError(msg.err);
};

ServiceMessages[COMMAND.assertionFailed] = function (msg) {
    return this._addError(msg.err);
};

ServiceMessages[COMMAND.done] = function () {
    this.emit('done');
};

ServiceMessages[COMMAND.setStepsSharedData] = function (msg) {
    this.stepsSharedData = msg.stepsSharedData;
};

ServiceMessages[COMMAND.getStepsSharedData] = function () {
    return this.stepsSharedData;
};

ServiceMessages[COMMAND.getAndUncheckFileDownloadingFlag] = function () {
    var isFileDownloading = this.isFileDownloading;

    this.isFileDownloading = false;

    return isFileDownloading;
};

ServiceMessages[COMMAND.uncheckFileDownloadingFlag] = function () {
    this.isFileDownloading = false;
};

ServiceMessages[COMMAND.nativeDialogsInfoSet] = function (msg) {
    if (msg.timeStamp >= this.nativeDialogsInfoTimeStamp) {
        //NOTE: the server can get messages in the wrong sequence if they was sent with a little distance (several milliseconds),
        // we don't take to account old messages
        this.nativeDialogsInfoTimeStamp = msg.timeStamp;
        this.nativeDialogsInfo          = msg.info;
    }
};

ServiceMessages[COMMAND.takeScreenshot] = async function (msg) {
    try {
        return await this.screenshotCapturer.captureAction(msg);
    }
    catch (e) {
        // NOTE: swallow the error silently if we can't take screenshots for some
        // reason (e.g. we don't have permissions to write a screenshot file).
        return null;
    }

};
