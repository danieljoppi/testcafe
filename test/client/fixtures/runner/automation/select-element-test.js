var hammerhead   = window.getTestCafeModule('hammerhead');
var browserUtils = hammerhead.utils.browser;
var shadowUI     = hammerhead.shadowUI;

var testCafeCore = window.getTestCafeModule('testCafeCore');
var ERROR_TYPE   = testCafeCore.ERROR_TYPE;
var SETTINGS     = testCafeCore.get('./settings').get();

var testCafeRunner             = window.getTestCafeModule('testCafeRunner');
var StepIterator               = testCafeRunner.get('./step-iterator');
var actionsAPI                 = testCafeRunner.get('./api/actions');
var automation                 = testCafeRunner.get('./automation/automation');
var clickPlaybackAutomation    = testCafeRunner.get('./automation/playback/click');
var PressAutomation            = testCafeRunner.get('./automation/playback/press');
var dblClickPlaybackAutomation = testCafeRunner.get('./automation/playback/dblclick');
var parseKeyString             = testCafeRunner.get('./automation/playback/press/parse-key-string');

var testCafeUI    = window.getTestCafeModule('testCafeUI');
var selectElement = testCafeUI.get('./select-element');

automation.init();

var stepIterator = new StepIterator();
actionsAPI.init(stepIterator);

$(document).ready(function () {
    //consts
    var TEST_ELEMENT_CLASS = 'testElement',
        OPTION_CLASS       = 'tcOption',
        OPTION_GROUP_CLASS = 'tcOptionGroup',
        OPTION_LIST_CLASS  = 'tcOptionList';

    //utils
    var currentErrorType         = null,
        currentErrorElement      = null,
        currentActionSourceIndex = null,
        handlersLog              = [];

    var isMobileBrowser = browserUtils.isSafari && browserUtils.hasTouchEvents || browserUtils.isAndroid;

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

        runArgumentsIterator(items, seriesActionsRun, function () {
        });
    };

    stepIterator.on(StepIterator.ERROR_EVENT, function (err) {
        stepIterator.state.stoppedOnFail = false;
        currentErrorType                 = err.type;
        currentActionSourceIndex         = err.__sourceIndex;

        if (err.element)
            currentErrorElement = err.element;
    });

    var createOption = function (parent, text) {
        return $('<option></option>').text(text)
            .addClass(TEST_ELEMENT_CLASS)
            .appendTo(parent);
    };

    var createOptionGroup = function (select, label) {
        return $('<optgroup></optgroup>').attr('label', label)
            .addClass(TEST_ELEMENT_CLASS)
            .appendTo(select)[0];
    };

    var createSelect = function (size) {
        var select = $('<select><select/>')
            .addClass(TEST_ELEMENT_CLASS)
            .appendTo('body')[0];

        createOption(select, 'one');
        createOption(select, 'two');
        createOption(select, 'three');
        createOption(select, 'four');
        createOption(select, 'five');

        if (size)
            $(select).attr('size', size);

        return select;
    };

    var createSelectWithGroups = function () {
        var select = $('<select><select/>')
            .addClass(TEST_ELEMENT_CLASS)
            .appendTo('body')[0];

        var firstGroup = createOptionGroup(select, 'First');
        createOption(firstGroup, 'one');
        createOption(firstGroup, 'two');
        createOption(firstGroup, 'three');

        var secondGroup = createOptionGroup(select, 'Second');
        createOption(secondGroup, 'four');
        createOption(secondGroup, 'five');
        createOption(secondGroup, 'six');

        var thirdGroup = createOptionGroup(select, 'Third');
        createOption(thirdGroup, 'sevent');
        createOption(thirdGroup, 'eight');
        createOption(thirdGroup, 'nine');
        return select;
    };

    var createSelectWithGroupsForCheckPress = function () {
        var select = $('<select><select/>')
            .addClass(TEST_ELEMENT_CLASS)
            .appendTo('body')[0];

        var firstGroup = createOptionGroup(select, 'Group 1');
        createOption(firstGroup, 'one');

        var secondGroup = createOptionGroup(select, 'Group 2');
        createOption(secondGroup, 'two');

        var thirdGroup = createOptionGroup(select, 'Group 3');
        createOption(thirdGroup, 'thee');
        $(thirdGroup).attr('disabled', 'disabled');

        createOption(select, 'four');

        return select;
    };

    var runPressAutomation = function (keys, callback) {
        var pressAutomation = new PressAutomation(parseKeyString(keys).combinations);

        pressAutomation
            .run()
            .then(callback);
    };

    var preventDefault = function (e) {
        var ev = e || window.event;
        if (ev.preventDefault)
            ev.preventDefault();
        else
            ev.returnValue = false;
    };

    var eventHandler = function (e) {
        if (e.target === this)
            handlersLog.push(e.target.tagName.toLowerCase() + ' ' + e.type);
    };

    var bindSelectAndOptionHandlers = function ($select, $option) {
        $select.bind('mousedown', eventHandler);
        $select.bind('mouseup', eventHandler);
        $select.bind('click', eventHandler);
        $select.bind('change', eventHandler);

        if ($option) {
            $option.bind('mousedown', eventHandler);
            $option.bind('mouseup', eventHandler);
            $option.bind('click', eventHandler);
        }
    };

    $('body').css('height', 1500);

    var startNext = function () {
        if (browserUtils.isIE) {
            removeTestElements();
            window.setTimeout(start, 30);
        }
        else
            start();
    };

    var removeTestElements = function () {
        $('.' + TEST_ELEMENT_CLASS).remove();
    };

    var pressDownUpKeysActions = function (select) {
        window.async.series({
            firstPressDownAction:  function (callback) {
                equal(select.selectedIndex, 0);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            secondPressDownAction: function (callback) {
                equal(select.selectedIndex, 1);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 2);
                    callback();
                });
            },
            thirdPressDownAction:  function (callback) {
                equal(select.selectedIndex, 2);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 3);
                    callback();
                });
            },
            fourthPressDownAction: function (callback) {
                equal(select.selectedIndex, 3);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 4);
                    callback();
                });
            },
            firstPressUpAction:    function (callback) {
                equal(select.selectedIndex, 4);

                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 3);
                    callback();
                });
            },
            secondPressUpAction:   function (callback) {
                equal(select.selectedIndex, 3);

                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 2);
                    callback();
                });
            },
            thirdPressUpAction:    function (callback) {
                equal(select.selectedIndex, 2);

                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            fourthPressUpAction:   function () {
                equal(select.selectedIndex, 1);

                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 0);
                    startNext();
                });
            }
        });
    };

    var pressRightLeftKeysActions = function (select) {
        window.async.series({
            firstPressRightAction:  function (callback) {
                equal(select.selectedIndex, 0);

                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 1 : 0);
                    callback();
                });
            },
            secondPressRightAction: function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 1 : 0);

                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 2 : 0);
                    callback();
                });
            },
            thirdPressRightAction:  function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 2 : 0);

                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 3 : 0);
                    callback();
                });
            },
            fourthPressRightAction: function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 3 : 0);

                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 4 : 0);
                    callback();
                });
            },
            firstPressLeftAction:   function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 4 : 0);

                runPressAutomation('left', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 3 : 0);
                    callback();
                });
            },
            secondPressLeftAction:  function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 3 : 0);

                runPressAutomation('left', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 2 : 0);
                    callback();
                });
            },
            thirdPressLeftAction:   function (callback) {
                equal(select.selectedIndex, browserUtils.isFirefox ? 2 : 0);

                runPressAutomation('left', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 1 : 0);
                    callback();
                });
            },
            fourthPressLeftAction:  function () {
                equal(select.selectedIndex, browserUtils.isFirefox ? 1 : 0);

                runPressAutomation('left', function () {
                    equal(select.selectedIndex, 0);
                    startNext();
                });
            }
        });
    };

    var pressDownUpKeysActionsForSelectWithOptgroups = function (select, testCallback) {
        window.async.series({
            pressDownFirstTime:  function (callback) {
                equal(select.selectedIndex, 0);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            pressDownSecondTime: function (callback) {
                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 3);
                    callback();
                });
            },
            pressUpFirstTime:    function (callback) {
                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            pressUpSecondTime:   function () {
                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 0);
                    testCallback();
                });
            }
        });
    };

    var pressRightLeftKeysActionsForSelectWithOptgroups = function ($select, testCallback, notChangeInChrome) {
        window.async.series({
            pressDownFirstTime:  function (callback) {
                equal($select.selectedIndex, 0);

                runPressAutomation('right', function () {
                    equal($select.selectedIndex, browserUtils.isIE || notChangeInChrome ? 0 : 1);
                    callback();
                });
            },
            pressDownSecondTime: function (callback) {
                runPressAutomation('right', function () {
                    equal($select.selectedIndex, browserUtils.isIE || notChangeInChrome ? 0 : 3);
                    callback();
                });
            },
            pressUpFirstTime:    function (callback) {
                runPressAutomation('left', function () {
                    equal($select.selectedIndex, browserUtils.isIE || notChangeInChrome ? 0 : 1);
                    callback();
                });
            },
            pressUpSecondTime:   function () {
                runPressAutomation('up', function () {
                    equal($select.selectedIndex, browserUtils.isIE || notChangeInChrome ? 0 : 0);
                    testCallback();
                });
            }
        });
    };

    QUnit.testDone(function () {
        if (!browserUtils.isIE)
            removeTestElements();
        handlersLog                  = [];
        SETTINGS.ENABLE_SOURCE_INDEX = false;
    });

    //tests
    module('common tests');
    asyncTest('option list doesn\'t open if mousedown event prevented', function () {
        var select = createSelect();

        select['onmousedown'] = preventDefault;

        equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);

        clickPlaybackAutomation(select, {}, function () {
            equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);
            startNext();
        });
    });

    asyncTest('click on option in a collapsed option list raises error', function () {
        SETTINGS.ENABLE_SOURCE_INDEX = true;
        var select                   = createSelect();
        var option                   = $(select).children()[1];

        actionsAPI.click(option, '#312');

        setTimeout(function () {
            equal(currentErrorType, ERROR_TYPE.invisibleActionElement);
            equal(currentErrorElement, '<option class="testElement">');
            equal(currentActionSourceIndex, 312);

            startNext();
        }, 1500);
    });

    // NOTE: Android and iOS ignore the size and multiple attributes, all select elements behave like select with size=1
    if (isMobileBrowser) {
        asyncTest('in select elements with "size" more than 1, click on an option raises an error when the option list is collapsed', function () {
            SETTINGS.ENABLE_SOURCE_INDEX = true;
            var select                   = createSelect(2);
            var option                   = $(select).children()[1];

            actionsAPI.click(option, '#312');

            setTimeout(function () {
                equal(currentErrorType, ERROR_TYPE.invisibleActionElement);
                equal(currentErrorElement, '<option class="testElement">');
                equal(currentActionSourceIndex, 312);

                startNext();
            }, 1500);
        });

        asyncTest('in select elements with the "multiple" attribute, click on an option raises an error when option list is collapsed', function () {
            SETTINGS.ENABLE_SOURCE_INDEX = true;
            var select                   = createSelect();
            var option                   = $(select).children()[1];

            $(select).attr('multiple', 'multiple');

            actionsAPI.click(option, '#312');

            setTimeout(function () {
                equal(currentErrorType, ERROR_TYPE.invisibleActionElement);
                equal(currentErrorElement, '<option class="testElement">');
                equal(currentActionSourceIndex, 312);

                startNext();
            }, 1500);
        });
    }

    module('mouse actions with select element');
    asyncTest('click on select and on option', function () {
        var select = createSelect(),
            option = $(select).children()[2];

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);

            clickPlaybackAutomation(option, {}, function () {
                equal(select.selectedIndex, 2);
                window.setTimeout(function () {
                    startNext();
                }, 0);
            });
        });
    });

    module('press actions with select element');
    asyncTest('press down/up/right/left when option list closed', function () {
        var select = createSelect();

        $(select).focus();

        window.async.series({
            pressDownAction:  function (callback) {
                equal(select.selectedIndex, 0);

                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            pressUpAction:    function (callback) {
                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 0);
                    callback();
                });
            },
            pressRightAction: function (callback) {
                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isIE ? 0 : 1);
                    callback();
                });
            },
            pressLeftAction:  function () {
                runPressAutomation('left', function () {
                    equal(select.selectedIndex, 0);
                    startNext();
                });
            }
        });
    });

    asyncTest('press down/up/right/left when option list opened', function () {
        var select = createSelect();

        window.async.series({
            openSelectList:   function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    //NOTE: we should wait for binding handlers to the document
                    equal(select.selectedIndex, 0);
                    window.setTimeout(callback, 0);
                });
            },
            pressDownAction:  function (callback) {
                runPressAutomation('down', function () {
                    equal(select.selectedIndex, 1);
                    callback();
                });
            },
            pressUpAction:    function (callback) {
                runPressAutomation('up', function () {
                    equal(select.selectedIndex, 0);
                    callback();
                });
            },
            pressRightAction: function (callback) {
                runPressAutomation('right', function () {
                    equal(select.selectedIndex, browserUtils.isFirefox ? 1 : 0);
                    callback();
                });
            },
            pressLeftAction:  function (callback) {
                runPressAutomation('left', function () {
                    equal(select.selectedIndex, 0);
                    callback();
                });
            },
            closeSelectList:  function () {
                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(startNext, 0);
                });
            }
        });
    });

    asyncTest('click select and press enter', function () {
        var select = createSelect();

        window.async.series({
            'Click on select': function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(callback, 0);
                });
            },

            'Press enter': function (callback) {
                equal(select, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
                equal(select.selectedIndex, 0);

                runPressAutomation('enter', callback);
            },

            'Check assertions': function () {
                equal(select, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), false);
                equal(select.selectedIndex, 0);
                startNext();
            }
        });
    });

    asyncTest('click select and press tab', function () {
        var select = createSelect();

        window.async.series({
            'Click on select': function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(callback, 0);
                });
            },

            'Press tab': function (callback) {
                runPressAutomation('tab', callback);
            },

            'Check assertions': function () {
                notEqual(select, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), false);
                equal(select.selectedIndex, 0);
                startNext();
            }
        });
    });

    asyncTest('click select and press esc', function () {
        var select = createSelect();

        window.async.series({
            'Click on select': function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(callback, 0);
                });
            },

            'Press esc': function (callback) {
                runPressAutomation('esc', callback);
            },

            'Check assertions': function () {
                equal(select, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), false);
                equal(select.selectedIndex, 0);
                startNext();
            }
        });
    });

    // NOTE: Android and iOS ignore the size and multiple attributes, all select elements behave like select with size=1
    if (isMobileBrowser) {
        module('mouse actions with multiline select element');
        asyncTest('click on the "select" element with the "size" attribute greater than one, then click on an option', function () {
            var select = createSelect(2);

            clickPlaybackAutomation(select, {}, function () {
                ok(selectElement.isOptionListExpanded(select));
                startNext();
            });
        });

        asyncTest('click on the "select" element with the "multiple" attribute, then click on an option', function () {
            var select = createSelect();

            $(select).attr('multiple', 'multiple');

            clickPlaybackAutomation(select, {}, function () {
                ok(selectElement.isOptionListExpanded(select));
                startNext();
            });
        });
    }
    else {
        module('mouse actions with select element with attribute size more than one');
        asyncTest('click on option', function () {
            var select = createSelect(2);

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            clickPlaybackAutomation($(select).children()[1], {}, function () {
                equal(select.selectedIndex, 1);
                startNext();
            });
        });

        asyncTest('click on option with scroll', function () {
            var select = createSelect(2);

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            clickPlaybackAutomation($(select).children(':last')[0], {}, function () {
                equal(select.selectedIndex, 4);
                startNext();
            });
        });

        asyncTest('click on disabled option', function () {
            var select  = createSelect(2),
                $option = $(select).children(':first');

            $option.attr('disabled', 'disabled');

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            clickPlaybackAutomation($option[0], {}, function () {
                equal(select.selectedIndex, 0);
                startNext();
            });
        });

        asyncTest('click on an option (the select size is more than the option count)', function () {
            var select = createSelect(10);

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            clickPlaybackAutomation($(select).children()[3], {}, function () {
                equal(select.selectedIndex, 3);
                startNext();
            });
        });

        module('press actions with select element with attribute size more than one');
        asyncTest('press down/up in select', function () {
            var select = createSelect();

            $(select).attr('size', '2');
            //NOTE: IE11 sets selectedIndex = -1 after setting attribute size != 1
            select.selectedIndex = 0;
            $(select).focus();

            pressDownUpKeysActions(select);
        });

        asyncTest('press right/left in select', function () {
            var select = createSelect();

            $(select).attr('size', '2');
            //NOTE: IE11 sets selectedIndex = -1 after setting attribute size != 1
            select.selectedIndex = 0;
            $(select).focus();

            pressRightLeftKeysActions(select);
        });

        asyncTest('press down/up in select with "size" more than the option count', function () {
            var select = createSelect();

            $(select).attr('size', '10');
            //NOTE: IE11 sets selectedIndex = -1 after setting attribute size != 1
            select.selectedIndex = 0;
            $(select).focus();

            pressDownUpKeysActions(select);
        });

        asyncTest('press right/left in select with "size" more than the option count', function () {
            var select = createSelect();

            $(select).attr('size', '10');
            //NOTE: IE11 sets selectedIndex = -1 after setting attribute size != 1
            select.selectedIndex = 0;
            $(select).focus();

            pressRightLeftKeysActions(select);
        });


        module('mouse actions with the "select" element with the "multiple" attribute');
        asyncTest('click on option with scroll', function () {
            var select = createSelect();

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            $(select).attr('multiple', 'multiple');
            clickPlaybackAutomation($(select).children(':last')[0], {}, function () {
                equal(select.selectedIndex, 4);
                startNext();
            });
        });

        asyncTest('click on option with scroll (attribute size more than one)', function () {
            var select = createSelect(2);

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            $(select).attr('multiple', 'multiple');
            clickPlaybackAutomation($(select).children(':last')[0], {}, function () {
                equal(select.selectedIndex, 4);
                startNext();
            });
        });

        asyncTest('click on option with scroll (attribute size less than one)', function () {
            var select = createSelect(-1);

            select.selectedIndex = 0;
            equal(select.selectedIndex, 0);
            $(select).attr('multiple', 'multiple');
            clickPlaybackAutomation($(select).children(':last')[0], {}, function () {
                equal(select.selectedIndex, 4);
                startNext();
            });
        });
    }

    module('mouse actions with select with option groups');
    asyncTest('click select and option', function () {
        var select        = createSelectWithGroups(),
            option        = $(select).find('option')[3],
            changeHandled = false;

        //T280587 - Selecting an option does not trigger the on('change', ...) event
        select.onchange = function () {
            changeHandled = true;
        };

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 9);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 3);

            clickPlaybackAutomation(option, {}, function () {
                window.setTimeout(function () {
                    equal(select.selectedIndex, 3);
                    ok(changeHandled, 'change event raised');
                    startNext();
                }, 0);
            });
        });
    });

    asyncTest('click select and option (optgroup with empty label)', function () {
        var select    = createSelectWithGroups(),
            $optgroup = $(select).find('optgroup').eq(0).attr('label', ''),
            option    = $optgroup.find('option')[1];

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 9);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 3);

            clickPlaybackAutomation(option, {}, function () {
                equal(select.selectedIndex, 1);
                window.setTimeout(function () {
                    startNext();
                }, 0);
            });
        });
    });

    asyncTest('click select and option (in disabled group)', function () {
        var select    = createSelectWithGroups(),
            $optgroup = $(select).find('optgroup').eq(1).attr('disabled', ''),
            option    = $optgroup.find('option')[0];

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 9);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 3);

            clickPlaybackAutomation(option, {}, function () {
                equal(select.selectedIndex, 0);
                clickPlaybackAutomation($(select).find('option')[1], {}, function () {
                    equal(select.selectedIndex, 1);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            });
        });
    });

    asyncTest('click select and optgroup', function () {
        var select = createSelectWithGroups(),
            group  = $(select).find('optgroup')[2];

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 9);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 3);

            clickPlaybackAutomation(group, {}, function () {
                equal(select.selectedIndex, 0);

                //NOTE: to close options list
                clickPlaybackAutomation($(select).find('option')[1], {}, function () {
                    equal(select.selectedIndex, 1);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            });
        });
    });

    asyncTest('click select and option in subgroup', function () {
        var select       = createSelectWithGroups(),
            $optgroup    = $(select).find('optgroup').eq(1),
            $newOptgroup = $('<optgroup label="subgroup"></optgroup>')
                .addClass(TEST_ELEMENT_CLASS)
                .appendTo($optgroup[0]),
            $newOption   = $('<option></option>').text('sub option')
                .addClass(TEST_ELEMENT_CLASS)
                .appendTo($newOptgroup[0]);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 10);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 4);

            clickPlaybackAutomation($newOption[0], {}, function () {
                equal(select.selectedIndex, 6);
                window.setTimeout(function () {
                    startNext();
                }, 0);
            });
        });
    });

    asyncTest('click select and subgroup', function () {
        var select       = createSelectWithGroups(),
            $optgroup    = $(select).find('optgroup').eq(1),
            $newOptgroup = $('<optgroup label="subgroup"></optgroup>')
                .addClass(TEST_ELEMENT_CLASS)
                .appendTo($optgroup[0]),
            $newOption   = $('<option></option>').text('sub option')
                .addClass(TEST_ELEMENT_CLASS)
                .appendTo($newOptgroup[0]);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 10);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 4);

            clickPlaybackAutomation($newOptgroup[0], {}, function () {
                equal(select.selectedIndex, 0);

                //NOTE: to close options list
                clickPlaybackAutomation($(select).find('option')[1], {}, function () {
                    equal(select.selectedIndex, 1);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            });
        });
    });

    asyncTest('click select and option out of group', function () {
        var select     = createSelectWithGroups(),
            $optgroup  = $(select).find('optgroup').eq(1),
            $newOption = $('<option></option>').text('outer option')
                .addClass(TEST_ELEMENT_CLASS)
                .insertAfter($optgroup);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);
            equal(shadowUI.select('.' + OPTION_CLASS).length, 10);
            equal(shadowUI.select('.' + OPTION_GROUP_CLASS).length, 3);

            clickPlaybackAutomation($newOption[0], {}, function () {
                equal(select.selectedIndex, 6);
                window.setTimeout(function () {
                    startNext();
                }, 0);
            });
        });
    });


    module('press actions with select with option groups');
    asyncTest('press down/up when option list closed', function () {
        var select = createSelectWithGroupsForCheckPress();

        select.selectedIndex = 0;
        $(select).focus();

        pressDownUpKeysActionsForSelectWithOptgroups(select, startNext);
    });

    asyncTest('press right/left when option list closed', function () {
        var select = createSelectWithGroupsForCheckPress();

        select.selectedIndex = 0;
        $(select).focus();

        pressRightLeftKeysActionsForSelectWithOptgroups(select, startNext);
    });

    asyncTest('press down/up when option list opened', function () {
        var select = createSelectWithGroupsForCheckPress();

        select.selectedIndex = 0;
        $(select).focus();

        window.async.series({
            openSelectList:                               function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    //NOTE: we should wait for binding handlers to the document
                    equal(select.selectedIndex, 0);
                    window.setTimeout(callback, 0);
                });
            },
            pressDownUpKeysActionsForSelectWithOptgroups: function (callback) {
                pressDownUpKeysActionsForSelectWithOptgroups(select, callback);
            },
            closeSelectList:                              function () {
                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(startNext, 0);
                });
            }
        });
    });

    asyncTest('press right/left when option list opened', function () {
        var select = createSelectWithGroupsForCheckPress();

        window.async.series({
            openSelectList:                                  function (callback) {
                equal(select.selectedIndex, 0);

                clickPlaybackAutomation(select, {}, function () {
                    //NOTE: we should wait for binding handlers to the document
                    equal(select.selectedIndex, 0);
                    window.setTimeout(callback, 0);
                });
            },
            pressRightLeftKeysActionsForSelectWithOptgroups: function (callback) {
                pressRightLeftKeysActionsForSelectWithOptgroups(select, callback, browserUtils.isWebKit);
            },
            closeSelectList:                                 function () {
                clickPlaybackAutomation(select, {}, function () {
                    window.setTimeout(startNext, 0);
                });
            }
        });
    });

    // Android and iOS ignore the size and multiple attributes, all select elements behave like select with size=1
    if (!isMobileBrowser) {
        module('mouse actions with select with the "groups" option and size more than one');
        asyncTest('click optgroup', function () {
            var select           = createSelectWithGroups(),
                $select          = $(select),
                group            = $select.find('optgroup')[0];

            $select.attr('size', '4');
            select.selectedIndex = 0;

            window.setTimeout(function () {
                //NOTE: when setting the selected option, IE and Mozilla scroll the select
                $select.scrollTop(0);
                clickPlaybackAutomation(group, {}, function () {
                    equal(select.selectedIndex, 0);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click option', function () {
            var select           = createSelectWithGroups(),
                $select          = $(select),
                option           = $select.find('option')[1];

            $select.css({
                position: 'absolute',
                top:      '200px',
                left:     '300px'
            });
            $select.attr('size', '5');
            select.selectedIndex = 0;

            window.setTimeout(function () {
                //NOTE: when setting the selected option, IE and Mozilla scroll the select
                $select.scrollTop(0);
                clickPlaybackAutomation(option, {}, function () {
                    equal($select.scrollTop(), 0);
                    equal(select.selectedIndex, 1);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click option with scroll down', function () {
            var select              = createSelectWithGroups(),
                $select             = $(select),
                option              = $select.find('option')[8],
                selectElementScroll = 0;

            $select.css({
                position: 'absolute',
                top:      '200px',
                left:     '300px'
            });
            $select.attr('size', '5');
            select.selectedIndex    = 0;
            //NOTE: when setting the selected option, IE and Mozilla scroll the select
            $select.scrollTop(selectElementScroll);

            window.setTimeout(function () {
                equal($select.scrollTop(), selectElementScroll);
                clickPlaybackAutomation(option, {}, function () {
                    ok($select.scrollTop() > selectElementScroll);
                    equal(select.selectedIndex, 8);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click option with scroll up', function () {
            var select              = createSelectWithGroups(),
                $select             = $(select),
                option              = $select.find('option')[4],
                selectElementScroll = 119;

            $select.css({
                position: 'absolute',
                top:      '200px',
                left:     '300px'
            });
            $select.attr('size', '5');
            select.selectedIndex    = 8;
            $select.scrollTop(selectElementScroll);

            window.setTimeout(function () {
                ok($select.scrollTop() > 0);
                clickPlaybackAutomation(option, {}, function () {
                    ok(selectElementScroll > $select.scrollTop());
                    equal(select.selectedIndex, 4);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click option in subgroup', function () {
            var select           = createSelectWithGroups(),
                $select          = $(select),
                $optgroup        = $select.find('optgroup').eq(1),
                $newOptgroup     = $('<optgroup label="subgroup"></optgroup>')
                    .addClass(TEST_ELEMENT_CLASS)
                    .appendTo($optgroup[0]),
                $newOption       = $('<option></option>').text('sub option')
                    .addClass(TEST_ELEMENT_CLASS)
                    .appendTo($newOptgroup[0]);

            $select.css({
                position: 'absolute',
                top:      '200px',
                left:     '300px'
            });
            $select.attr('size', '5');
            select.selectedIndex = 0;

            window.setTimeout(function () {
                //NOTE: when setting the selected option, IE and Mozilla scroll the select
                $select.scrollTop(0);
                clickPlaybackAutomation($newOption[0], {}, function () {
                    ok($select.scrollTop() > 0);
                    equal(select.selectedIndex, 6);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click subgroup', function () {
            var select           = createSelectWithGroups(),
                $select          = $(select),
                $optgroup        = $select.find('optgroup').eq(1),
                $newOptgroup     = $('<optgroup label="subgroup"></optgroup>')
                    .addClass(TEST_ELEMENT_CLASS)
                    .appendTo($optgroup[0]),
                $newOption       = $('<option></option>').text('sub option')
                    .addClass(TEST_ELEMENT_CLASS)
                    .appendTo($newOptgroup[0]);

            $select.css({
                position: 'absolute',
                top:      '200px',
                left:     '300px'
            });
            $select.attr('size', '5');
            select.selectedIndex = 0;

            window.setTimeout(function () {
                //NOTE: when setting the selected option, IE and Mozilla scroll the select
                $select.scrollTop(0);
                clickPlaybackAutomation($newOptgroup[0], {}, function () {
                    ok($select.scrollTop() > 0);
                    equal(select.selectedIndex, 0);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });

        asyncTest('click option out of group', function () {
            var select           = createSelectWithGroups(),
                $select          = $(select),
                $optgroup        = $select.find('optgroup').eq(2),
                $newOption       = $('<option></option>').text('outer option')
                    .addClass(TEST_ELEMENT_CLASS)
                    .insertAfter($optgroup);

            $select.attr('size', '5');
            select.selectedIndex = 0;

            window.setTimeout(function () {
                //NOTE: when setting the selected option, IE and Mozilla scroll the select
                $select.scrollTop(0);
                clickPlaybackAutomation($newOption[0], {}, function () {
                    ok($select.scrollTop() > 0);
                    equal(select.selectedIndex, 9);
                    window.setTimeout(function () {
                        startNext();
                    }, 0);
                });
            }, 100);
        });


        module('press actions with select with the "groups" option and size more than one');
        asyncTest('press down/up', function () {
            var select           = createSelectWithGroupsForCheckPress();

            $(select).attr('size', '5');
            select.selectedIndex = 0;
            $(select).focus();

            pressDownUpKeysActionsForSelectWithOptgroups(select, startNext);
        });

        asyncTest('press right/left', function () {
            var select           = createSelectWithGroupsForCheckPress();

            $(select).attr('size', '5');
            select.selectedIndex = 0;
            $(select).focus();

            pressRightLeftKeysActionsForSelectWithOptgroups(select, startNext, browserUtils.isWebKit);
        });
    }

    module('regression');
    asyncTest('B237794 - Select options list doesn\'t close after dblclick in Chrome and Opera (dblclick)', function () {
        var select = createSelect();

        equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);

        dblClickPlaybackAutomation(select, {}, function () {
            equal(select, document.activeElement);
            notEqual($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
            equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);
            equal(select.selectedIndex, 0);
            startNext();
        });
    });

    asyncTest('B237794 - Select options list doesn\'t close after dblclick in Chrome and Opera (dblclick)', function () {
        var select = createSelect();

        equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);

        dblClickPlaybackAutomation(select, {}, function () {
            equal(select, document.activeElement);
            notEqual($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
            equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);
            equal(select.selectedIndex, 0);
            startNext();
        });
    });

    asyncTest('B237794 - Select options list doesn\'t close after dblclick in Chrome and Opera (two successive clicks)', function () {
        var select = createSelect();

        equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);

        window.async.series({
            'First click':                      function (callback) {
                clickPlaybackAutomation(select, {}, callback);
            },
            'Check assertions and set timeout': function (callback) {
                equal(select, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
                equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 1);
                equal(select.selectedIndex, 0);

                window.setTimeout(callback, 500);
            },
            'Second click':                     function (callback) {
                clickPlaybackAutomation(select, {}, callback);
            },
            'Check assertions':                 function () {
                equal(select, document.activeElement);
                notEqual($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
                equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);
                equal(select.selectedIndex, 0);
                startNext();
            }
        });
    });

    asyncTest('B238984 - After click on select element and then click on another first opened options list doesn\'t closed', function () {
        var firstSelect         = createSelect(),
            secondSelect        = createSelect(),
            $secondSelectOption = $(secondSelect).find('option').last();

        equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);

        window.async.series({
            'Click on the first select': function (callback) {
                clickPlaybackAutomation(firstSelect, {}, callback);
            },

            'Check assertions after the first click': function (callback) {
                equal(firstSelect, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
                equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 1);
                equal(firstSelect.selectedIndex, 0);
                window.setTimeout(callback, 500);
            },

            'Click on the second select': function (callback) {
                clickPlaybackAutomation(secondSelect, {}, callback);
            },

            'Check assertions after the second click': function (callback) {
                equal(secondSelect, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), true);
                equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 1);
                equal(firstSelect.selectedIndex, 0);
                window.setTimeout(callback, 500);
            },

            'Click on the second select option': function (callback) {
                clickPlaybackAutomation($secondSelectOption[0], {}, callback);
            },

            'Check assertions': function () {
                equal(secondSelect, document.activeElement);
                equal($(shadowUI.select('.' + OPTION_LIST_CLASS)).is(':visible'), false);
                equal(shadowUI.select('.' + OPTION_LIST_CLASS).length, 0);
                equal(firstSelect.selectedIndex, 0);
                equal(secondSelect.selectedIndex, $(secondSelect).find('option').length - 1);
                window.setTimeout(function () {
                    startNext();
                }, 0);
            }
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on select and option)', function () {
        var select  = createSelect(),
            $option = $(select).children().eq(2);

        //bind handlers
        bindSelectAndOptionHandlers($(select), $option);
        equal(select.selectedIndex, 0);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);

            clickPlaybackAutomation($option[0], {}, function () {
                equal(select.selectedIndex, 2);
                if (browserUtils.isFirefox)
                    equal(handlersLog.join(), 'select mousedown,select mouseup,select click,option mousedown,option mouseup,select change,option click');
                else if (browserUtils.isIE)
                    equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select mousedown,select mouseup,select change,option click');
                else if (isMobileBrowser)
                    equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change');
                else
                    equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change,select mouseup,select click');
                startNext();
            });
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on select and the same option)', function () {
        var select  = createSelect(),
            $option = $(select).children().eq(2);

        //bind handlers
        bindSelectAndOptionHandlers($(select), $option);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);

            clickPlaybackAutomation($option[0], {}, function () {
                equal(select.selectedIndex, 2);
                clickPlaybackAutomation(select, {}, function () {
                    equal(select.selectedIndex, 2);
                    clickPlaybackAutomation($option[0], {}, function () {
                        equal(select.selectedIndex, 2);

                        if (browserUtils.isFirefox)
                            equal(handlersLog.join(), 'select mousedown,select mouseup,select click,option mousedown,option mouseup,select change,option click,select mousedown,select mouseup,select click,option mousedown,option mouseup,option click');
                        else if (browserUtils.isIE)
                            equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select mousedown,select mouseup,select change,option click,select mousedown,select mouseup,select click,select mousedown,select mouseup,option click');
                        else if (isMobileBrowser)
                            equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change,select mousedown,select mouseup,select click');
                        else
                            equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change,select mouseup,select click,select mousedown,select mouseup,select click,select mouseup,select click');
                        startNext();
                    });
                });
            });
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on select and select)', function () {
        var select  = createSelect(),
            $option = $(select).children().eq(2);

        //bind handlers
        bindSelectAndOptionHandlers($(select), $option);
        equal(select.selectedIndex, 0);

        clickPlaybackAutomation(select, {}, function () {
            equal(select.selectedIndex, 0);

            clickPlaybackAutomation(select, {}, function () {
                equal(select.selectedIndex, 0);
                equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select mousedown,select mouseup,select click');
                startNext();
            });
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on option in select with size more than one)', function () {
        var select  = createSelect(4),
            $option = $(select).children().eq(2);

        //bind handlers
        bindSelectAndOptionHandlers($(select), $option);

        select.selectedIndex = 0;
        equal(select.selectedIndex, 0);

        window.async.series({
            'Click on select in Android and iOS': function (callback) {
                if (isMobileBrowser)
                    clickPlaybackAutomation(select, {}, callback);
                else
                    callback();

            },
            'Click on option':                    function () {
                clickPlaybackAutomation($option[0], {}, function () {
                    equal(select.selectedIndex, 2);
                    if (browserUtils.isIE)
                        equal(handlersLog.join(), 'select mousedown,select mouseup,select change,select click');
                    else if (isMobileBrowser)
                        equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change');
                    else
                        equal(handlersLog.join(), 'option mousedown,option mouseup,select change,option click');
                    startNext();
                });
            }
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on the same option in select with size more than one)', function () {
        var select  = createSelect(4),
            $option = $(select).children().eq(2);

        //bind handlers
        bindSelectAndOptionHandlers($(select), $option);

        window.async.series({
            'Click on select in Android/iOS first time':  function (callback) {
                if (isMobileBrowser)
                    clickPlaybackAutomation(select, {}, callback);
                else
                    callback();

            },
            'Click on option first time':                 function (callback) {
                clickPlaybackAutomation($option[0], {}, function () {
                    equal(select.selectedIndex, 2);
                    callback();
                });
            },
            'Click on select in Android/iOS second time': function (callback) {
                if (isMobileBrowser)
                    clickPlaybackAutomation(select, {}, callback);
                else
                    callback();
            },
            'Click on option second time':                function () {
                clickPlaybackAutomation($option[0], {}, function () {
                    equal(select.selectedIndex, 2);
                    if (browserUtils.isIE)
                        equal(handlersLog.join(), 'select mousedown,select mouseup,select change,select click,select mousedown,select mouseup,select click');
                    else if (isMobileBrowser)
                        equal(handlersLog.join(), 'select mousedown,select mouseup,select click,select change,select mousedown,select mouseup,select click');
                    else
                        equal(handlersLog.join(), 'option mousedown,option mouseup,select change,option click,option mousedown,option mouseup,option click');
                    startNext();
                });
            }
        });
    });

    asyncTest('B253370 - Event handlers are called in the wrong order (click on select with size more than one)', function () {
        var select = createSelect(30);

        //bind handlers
        bindSelectAndOptionHandlers($(select));

        select.selectedIndex = 0;

        clickPlaybackAutomation(select, {}, function () {
            equal(handlersLog.join(), 'select mousedown,select mouseup,select click');
            startNext();
        });
    });

    asyncTest('GH234 - Value of a <select> element must be updated before emitting "change" event in IE and Edge', function () {
        var select = createSelect();

        select.addEventListener('change', function () {
            equal(select.value, 'three');
            startNext();
        });

        clickPlaybackAutomation(select, {}, function () {
            clickPlaybackAutomation(select.options[2], {}, function () {
            });
        });
    });
});
