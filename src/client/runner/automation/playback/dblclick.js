import hammerhead from '../../deps/hammerhead';
import testCafeCore from '../../deps/testcafe-core';
import testCafeUI from '../../deps/testcafe-ui';
import { fromPoint as getElementFromPoint } from '../get-element';
import * as automationUtil from '../util';
import * as automationSettings from '../settings';
import clickPlaybackAutomation from '../playback/click';
import async from '../../deps/async';
import cursor from '../cursor';

var browserUtils   = hammerhead.utils.browser;
var eventSimulator = hammerhead.eventSandbox.eventSimulator;

var SETTINGS      = testCafeCore.SETTINGS;
var domUtils      = testCafeCore.domUtils;
var positionUtils = testCafeCore.positionUtils;
var styleUtils    = testCafeCore.styleUtils;
var eventUtils    = testCafeCore.eventUtils;

var selectElement = testCafeUI.selectElement;


export default function (el, options, actionCallback) {
    options = {
        ctrl:     options.ctrl,
        alt:      options.alt,
        shift:    options.shift,
        meta:     options.meta,
        offsetX:  options.offsetX,
        offsetY:  options.offsetY,
        caretPos: options.caretPos
    };

    var curElement          = null,
        point               = null,
        currentTopElement   = null,
        skipClickSimulation = false;

    if (!positionUtils.isContainOffset(el, options.offsetX, options.offsetY)) {
        point      = automationUtil.getMouseActionPoint(el, options, true);
        curElement = getElementFromPoint(point.x, point.y);
    }

    if (!curElement)
        curElement = el;

    var isInvisibleElement = (SETTINGS.get().RECORDING && !SETTINGS.get().PLAYBACK) &&
                             !positionUtils.isElementVisible(el),
        screenPoint        = automationUtil.getMouseActionPoint(el, options, true),
        eventPoint         = automationUtil.getEventOptionCoordinates(el, screenPoint),
        eventOptions       = hammerhead.utils.extend({
            clientX: eventPoint.x,
            clientY: eventPoint.y
        }, options);

    async.series({
        firstClick: function (callback) {
            clickPlaybackAutomation(el, options, function () {
                if (!isInvisibleElement) {
                    currentTopElement = getElementFromPoint(screenPoint.x, screenPoint.y, el);
                    if (currentTopElement && currentTopElement !== curElement)
                        curElement = currentTopElement;
                }
                window.setTimeout(callback, automationSettings.CLICK_STEP_DELAY);
            });
        },

        secondClick: function (callback) {
            var notPrevented = true;
            async.series({
                //NOTE: touch devices only
                touchstart: function (callback) {
                    if (browserUtils.hasTouchEvents)
                        eventSimulator.touchstart(curElement, eventOptions);
                    callback();
                },

                //NOTE: touch devices only
                cursorTouchMouseDown: function (callback) {
                    if (browserUtils.hasTouchEvents) {
                        cursor
                            .leftButtonDown()
                            .then(() => callback());
                    }
                    else
                        callback();
                },

                //NOTE: touch devices only
                touchend: function (callback) {
                    if (browserUtils.hasTouchEvents) {
                        eventSimulator.touchend(curElement, eventOptions);

                        window.setTimeout(callback, automationSettings.ACTION_STEP_DELAY);
                    }
                    else
                        callback();
                },

                cursorMouseDown: function (callback) {
                    if (!browserUtils.hasTouchEvents) {
                        cursor.leftButtonDown()
                            .then(() => callback());
                    }
                    else
                        callback();
                },

                mousedown: function (callback) {
                    //NOTE: in webkit and ie raising mousedown event opens select element's dropdown,
                    // therefore we should handle it and hide the dropdown (B236416)
                    var needHandleMousedown = (browserUtils.isWebKit || browserUtils.isIE) &&
                                              domUtils.isSelectElement(curElement),
                        wasPrevented        = null,
                        activeElement       = domUtils.getActiveElement(),
                        //in IE focus is not raised if element was focused before click, even if focus is lost during mousedown
                        needFocus           = !(browserUtils.isIE && activeElement === curElement);

                    if (needHandleMousedown) {
                        var onmousedown = function (e) {
                            wasPrevented = e.defaultPrevented;
                            eventUtils.preventDefault(e);
                            eventUtils.unbind(curElement, 'mousedown', onmousedown);
                        };

                        eventUtils.bind(curElement, 'mousedown', onmousedown);
                    }

                    notPrevented = eventSimulator.mousedown(curElement, eventOptions);

                    if (!isInvisibleElement) {
                        currentTopElement = getElementFromPoint(screenPoint.x, screenPoint.y, el);

                        if (currentTopElement && currentTopElement !== curElement) {
                            skipClickSimulation = true;
                            curElement          = currentTopElement;
                        }
                    }

                    if (notPrevented === false) {
                        if (needHandleMousedown && !wasPrevented)
                            notPrevented = true;
                        else {
                            callback();
                            return;
                        }
                    }

                    //NOTE: we should not call it after the second click because of the native browser behavior
                    if (!browserUtils.isIE) {
                        // NOTE: If a target element is a contentEditable element, we need to call focusAndSetSelection directly for
                        // this element. Otherwise, if the element obtained by elementFromPoint is a child of the contentEditable
                        // element, a selection position may be calculated incorrectly (by using the caretPos option).
                        automationUtil
                            .focusAndSetSelection(domUtils.isContentEditableElement(el) ? el : curElement, needFocus, options.caretPos)
                            .then(callback);
                    }
                    else
                        callback();
                },

                cursorMouseUp: function (callback) {
                    cursor
                        .buttonUp()
                        .then(() => callback());
                },

                mouseup: function (callback) {
                    eventSimulator.mouseup(curElement, eventOptions);
                    callback();
                },

                click: function () {
                    if (curElement.tagName.toLowerCase() === 'option')
                        callback();
                    else {
                        //NOTE: If the element under the cursor has changed after 'mousedown' event then we should not raise 'click' event
                        if (!skipClickSimulation)
                            eventSimulator.click(curElement, eventOptions);

                        //NOTE: emulating click event on 'select' element doesn't expand dropdown with options (except chrome),
                        // therefore we should emulate it.
                        if ((!SETTINGS.get().RECORDING || SETTINGS.get().PLAYBACK) &&
                            domUtils.isSelectElement(curElement) &&
                            styleUtils.getSelectElementSize(curElement) === 1 && notPrevented !== false) {
                            //if this select already have options list
                            if (selectElement.isOptionListExpanded(curElement))
                                selectElement.collapseOptionList();
                            else
                                selectElement.expandOptionList(curElement);
                        }
                        callback();
                    }
                }
            });
        },

        dblclick: function () {
            //NOTE: If the element under the cursor has changed after 'mousedown' event then we should not raise 'dblclick' event
            if (!skipClickSimulation)
                eventSimulator.dblclick(curElement, eventOptions);
            actionCallback();
        }
    });
};
