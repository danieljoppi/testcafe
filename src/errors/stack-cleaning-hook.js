import stackTrace from 'stack-chain';
import stackFilter from './stack-filter';

const ORIGINAL_STACK_TRACE_LIMIT = Error.stackTraceLimit;
const STACK_TRACE_LIMIT          = 200;

export default {
    isEnabled: false,

    _hook (err, frames) {
        return frames
            .filter(stackFilter)
            .slice(0, ORIGINAL_STACK_TRACE_LIMIT);
    },

    get enabled () {
        return this.isEnabled;
    },

    set enabled (val) {
        this.isEnabled = val;

        if (this.isEnabled) {
            // NOTE: Babel errors may have really deep stacks,
            // so we increase stack trace capacity
            Error.stackTraceLimit = STACK_TRACE_LIMIT;
            stackTrace.filter.attach(this._hook);
        }
        else {
            Error.stackTraceLimit = ORIGINAL_STACK_TRACE_LIMIT;
            stackTrace.filter.deattach(this._hook);
        }
    }
};
