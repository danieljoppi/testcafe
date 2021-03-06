import indentString from 'indent-string';

function cutTtyColors (str) {
    return str.replace(/\033\[[0-9;]*m/g, '');
}

function rtrim (str) {
    return str.replace(/\s+$/, '');
}

export default function (str, indent, width) {
    var curStr     = '';
    var wrappedMsg = '';

    if (cutTtyColors(str).length <= width - indent)
        return indentString(str, ' ', indent);

    str = str.replace(/(\r\n)/gm, '\n')
        .split(/(\S+[ \t]+)|(\S+(?:\n))|(\n)/m)
        //NOTE: cut empty elements
        .filter(elm => !!elm);

    str.forEach(word => {
        var newStr = curStr + word;

        if (cutTtyColors(newStr).length > width - indent) {
            wrappedMsg += `${rtrim(curStr)}\n`;
            curStr = word;
        }
        else {
            if (curStr[curStr.length - 1] === '\n') {
                wrappedMsg += `${rtrim(curStr)}\n`;
                curStr = '';
            }

            curStr += word;
        }
    });

    return indentString(wrappedMsg + curStr, ' ', indent);
}
