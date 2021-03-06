//NOTE: we can't manipulate (open/close option list) with a native select element during test running, so we
// draw our custom option list to emulate this.
import hammerhead from './deps/hammerhead';
import testCafeCore from './deps/testcafe-core';

var shadowUI       = hammerhead.shadowUI;
var browserUtils   = hammerhead.utils.browser;
var eventSimulator = hammerhead.eventSandbox.eventSimulator;

var positionUtils = testCafeCore.positionUtils;
var domUtils      = testCafeCore.domUtils;
var styleUtils    = testCafeCore.styleUtils;
var eventUtils    = testCafeCore.eventUtils;
var arrayUtils    = testCafeCore.arrayUtils;


const OPTION_LIST_CLASS      = 'tcOptionList';
const OPTION_GROUP_CLASS     = 'tcOptionGroup';
const OPTION_CLASS           = 'tcOption';
const DISABLED_CLASS         = 'disabled';
const MAX_OPTION_LIST_LENGTH = browserUtils.isIE ? 30 : 20;


var curSelectEl = null;
var optionList  = null;
var groups      = [];
var options     = [];

function onDocumentMouseDown (e) {
    //NOTE: only in Mozilla 'mousedown' raises for option
    if ((e.target || e.srcElement) !== curSelectEl && !domUtils.containsElement(curSelectEl, e.target) &&
        !domUtils.containsElement(optionList, e.target))
        collapseOptionList();
}

function createOption (realOption, parent) {
    var option           = document.createElement('div');
    var isOptionDisabled = realOption.disabled ||
                           (realOption.parentElement.tagName.toLowerCase() === 'optgroup' &&
                            realOption.parentElement.disabled);

    option.textContent = realOption.text;
    parent.appendChild(option);
    shadowUI.addClass(option, OPTION_CLASS);

    if (isOptionDisabled) {
        shadowUI.addClass(option, DISABLED_CLASS);
        styleUtils.set(option, 'color', styleUtils.get(realOption, 'color'));
    }

    if (isOptionDisabled && browserUtils.isWebKit) {
        eventUtils.bind(option, 'click', function () {
            return false;
        });
    }
    else {
        eventUtils.bind(option, 'click', function () {
            var curSelectIndex   = curSelectEl.selectedIndex;
            var optionIndex      = arrayUtils.indexOf(options, this);
            var option           = curSelectEl.getElementsByTagName('option')[optionIndex];
            var clickLeadChanges = !isOptionDisabled && optionIndex !== curSelectIndex;
            var isMobileBrowser  = browserUtils.isSafari && browserUtils.hasTouchEvents || browserUtils.isAndroid;

            if (clickLeadChanges && !browserUtils.isIE)
                curSelectEl.selectedIndex = optionIndex;

            if (!browserUtils.isFirefox && !browserUtils.isIE && clickLeadChanges)
                eventSimulator.change(curSelectEl);

            if (browserUtils.isFirefox || browserUtils.isIE)
                eventSimulator.mousedown(browserUtils.isFirefox ? option : curSelectEl);

            if (!isMobileBrowser)
                eventSimulator.mouseup(browserUtils.isFirefox ? option : curSelectEl);

            if ((browserUtils.isFirefox || browserUtils.isIE) && clickLeadChanges) {
                if (browserUtils.isIE)
                    curSelectEl.selectedIndex = optionIndex;

                eventSimulator.change(curSelectEl);
            }

            if (!isMobileBrowser)
                eventSimulator.click(browserUtils.isFirefox || browserUtils.isIE ? option : curSelectEl);

            if (!isOptionDisabled)
                collapseOptionList();
        });
    }

    options.push(option);
}

function createGroup (realGroup, parent) {
    var group = document.createElement('div');

    group.textContent = realGroup.label || ' ';
    parent.appendChild(group);

    shadowUI.addClass(group, OPTION_GROUP_CLASS);

    if (group.disabled) {
        shadowUI.addClass(group, DISABLED_CLASS);

        styleUtils.set(group, 'color', styleUtils.get(realGroup, 'color'));
    }

    createChildren(realGroup.children, group);

    groups.push(group);
}

function createChildren (children, parent) {
    for (var i = 0; i < children.length; i++) {
        if (children[i].tagName.toLowerCase() === 'option')
            createOption(children[i], parent);
        else if (children[i].tagName.toLowerCase() === 'optgroup')
            createGroup(children[i], parent);
    }
}

export function expandOptionList (select) {
    var selectChildren = select.children;

    if (!selectChildren.length)
        return;

    //NOTE: check is option list expanded
    if (curSelectEl) {
        var isSelectExpanded = select === curSelectEl;

        collapseOptionList();

        if (isSelectExpanded)
            return;
    }

    curSelectEl = select;

    optionList = document.createElement('div');
    shadowUI.getRoot().appendChild(optionList);
    shadowUI.addClass(optionList, OPTION_LIST_CLASS);

    createChildren(selectChildren, optionList);

    window.setTimeout(function () {
        eventUtils.bind(document, 'mousedown', onDocumentMouseDown);
    }, 0);

    styleUtils.set(optionList, {
        position:   'absolute',
        fontSize:   styleUtils.get(curSelectEl, 'fontSize'),
        fontFamily: styleUtils.get(curSelectEl, 'fontFamily'),
        minWidth:   styleUtils.getWidth(curSelectEl) + 'px',
        left:       positionUtils.getOffsetPosition(curSelectEl).left + 'px',
        height:     domUtils.getSelectVisibleChildren(select).length > MAX_OPTION_LIST_LENGTH ?
                    styleUtils.getOptionHeight(select) * MAX_OPTION_LIST_LENGTH : ''
    });

    var selectTopPosition     = positionUtils.getOffsetPosition(curSelectEl).top;
    var optionListHeight      = styleUtils.getHeight(optionList);
    var optionListTopPosition = selectTopPosition + styleUtils.getHeight(curSelectEl) + 2;

    if (optionListTopPosition + optionListHeight > styleUtils.getScrollTop(window) + styleUtils.getHeight(window)) {
        var topPositionAboveSelect = selectTopPosition - 3 - optionListHeight;

        if (topPositionAboveSelect >= styleUtils.getScrollTop(window))
            optionListTopPosition = topPositionAboveSelect;
    }

    styleUtils.set(optionList, 'top', optionListTopPosition + 'px');
}

export function collapseOptionList () {
    domUtils.remove(optionList);
    eventUtils.unbind(document, 'mousedown', onDocumentMouseDown);

    optionList  = null;
    curSelectEl = null;
    options     = [];
    groups      = [];
}

export function isOptionListExpanded (select) {
    return select ? select === curSelectEl : !!curSelectEl;
}

export function getEmulatedChildElement (elementIndex, isGroup) {
    if (!isGroup)
        return options[elementIndex];

    return groups[elementIndex];
}

export function scrollOptionListByChild (child) {
    var select = domUtils.getSelectParent(child);

    if (!select)
        return;

    var realSizeValue = styleUtils.getSelectElementSize(select);
    var optionHeight  = styleUtils.getOptionHeight(select);
    var scrollIndent  = 0;

    var topVisibleIndex    = Math.max(styleUtils.getScrollTop(select) / optionHeight, 0);
    var bottomVisibleIndex = topVisibleIndex + realSizeValue - 1;

    var childIndex = domUtils.getChildVisibleIndex(select, child);

    if (childIndex < topVisibleIndex) {
        scrollIndent = optionHeight * (topVisibleIndex - childIndex);
        styleUtils.setScrollTop(select, Math.max(styleUtils.getScrollTop(select) - scrollIndent, 0));
    }
    else if (childIndex > bottomVisibleIndex) {
        scrollIndent = optionHeight * (childIndex - bottomVisibleIndex);
        styleUtils.setScrollTop(select, styleUtils.getScrollTop(select) + scrollIndent);
    }
}

export function getSelectChildCenter (child) {
    var select = domUtils.getSelectParent(child);

    if (!select) {
        return {
            x: 0,
            y: 0
        };
    }

    var optionHeight   = styleUtils.getOptionHeight(select),
        childRectangle = positionUtils.getElementRectangle(child);

    return {
        x: Math.round(childRectangle.left + childRectangle.width / 2),
        y: Math.round(childRectangle.top + optionHeight / 2)
    };
}

export function switchOptionsByKeys (element, command) {
    var selectSize       = styleUtils.getSelectElementSize(element);
    var optionListHidden = !styleUtils.hasDimensions(shadowUI.select('.' + OPTION_LIST_CLASS)[0]);

    if (/down|up/.test(command) ||
        (!browserUtils.isIE && (selectSize <= 1 || browserUtils.isFirefox) &&
         (optionListHidden || browserUtils.isFirefox) && /left|right/.test(command))) {
        var options        = element.querySelectorAll('option');
        var enabledOptions = [];

        for (var i = 0; i < options.length; i++) {
            var parent = options[i].parentElement;

            if (!options[i].disabled && !(parent.tagName.toLowerCase() === 'optgroup' && parent.disabled))
                enabledOptions.push(options[i]);
        }

        var curSelectedOptionIndex = arrayUtils.indexOf(enabledOptions, options[element.selectedIndex]);
        var nextIndex              = curSelectedOptionIndex + (/down|right/.test(command) ? 1 : -1);

        if (nextIndex >= 0 && nextIndex < enabledOptions.length) {
            element.selectedIndex = arrayUtils.indexOf(options, enabledOptions[nextIndex]);
            eventSimulator.change(element);
        }
    }
}
