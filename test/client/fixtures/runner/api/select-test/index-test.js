var hammerhead   = window.getTestCafeModule('hammerhead');
var browserUtils = hammerhead.utils.browser;

var testCafeCore  = window.getTestCafeModule('testCafeCore');
var SETTINGS      = testCafeCore.get('./settings').get();
var ERROR_TYPE    = testCafeCore.ERROR_TYPE;
var domUtils      = testCafeCore.get('./utils/dom');
var style         = testCafeCore.get('./utils/style');
var textSelection = testCafeCore.get('./utils/text-selection');

var testCafeRunner = window.getTestCafeModule('testCafeRunner');
var actionsAPI     = testCafeRunner.get('./api/actions');
var automation     = testCafeRunner.get('./automation/automation');
var StepIterator   = testCafeRunner.get('./step-iterator');

automation.init();

var stepIterator = new StepIterator();
actionsAPI.init(stepIterator);

var correctTestWaitingTime = function (time) {
    if (browserUtils.isTouchDevice && browserUtils.isFirefox)
        return time * 2;

    return time;
};

$(document).ready(function () {
    var actionTargetWaitingCounter = 0,
        actionRunCounter           = 0;

    StepIterator.prototype.asyncActionSeries = function (items, runArgumentsIterator, action) {
        var seriesActionsRun = function (elements, callback) {
            window.async.forEachSeries(
                elements,
                function (element, seriaCallback) {
                    action(element, seriaCallback);
                },
                function () {
                    callback();
                });
        };

        runArgumentsIterator(items, seriesActionsRun, asyncActionCallback);
    };

    StepIterator.prototype.onActionTargetWaitingStarted = function () {
        actionTargetWaitingCounter++;
    };

    StepIterator.prototype.onActionRun = function () {
        actionRunCounter++;
    };

    stepIterator.on(StepIterator.ERROR_EVENT, function (err) {
        stepIterator.state.stoppedOnFail = false;
        currentErrorType                 = err.type;
        currentSourceIndex               = err.__sourceIndex;

        if (err.element)
            currentErrorElement = err.element;
    });

    //constants
    var TEXTAREA_SELECTOR    = '#textarea';
    var INPUT_SELECTOR       = '#input';
    var DIV_ELEMENT_SELECTOR = '#div';

    var INPUT_INITIAL_VALUE = '123456789';

    var TEXTAREA_BIG_TEXT = '123456789abcdlasdkjasdjkajkdjkasjkdjkajskd\n12345678901234567890\n123456\n' +
                            'efghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n' +
                            '123456\nefghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n123456\n' +
                            'efghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n123456\n' +
                            'efghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n123456\n' +
                            'efghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n123456\n' +
                            'efghifkklfkalsklfkalskdlkaldklakdlkalskdaslkdl\njklmopsdajdkjaksjdkkjdk\n' +
                            'dasdasdasdasdajksdjkajskdjk\najkdjkasjkdjksjkdjksjdkjs\nqwerty\ntest\n' +
                            'cafesadkaldklakldlakdklakldkalskd;';

    var startSelectEvent       = browserUtils.hasTouchEvents ? 'ontouchstart' : 'onmousedown';
    var endSelectEvent         = browserUtils.hasTouchEvents ? 'ontouchend' : 'onmouseup';
    var checkScrollAfterSelect = !(browserUtils.isFirefox || browserUtils.isIE);

    var currentErrorType    = null;
    var currentSourceIndex  = null;
    var currentErrorElement = null;

    var mousedownOnInput    = false;
    var mouseupOnInput      = false;
    var mousedownOnTextarea = false;
    var mouseupOnTextarea   = false;

    //utils
    var asyncActionCallback;

    function setValueToTextarea (value) {
        var textarea = $(TEXTAREA_SELECTOR)[0];

        textarea.value       = value;
        textarea.textContent = value;

        $(textarea).text(value);

        restorePageState();
    }

    function setValueToInput (value) {
        var input = $(INPUT_SELECTOR)[0];

        input.value = value;

        restorePageState();
    }

    function setSelection ($el, start, end, inverse) {
        start = start || 0;

        //NOTE: set to start position
        var el            = $el[0];
        var startPosition = inverse ? end : start;

        if (el.setSelectionRange) {
            el.setSelectionRange(startPosition, startPosition);
        }
        else {
            el.selectionStart = startPosition;
            el.selectionEnd   = startPosition;
        }

        //NOTE: select
        if (el.setSelectionRange) {
            el.setSelectionRange(start, end, inverse ? 'backward' : 'forward');
        }
        else {
            el.selectionStart = start;
            el.selectionEnd   = end;
        }
    }

    function checkSelection (el, start, end, inverse) {
        equal(domUtils.getActiveElement(), el, 'selected element is active');
        equal(textSelection.getSelectionStart(el), start, 'start selection correct');
        equal(textSelection.getSelectionEnd(el), end, 'end selection correct');
        equal(textSelection.hasInverseSelection(el), inverse || false, 'selection direction correct');
    }

    function restorePageState () {
        var $input    = $(INPUT_SELECTOR);
        var $textarea = $(TEXTAREA_SELECTOR);

        $textarea.css({
            width:  '250px',
            height: '150px'
        });

        setSelection($input, 0, 0);
        setSelection($textarea, 0, 0);

        $input[0].scrollLeft   = 0;
        $textarea[0].scrollTop = 0;

        document.body.focus();
    }

    function bindHandlers () {
        var input    = $(INPUT_SELECTOR)[0];
        var textarea = $(TEXTAREA_SELECTOR)[0];

        input[startSelectEvent] = function () {
            mousedownOnInput = true;
        };

        input[endSelectEvent] = function () {
            mouseupOnInput = true;
        };

        textarea[startSelectEvent] = function () {
            mousedownOnTextarea = true;
        };

        textarea[endSelectEvent] = function () {
            mouseupOnTextarea = true;
        };
    }

    function unbindHandlers () {
        var input    = $(INPUT_SELECTOR)[0];
        var textarea = $(TEXTAREA_SELECTOR)[0];

        mousedownOnInput    = false;
        mouseupOnInput      = false;
        mousedownOnTextarea = false;
        mouseupOnTextarea   = false;

        input[startSelectEvent] = function () {
        };

        input[endSelectEvent] = function () {
        };

        textarea[startSelectEvent] = function () {
        };

        textarea[endSelectEvent] = function () {
        };
    }

    function runAsyncTest (actions, assertions, timeout) {
        var callbackFunction = function () {
            clearTimeout(timeoutId);
            assertions();

            start();
        };
        asyncActionCallback  = function () {
            callbackFunction();
        };
        actions();
        var timeoutId        = setTimeout(function () {
            callbackFunction = function () {
            };
            ok(false, 'Timeout is exceeded');
            start();
        }, timeout + 5000);
    }

    $('body').css('height', '1500px');

    //NOTE: problem with window.top bodyMargin in IE9 if test 'runAll'
    //because we can't determine that element is in qunit test iframe
    if (browserUtils.isIE9)
        $(window.top.document).find('body').css('marginTop', '0px');

    //tests
    QUnit.testStart(function () {
        asyncActionCallback = function () {
        };

        actionTargetWaitingCounter = 0;
        actionRunCounter           = 0;

        restorePageState();
        bindHandlers();
    });

    QUnit.testDone(function () {
        currentErrorType    = null;
        currentErrorElement = null;
        currentSourceIndex  = null;

        SETTINGS.ENABLE_SOURCE_INDEX = false;

        setValueToInput(INPUT_INITIAL_VALUE);
        setValueToTextarea('');

        unbindHandlers();
    });

    asyncTest('different arguments. not texteditable and contexteditable element', function () {
        var $div      = $(DIV_ELEMENT_SELECTOR);
        var mousedown = false;
        var mouseup   = false;

        runAsyncTest(
            function () {
                $div[0][startSelectEvent] = function () {
                    mousedown = true;
                };

                $div[0][endSelectEvent] = function () {
                    mouseup = true;
                };

                actionsAPI.select($div, 1, 2, 3, 4);
            },
            function () {
                ok(mousedown, 'select started from div element');
                ok(mouseup, 'select ended on div element');

                deepEqual(document.activeElement, $div[0]);

                $div.remove();
            },
            correctTestWaitingTime(4000)
        );
    });

    module('different arguments tests. element is input');

    asyncTest('only dom element as a parameter', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 0, $input[0].value.length);

                equal(actionTargetWaitingCounter, 1);
                equal(actionRunCounter, 1);
            },
            correctTestWaitingTime(4000)
        );
    });

    asyncTest('positive offset as a parameters', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input, 5);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 0, 5);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('and negative offset as a parameters', function () {
        var $input      = $(INPUT_SELECTOR),
            valueLength = $input[0].value.length;

        runAsyncTest(
            function () {
                actionsAPI.select($input, -5);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], valueLength - 5, valueLength, true);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('zero offset as a parameters', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input, 0);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 0, 0);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startPos less than endPos as a parameters', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input, 2, 4);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 2, 4);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startPos more than endPos as a parameters', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input, 4, 2);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 2, 4, true);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startLine, startPos, endLine, endPos as a parameters', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                actionsAPI.select($input, 2, 15, 7, 15);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 2, $input[0].value.length);
            },
            correctTestWaitingTime(2000)
        );
    });

    module('different arguments tests. element is textarea');

    asyncTest('only dom element as a parameter', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS');

                actionsAPI.select($textarea);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 0, $textarea[0].value.length);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('positive offset as a parameters', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS');

                actionsAPI.select($textarea, 5);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 0, 5);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('negative offset as a parameters', function () {
        var $textarea   = $(TEXTAREA_SELECTOR),
            valueLength = null;

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS');

                valueLength = $textarea[0].value.length;

                actionsAPI.select($textarea, -5);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], valueLength - 5, valueLength, true);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startPos less than endPos as a parameters', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS\nqwerty test cafe');

                actionsAPI.select($textarea, 3, 20);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 3, 20);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startPos more than endPos as a parameters', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS\nqwerty test cafe');

                actionsAPI.select($textarea, 20, 3);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 3, 20, true);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startLine, startPos less than endLine, endPos as a parameters', function () {
        var $textarea     = $(TEXTAREA_SELECTOR),
            startPosition = null,
            endPosition   = null;

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS\nqwerty test cafe');

                actionsAPI.select($textarea, 0, 3, 2, 7);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                startPosition = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 0, 3);
                endPosition   = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 2, 7);

                checkSelection($textarea[0], startPosition, endPosition);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startLine, startPos more than endLine, endPos as a parameters', function () {
        var $textarea     = $(TEXTAREA_SELECTOR),
            startPosition = null,
            endPosition   = null;

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS\nqwerty test cafe');

                actionsAPI.select($textarea, 2, 7, 0, 3);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                startPosition = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 0, 3);
                endPosition   = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 2, 7);

                checkSelection($textarea[0], startPosition, endPosition, true);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startLine, startPos equal endLine, endPos as a parameters', function () {
        var $textarea      = $(TEXTAREA_SELECTOR),
            selectPosition = null;

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\nefjtybllsjaLJS\nqwerty test cafe');

                actionsAPI.select($textarea, 2, 7, 2, 7);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                selectPosition = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 2, 7);

                checkSelection($textarea[0], selectPosition, selectPosition);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('startLine, startPos and endLine as a parameters', function () {
        var $textarea     = $(TEXTAREA_SELECTOR),
            textareaValue = '123456789abcd\nefj\nqwerty test cafe',
            startPosition = null;

        runAsyncTest(
            function () {
                setValueToTextarea(textareaValue);

                actionsAPI.select($textarea, 1, 8, 2);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                startPosition = domUtils.getTextareaPositionByLineAndOffset($textarea[0], 1, Math.min(8, textareaValue.split('\n')[1].length));

                checkSelection($textarea[0], startPosition, textareaValue.length);
            },
            correctTestWaitingTime(2000)
        );
    });

    module('incorrect parameters');

    asyncTest('not a number offset raise error', function () {
        var $input = $(INPUT_SELECTOR);

        SETTINGS.ENABLE_SOURCE_INDEX = true;

        actionsAPI.select($input, 'abc', '#34');

        window.setTimeout(function () {
            equal(currentErrorType, ERROR_TYPE.incorrectSelectActionArguments, 'correct error type sent');
            equal(currentSourceIndex, 34);

            start();
        }, correctTestWaitingTime(500));
    });

    asyncTest('negative endPos raise error', function () {
        var $input = $(INPUT_SELECTOR);

        SETTINGS.ENABLE_SOURCE_INDEX = true;

        actionsAPI.select($input, 2, -4, '#12');

        window.setTimeout(function () {
            equal(currentErrorType, ERROR_TYPE.incorrectSelectActionArguments, 'correct error type sent');
            equal(currentSourceIndex, 12);

            start();
        }, correctTestWaitingTime(500));
    });

    asyncTest('negative endLine raise error', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        SETTINGS.ENABLE_SOURCE_INDEX = true;

        actionsAPI.select($textarea, 2, 4, -2, 5, '#56');

        window.setTimeout(function () {
            equal(currentErrorType, ERROR_TYPE.incorrectSelectActionArguments, 'correct error type sent');
            equal(currentSourceIndex, 56);

            start();
        }, correctTestWaitingTime(500));
    });

    module('check the boundary cases');

    asyncTest('select empty input', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                setValueToInput('');

                actionsAPI.select($input);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 0, 0);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('select empty textarea', function () {
        var $textarea = $(TEXTAREA_SELECTOR);

        runAsyncTest(
            function () {
                setValueToTextarea('');

                actionsAPI.select($textarea);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 0, 0);
            },
            correctTestWaitingTime(2000)
        );
    });

    asyncTest('select in input with some spaces in succession', function () {
        var $input = $(INPUT_SELECTOR);

        runAsyncTest(
            function () {
                setValueToInput('1   2     3    4    5      6');

                actionsAPI.select($input, 3, 25);
            },
            function () {
                ok(mousedownOnInput, 'select started from input');
                ok(mouseupOnInput, 'select ended on input');

                checkSelection($input[0], 3, 25);
            },
            correctTestWaitingTime(3000)
        );
    });

    asyncTest('select in textarea with some empty strings', function () {
        var $textarea   = $(TEXTAREA_SELECTOR),
            valueLength = null;

        runAsyncTest(
            function () {
                setValueToTextarea('123456789abcd\n\n\nefghi\njklmop\n\nqwerty test cafe');

                valueLength = $textarea[0].value.length;

                actionsAPI.select($textarea, 3, valueLength - 3);
            },
            function () {
                ok(mousedownOnTextarea, 'select started from textarea');
                ok(mouseupOnTextarea, 'select ended on textarea');

                checkSelection($textarea[0], 3, valueLength - 3);
            },
            correctTestWaitingTime(2000)
        );
    });

    module('scroll in input');

    asyncTest('forward select and scroll', function () {
        var input     = $(INPUT_SELECTOR)[0],
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToInput('1234567891012131415161718911200111554454455454545412121212121212');

                input[startSelectEvent] = function () {
                    equal(style.getElementScroll(input).left, 0);

                    mousedown = true;
                };

                input[endSelectEvent] = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(input).left > 0);

                    mouseup = true;
                };

                actionsAPI.select(input, 3, 33);
            },
            function () {
                ok(mousedown, 'select started from input');
                ok(mouseup, 'select ended on input');

                checkSelection(input, 3, 33);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(input).left > 0);

                expect(checkScrollAfterSelect ? 9 : 7);
            },
            correctTestWaitingTime(3000)
        );
    });

    asyncTest('backward select and scroll', function () {
        var input     = $(INPUT_SELECTOR)[0],
            oldScroll = null,
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToInput('1234567891012131415161718911200111554454455454545412121212121212');

                input[startSelectEvent] = function () {
                    oldScroll = style.getElementScroll(input).left;

                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(input).left > 0);

                    mousedown = true;
                };
                input[endSelectEvent]   = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(input).left < oldScroll);

                    mouseup = true;
                };

                actionsAPI.select(input, 33, 0);
            },
            function () {
                ok(mousedown, 'select started from input');
                ok(mouseup, 'select ended on input');

                checkSelection(input, 0, 33, true);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(input).left < oldScroll);

                expect(checkScrollAfterSelect ? 9 : 6);
            },
            correctTestWaitingTime(5000)
        );
    });

    module('scroll in textarea');

    asyncTest('forward select and right direction (endPos more than startPos)', function () {
        var textarea  = $(TEXTAREA_SELECTOR)[0],
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToTextarea(TEXTAREA_BIG_TEXT);

                $(textarea).css({
                    width:  '400px',
                    height: '100px'
                });

                textarea[startSelectEvent] = function () {
                    equal(style.getElementScroll(textarea).top, 0);

                    mousedown = true;
                };
                textarea[endSelectEvent]   = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(textarea).top > 0);

                    mouseup = true;
                };
                actionsAPI.select(textarea, 2, 628);
            },
            function () {
                ok(mousedown, 'select started from textarea');
                ok(mouseup, 'select ended on textarea');

                checkSelection(textarea, 2, 628);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(textarea).top > 0);

                expect(checkScrollAfterSelect ? 9 : 7);
            },
            correctTestWaitingTime(5000)
        );
    });

    asyncTest('forward select and left direction (endPos less than startPos)', function () {
        var textarea  = $(TEXTAREA_SELECTOR)[0],
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToTextarea(TEXTAREA_BIG_TEXT);

                $(textarea).css({
                    width:  '400px',
                    height: '100px'
                });

                textarea[startSelectEvent] = function () {
                    equal(style.getElementScroll(textarea).top, 0);

                    mousedown = true;
                };
                textarea[endSelectEvent]   = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(textarea).top > 0);

                    mouseup = true;
                };
                actionsAPI.select(textarea, 34, 591);
            },
            function () {
                ok(mousedown, 'select started from textarea');
                ok(mouseup, 'select ended on textarea');

                checkSelection(textarea, 34, 591, false);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(textarea).top > 0);

                expect(checkScrollAfterSelect ? 9 : 7);
            },
            correctTestWaitingTime(5000)
        );
    });

    asyncTest('backward select and right direction (endPos less than startPos)', function () {
        var textarea  = $(TEXTAREA_SELECTOR)[0],
            oldScroll = null,
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToTextarea(TEXTAREA_BIG_TEXT);

                $(textarea).css({
                    width:  '400px',
                    height: '100px'
                });

                textarea[startSelectEvent] = function () {
                    oldScroll = style.getElementScroll(textarea).top;

                    if (checkScrollAfterSelect)
                        ok(oldScroll > 0);

                    mousedown = true;
                };
                textarea[endSelectEvent]   = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(textarea).top < oldScroll);

                    mouseup = true;
                };

                actionsAPI.select(textarea, 591, 34);
            },
            function () {
                ok(mousedown, 'select started from textarea');
                ok(mouseup, 'select ended on textarea');

                checkSelection(textarea, 34, 591, true);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(textarea).top < oldScroll);

                expect(checkScrollAfterSelect ? 9 : 6);
            },
            correctTestWaitingTime(5000)
        );
    });

    asyncTest('backward select and left direction (endPos more than startPos)', function () {
        var textarea  = $(TEXTAREA_SELECTOR)[0],
            oldScroll = null,
            mousedown = false,
            mouseup   = false;

        runAsyncTest(
            function () {
                setValueToTextarea(TEXTAREA_BIG_TEXT);

                $(textarea).css({
                    width:  '400px',
                    height: '100px'
                });

                document.body[startSelectEvent] = function () {
                    oldScroll = style.getElementScroll(textarea).top;

                    if (checkScrollAfterSelect)
                        ok(oldScroll > 0);

                    mousedown = true;
                };
                document.body[endSelectEvent]   = function () {
                    if (checkScrollAfterSelect)
                        ok(style.getElementScroll(textarea).top < oldScroll);

                    mouseup = true;
                };

                actionsAPI.select(textarea, 628, 2);
            },
            function () {
                ok(mousedown, 'select started from textarea');
                ok(mouseup, 'select ended on textarea');

                checkSelection(textarea, 2, 628, true);

                if (checkScrollAfterSelect)
                    ok(style.getElementScroll(textarea).top < oldScroll);

                expect(checkScrollAfterSelect ? 9 : 6);
            },
            correctTestWaitingTime(5000)
        );
    });
});
