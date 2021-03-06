import { Parser } from 'parse5';

var parser = new Parser();

export default class TestRunError {
    constructor () {
        // TODO
        this.TEMPLATES = null;
    }

    static _getSelector (node) {
        var dataTypeAttr = node.attrs.filter(attr => attr.name === 'data-type')[0];
        var type         = dataTypeAttr && dataTypeAttr.value || '';

        return type ? `${node.tagName} ${type}` : node.tagName;
    }

    static _decorateHtml (node, decorator) {
        var msg = '';

        if (node.nodeName === '#text')
            msg = node.value;
        else {
            if (node.childNodes.length) {
                msg += node.childNodes
                    .map(childNode => TestRunError._decorateHtml(childNode, decorator))
                    .join('');
            }

            if (node.nodeName !== '#document-fragment') {
                var selector = TestRunError._getSelector(node);

                msg = decorator[selector](msg, node.attrs);
            }
        }

        return msg;
    }

    getMessage (decorator, viewportWidth) {
        var msgHtml  = this.TEMPLATES[this.type](this, viewportWidth);
        var fragment = parser.parseFragment(msgHtml);

        return TestRunError._decorateHtml(fragment, decorator);
    }
}
