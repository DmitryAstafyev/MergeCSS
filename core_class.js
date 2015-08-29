var ClassCore = function () { };
ClassCore.prototype = (function () {
    "use strict";
    var tools = null,
        stages = null,
        getResult = null,
        medias = null,
        optimazated = null,
        rulles = null,
        regs = null;
    regs = {
        GET_STYLE_LINES: /(\.|\#|\w|\[|@[\w-_\n\s\#\,><~\+]+)(.[^}]*)/gi,
        GET_PROPERTIES_FROM_STYLE: /(([\w-_\n\s\#\,]+)(.[^;]*))/gi,
        GET_PROPERTY_NAME: /^([\w-_\n\s\#\,]+)(\s?[^\:])/gi,
        GET_BRACES: /^\{|\}$/gi,
        GET_SELECTOR: /\{.*\}/gi,
        GET_STYLE_CONTENT: /\{(.|\n|\r|\s)*?\}/gi,
        GET_COMMENTS: /\/\*((.|\n|\r)*?)\*\//gi,
        GET_COMMENT: /(\/\*(.[^\*]*)\*\/)/gi,
        GET_COMMENT_SELECTOR_ASSOCIATE: '[\\n\\s]*?(\\.|\\#|\\w|\\[|@[\\w-_\\n\\s\\#\\,><~\\+]+)(.[^}]*)',
        GET_COMMENT_PROPERTY_ASSOCIATE: /((____\d+____)(.|\n|\r|\s)*?:)/gi,
        GET_COMMENT_PROPERTY_END_ASSOCIATE: /(([\w-_\n\s\#\,:]+)(.[^;]*)____\d+____)/gi,
        GET_COMMENT_INDEX: /(____\d+____)/gi,
        GET_COMMENT_BORDERS: /(\/\*)|(\*\/)/gi,
        GET_BREAKS: /[\n\r]/gi,
        GET_SPACES: /[\s\t\v]/gi,
        GET_DOUBLE_SPACES: /[\s\t\v]{2,}/gi,
        GET_STRING_CONTENT: /"(.|\n|\r|\n\r)*?"|'(.|\n|\r|\n\r)*?'/gi,
        GET_KEYFRAMES: /(@[\w-_\n\s\#\,]+)(.|\n|\r|\n\r)*?(\}(\n|\r|\n\r|\s)*?\})/gi,
        GET_KEYFRAME_SELECTOR: /(@[\w-_\n\s\#\,]+)\s*[^\{]/gi
    };
    tools = {
        removeSpaces: function (str) {
            return (str.replace(regs.GET_BREAKS, ' ')).replace(regs.GET_DOUBLE_SPACES, ' ');
        },
        removeAllSpaces: function (str) {
            return (str.replace(regs.GET_BREAKS, '')).replace(regs.GET_SPACES, '');
        },
        makeMark: function (str) {
            return str;
        },
        removeComments: function (str) {
            return str.replace(regs.GET_COMMENTS, '');
        },
        removeKeyframes: function (str) {
            return str.replace(regs.GET_KEYFRAMES, '');
        },
        getSelector: function (str) {
            str = str.replace(regs.GET_SELECTOR, '');
            return str.trim();
        },
        getStyle: function (str, selector) {
            str = str.replace(selector, '');
            return str.trim();
        },
        getStringContent: function (str) {
            var strings = tools.removeComments(str).match(regs.GET_STRING_CONTENT),
                _str = str,
                content = [],
                prefix = Math.round((new Date()).valueOf() + Math.random() * 10000000);
            if (strings !== null) {
                Array.prototype.forEach.call(
                    strings,
                    function (string) {
                        var index = '___' + (prefix += 1) + '___';
                        content.push(
                            {
                                index: index,
                                value: string
                            }
                        );
                        _str = _str.replace(string, index);
                    }
                );
            }
            return {
                str: _str,
                content: content
            };
        },
        restoreStringContent: function (str, content) {
            var str = str;
            try {
                Array.prototype.forEach.call(
                    content,
                    function (item) {
                        if (str.indexOf(item.index) !== -1) {
                            str = str.replace(item.index, item.value);
                        }
                    }
                );
            } catch (e) {
                //do nothin
            } finally {
                return str;
            }
        },
        getProperies: function (_style) {
            var _properies = null,
                properties = [],
                style = null;
            style = _style.replace(regs.GET_BRACES, '');
            _properies = style.match(regs.GET_PROPERTIES_FROM_STYLE);
            if (_properies !== null) {
                Array.prototype.forEach.call(
                    _properies,
                    function (property, index) {
                        var check_str = tools.removeSpaces(property),
                            name = null,
                            value = null;
                        if (check_str.length > 0) {
                            value = property.replace(regs.GET_PROPERTY_NAME, '');
                            name = property.replace(value, '');
                            if (tools.removeSpaces(value) !== '' && tools.removeSpaces(name) !== '') {
                                properties.push(
                                    {
                                        name: name.replace(/\:/gi, '').trim(),
                                        value: (value.trim().replace(/^\:/gi, '')).trim(),
                                        _name: tools.makeMark(name.replace(/\:/gi, '').trim()),
                                        _value: tools.makeMark((value.trim().replace(/^\:/gi, '')).trim()),
                                    }
                                );
                                if (name.length < 3) {
                                    alert('Wrong parsing. Name of property detected incorrectly. [' + property + '] detected as [' + name + ']');
                                }
                            }
                        }
                    }
                );
            }
            return properties;
        },
        getStyles: function (content) {
            function restore(lines) {
                Array.prototype.forEach.call(
                    lines,
                    function (item, index) {
                        lines[index] = item + ' }';
                    }
                );
                return lines;
            };
            function isCorrect(lines, source) {
                var chkStr = '',
                    noComments = tools.removeComments(source),
                    offset = null;
                Array.prototype.forEach.call(
                    lines,
                    function (line) {
                        chkStr += line;
                    }
                );
                offset = chkStr.length - noComments.length;
                offset = offset < 0 ? -offset : offset;
                return {
                    result: (offset > noComments.length * 0.1 ? false : true),
                    offset: offset
                }
            };
            function getClassesAndStyles(lines) {
                var classes = [];
                Array.prototype.forEach.call(
                    lines,
                    function (line) {
                        var selector = tools.getSelector(line);
                        classes.push(
                            {
                                selector: selector,
                                _selector: tools.makeMark(selector),
                                style: tools.getStyle(line, selector),
                                original: line,
                                properties: null,
                                checking: 'not checked'
                            }
                        );
                    }
                );
                if (classes.length === lines.length) {
                    return classes;
                } else {
                    return null;
                }
            };
            function getProperties(classes) {
                function check(style, properties) {
                    var _properties = '',
                        _style = '';
                    Array.prototype.forEach.call(
                        properties,
                        function (property) {
                            _properties += property.name + ':' + property.value + ';';
                        }
                    );
                    _properties = tools.removeAllSpaces('{' + _properties + '}');
                    _style = tools.removeAllSpaces(style);
                    if (_properties.length !== _style.length) {
                        return '[WARNING]:: Not all properties were parsed correctly. Check this style manually. Maybe you miss ";" or forget about space after ":_".';
                    } else {
                        if (style.search('{') === 0 && style.search('}') === style.length - 1) {
                            if (style.match(/\{/gi).length === 1 && style.match(/\}/gi).length === 1) {
                                return 'ok';
                            } else {
                                return '[WARNING]:: In style was found symbols { or }. Can be error with parsing.';
                            }
                        } else {
                            return '[ERROR]:: Style parsed incorrectly. Cannot find { or }.';
                        }
                    }
                };
                Array.prototype.forEach.call(
                    classes,
                    function (_class, index) {
                        classes[index].properties = tools.getProperies(_class.style);
                        classes[index].checking = check(_class.style, classes[index].properties);
                    }
                );
                return classes;
            };
            function restoreStringContent(classes, content) {
                Array.prototype.forEach.call(
                    classes,
                    function (_class, index) {
                        var properties = []
                        Array.prototype.forEach.call(
                            _class.properties,
                            function (property) {
                                properties.push({
                                    name: property.name,
                                    value: tools.restoreStringContent(property.value, content),
                                    _name: property._name,
                                    _value: tools.restoreStringContent(property._value, content)
                                });
                            }
                        );
                        classes[index]._selector = tools.restoreStringContent(classes[index]._selector, content);
                        classes[index].selector = tools.restoreStringContent(classes[index].selector, content);
                        classes[index].original = tools.restoreStringContent(classes[index].original, content);
                        classes[index].style = tools.restoreStringContent(classes[index].style, content);
                        classes[index].properties = properties;
                    }
                );
                return classes;
            };
            var lines = tools.removeKeyframes(tools.removeComments(content.str)).match(regs.GET_STYLE_LINES),
                offset = 0,
                classes = [];
            if (content.str !== '') {
                lines = restore(lines);
                offset = isCorrect(lines, tools.removeKeyframes(content.str));
                if (offset.result === false) {
                    alert('Warning! CSS data was parsed wrongly. Check CSS data.');
                    return false;
                } else {
                    console.log('Length of original data is ' + content.str.length + ' (without content). Offset after parsing is ' + offset.offset);
                }
                classes = getClassesAndStyles(lines);
                if (classes !== null) {
                    classes = getProperties(classes);
                    classes = restoreStringContent(classes, content.content);
                    return {
                        classes: classes,
                        lost: offset.offset
                    };
                } else {
                    alert('Warning! Classes parsed wrongly. Check CSS data.');
                }
            }
            return {
                classes: [],
                lost: 0
            };
        },
        getFrames: function (content) {
            var lines = tools.removeComments(content.str).match(regs.GET_KEYFRAMES),
                frames = [];
            if (lines !== null) {
                Array.prototype.forEach.call(
                    lines,
                    function (line) {
                        var selector = line.match(regs.GET_KEYFRAME_SELECTOR),
                            styles = '';
                        if (selector !== null) {
                            if (selector.length === 1) {
                                selector = selector[0].trim();
                                styles = ((line.replace(selector, '')).trim()).replace(regs.GET_BRACES, '')
                                frames.push({
                                    selector: selector,
                                    styles: styles,
                                    classes: tools.getStyles({ content: content.content, str: styles })
                                });
                            }
                        }
                    }
                );
            }
            return frames;
        },
        getCopy: function (source, target) {
            var target = (typeof target === "object" ? (target === null ? (source instanceof Array ? [] : {}) : target) : (source instanceof Array ? [] : {})),
                source = (typeof source === "object" ? source : null);
            if (source !== null) {
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        if (source[key] instanceof Array) {
                            target[key] = [];
                            Array.prototype.forEach.call(
                                source[key],
                                function (item) {
                                    if (item instanceof Array === false && typeof item !== 'object') {
                                        target[key].push(item);
                                    } else {
                                        target[key].push(tools.getCopy(item));
                                    }
                                }
                            );
                        } else if (typeof source[key] === "object" && source[key] !== null && typeof source[key] !== "function") {
                            target[key] = {};
                            target[key] = tools.getCopy(source[key]);
                        } else {
                            target[key] = source[key];
                        }

                    }
                }
                return target;
            }
            return null;
        }
    };
    stages = {
        prepare: function () {
            Array.prototype.forEach.call(
                medias,
                function (media, index) {
                    medias[index] = {
                        source: tools.removeSpaces(media),
                        original_source: media,
                        classes: []
                    };
                }
            );
            return medias;
        },
        addClasses: function () {
            Array.prototype.forEach.call(
                medias,
                function (media, index) {
                    var content = tools.getStringContent(media.source),
                        result = tools.getStyles(content),
                        frames = tools.getFrames(content);
                    medias[index].classes = result.classes;
                    medias[index].lost = result.lost;
                    medias[index].frames = frames;
                }
            );
            return medias;
        },
        addComments: function (source) {
            Array.prototype.forEach.call(
                source,
                function (media, media_index) {
                    var comments = stages.commentMap(media.original_source);
                    Array.prototype.forEach.call(
                        media.classes,
                        function (_class, class_index) {
                            if (comments[_class._selector]) {
                                if (comments[_class._selector].basic.length > 0) {
                                    source[media_index].classes[class_index].comments = comments[_class._selector].basic;
                                }
                                if (Object.keys(comments[_class._selector].properies).length > 0) {
                                    Array.prototype.forEach.call(
                                        _class.properties,
                                        function (property, prop_index) {
                                            if (comments[_class._selector].properies[property.name]) {
                                                source[media_index].classes[class_index].properties[prop_index].comments = comments[_class._selector].properies[property.name];
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );
                }
            );
            return source;
        },
        commentMap: function (str) {
            function getComments(str) {
                var comments = str.match(regs.GET_COMMENTS),
                    _str = str,
                    map = [],
                    prefix = Math.round((new Date()).valueOf() + Math.random() * 10000000);
                if (comments !== null) {
                    Array.prototype.forEach.call(
                        comments,
                        function (comment) {
                            var index = '____' + (prefix += 1) + '____';
                            map.push(
                                {
                                    index: index,
                                    value: comment
                                }
                            );
                            _str = _str.replace(comment, index);
                        }
                    );
                }
                return {
                    map: map,
                    str: _str
                };
            };
            function associateWithClasses(map, str) {
                var _str = str,
                    __str = str.replace(regs.GET_STYLE_CONTENT, '{}');
                Array.prototype.forEach.call(
                    map,
                    function (comment, index) {
                        var reg = new RegExp(comment.index + regs.GET_COMMENT_SELECTOR_ASSOCIATE, 'gi'),
                            lines = __str.match(reg);
                        if (lines !== null) {
                            Array.prototype.forEach.call(
                                lines,
                                function (line) {
                                    var style = tools.removeSpaces(line.replace(regs.GET_COMMENT_INDEX, '')).match(regs.GET_STYLE_LINES);
                                    if (style !== null) {
                                        if (style.length === 1) {
                                            map[index].selector = tools.getSelector(style[0] + '}');
                                            map[index].properties = null;
                                        }
                                    }
                                    _str = _str.replace(new RegExp(comment.index, 'gi'), '');
                                }
                            );
                        }
                    }
                );
                return {
                    map: map,
                    str: _str
                };
            };
            function associateWithProperties(map, str) {
                var lines = tools.removeSpaces(str).match(regs.GET_STYLE_LINES),
                    _str = str;
                if (lines !== null) {
                    Array.prototype.forEach.call(
                        lines,
                        function (line) {
                            function doParsing(_style, props) {
                                var style = _style;
                                if (props !== null) {
                                    Array.prototype.forEach.call(
                                        props,
                                        function (prop) {
                                            var indexes = prop.match(regs.GET_COMMENT_INDEX),
                                                _prop = prop.replace(regs.GET_COMMENT_INDEX, ''),
                                                prop_name = '';
                                            if (indexes !== null) {
                                                prop_name = (_prop.replace(_prop.replace(regs.GET_PROPERTY_NAME, ''), '')).trim();
                                                if (prop_name !== '') {
                                                    Array.prototype.forEach.call(
                                                        indexes,
                                                        function (_index) {
                                                            map = addProperty(map, _index, selector, prop_name);
                                                            _str = _str.replace(new RegExp(_index, 'gi'), '');
                                                            style = style.replace(new RegExp(_index, 'gi'), '');
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    );
                                }
                                return style;
                            };
                            var selector = tools.getSelector(line + '}'),
                                style = (tools.getStyle(line, selector)).replace(regs.GET_BRACES, '');
                            if (selector !== null && selector !== '') {
                                style = doParsing(style, style.match(regs.GET_COMMENT_PROPERTY_END_ASSOCIATE));
                                style = doParsing(style, style.match(regs.GET_COMMENT_PROPERTY_ASSOCIATE));
                            }
                        }
                    );
                }
                return {
                    map: map,
                    str: _str
                };
            };
            function addProperty(map, index, selector, property) {
                try {
                    Array.prototype.forEach.call(
                        map,
                        function (item, _index) {
                            if (item.index === index) {
                                map[_index].properties = map[_index].properties instanceof Array ? map[_index].properties : {};
                                if (typeof map[_index].properties[selector] === 'undefined') {
                                    map[_index].properties[selector] = [];
                                }
                                map[_index].properties[selector].push(property);
                            }
                        }
                    );
                } catch (e) {
                } finally {
                    return map;
                }
            };
            function convert(_map) {
                var map = {};
                Array.prototype.forEach.call(
                    _map,
                    function (comment) {
                        function createCell(selector) {
                            if (!map[selector]) {
                                map[selector] = {
                                    basic: [],
                                    properies: {}
                                };
                            }
                        };
                        if (comment.selector) {
                            createCell(comment.selector);
                            map[comment.selector].basic.push(comment.value);
                        }
                        if (comment.properties) {
                            for (var key in comment.properties) {
                                createCell(key);
                                Array.prototype.forEach.call(
                                    comment.properties[key],
                                    function (property) {
                                        if (!map[key].properies[property]) {
                                            map[key].properies[property] = [];
                                        }
                                        map[key].properies[property].push(comment.value);
                                    }
                                );
                            }
                        }
                    }
                );
                return map;
            };
            var comments = getComments(str.replace(regs.GET_KEYFRAMES, ''));
            comments = associateWithClasses(comments.map, comments.str);
            comments = associateWithProperties(comments.map, comments.str);
            comments = convert(comments.map);
            return comments;
        },
        build: function () {
            function getAllPropertiesForSelector(level, _selector) {
                var properties = [];
                if (level > 1) {
                    for (var index = level - 1; index >= 0; index -= 1) {
                        Array.prototype.forEach.call(
                            _medias[index].classes,
                            function (_class) {
                                if (_selector === _class._selector) {
                                    Array.prototype.forEach.call(
                                        _class.properties,
                                        function (property) {
                                            properties.push({
                                                name: property.name,
                                                value: property.value,
                                                _name: property._name,
                                                _value: property._value,
                                                level: index
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    }
                }
                return properties;
            };
            function buildForLevel(level) {
                var classes = [],
                    removed_classes = 0,
                    removed_properties = 0;
                Array.prototype.forEach.call(
                    _medias[level].classes,
                    function (_class) {
                        var properties = [];
                        Array.prototype.forEach.call(
                            _class.properties,
                            function (property) {
                                var hi_properties = getAllPropertiesForSelector(level, _class.selector);
                                try {
                                    Array.prototype.forEach.call(
                                        hi_properties,
                                        function (hi_property) {
                                            if (property._name === hi_property._name && property._value === hi_property._value) {
                                                throw 'exists';
                                            }
                                        }
                                    );
                                    properties.push({
                                        name: property.name,
                                        _name: property._name,
                                        value: property.value,
                                        _value: property._value,
                                    });
                                } catch (e) {
                                    if (e === 'exists') {
                                        removed_properties += 1;
                                        //do nothing
                                    }
                                }
                            }
                        );
                        if (properties.length > 0) {
                            classes.push(
                                {
                                    selector: _class.selector,
                                    _selector: _class._selector,
                                    style: _class.style,
                                    original: _class.original,
                                    properties: properties,
                                    checking: 'build'
                                }
                            );
                            if (_class.comment) {
                                classes[classes.length - 1].comment = _class.comment;
                            }
                        } else {
                            removed_classes += 1;
                        }
                    }
                );
                return {
                    classes: classes,
                    removed: {
                        classes: removed_classes,
                        properties: removed_properties
                    }
                };
            };
            function removeDublicates(groups) {
                function isInGroupProperty(classes, property, _selector) {
                    try {
                        Array.prototype.forEach.call(
                            classes,
                            function (_class) {
                                if (_class._selector === _selector) {
                                    Array.prototype.forEach.call(
                                        _class.properties,
                                        function (_property) {
                                            if (_property._name === property._name && _property._value === property._value && typeof _class.now_checking === 'undefined') {
                                                throw 'exist';
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    } catch (e) {
                        return true;
                    }
                    return false;
                };
                Array.prototype.forEach.call(
                    groups,
                    function (group) {
                        var removed_classes = 0,
                            removed_properties = 0,
                            classes = [];
                        Array.prototype.forEach.call(
                            group.classes,
                            function (_class, index) {
                                var properties = [];
                                _class.now_checking = true;
                                Array.prototype.forEach.call(
                                    _class.properties,
                                    function (property) {
                                        if (isInGroupProperty(group.classes, property, _class._selector) === false) {
                                            properties.push(
                                                {
                                                    name: property.name,
                                                    _name: property._name,
                                                    value: property.value,
                                                    _value: property._value,
                                                }
                                            );
                                        } else {
                                            removed_properties += 1;
                                        }
                                    }
                                );
                                delete _class.now_checking;
                                _class.properties = properties;
                                if (properties.length > 0) {
                                    classes.push({
                                        selector: _class.selector,
                                        _selector: _class._selector,
                                        style: _class.style,
                                        original: _class.original,
                                        properties: properties,
                                        checking: 'build'
                                    });
                                    if (_class.comment) {
                                        classes[classes.length - 1].comment = _class.comment;
                                    }
                                } else {
                                    removed_classes += 1;
                                }
                            }
                        );
                        group.classes = classes;
                        group.removed.duplicates = removed_properties;
                        group.removed.classes += removed_classes;
                    }
                );
            };
            var groups = [],
                results = null,
                _medias = tools.getCopy(medias);
            for (var group = _medias.length - 1; group >= 1; group -= 1) {
                results = buildForLevel(group);
                groups.unshift({
                    original_source: _medias[group].original_source,
                    source: _medias[group].source,
                    classes: results.classes,
                    lost: _medias[group].lost,
                    frames: _medias[group].frames,
                    removed: {
                        classes: results.removed.classes,
                        properties: results.removed.properties,
                    }
                });
            }
            groups.unshift({
                original_source: _medias[0].original_source,
                source: _medias[0].source,
                classes: _medias[0].classes,
                lost: _medias[0].lost,
                frames: _medias[0].frames,
                removed: {
                    classes: 0,
                    properties: 0,
                    duplicates: 0
                }
            });
            removeDublicates(groups);
            return groups;
        },
        getCSSText: function (groups) {
            var cssText = '',
                spaces = '    ';
            Array.prototype.forEach.call(
                groups,
                function (group, index) {
                    function includeClasses(classes, _spaces) {
                        Array.prototype.forEach.call(
                            classes,
                            function (_class) {
                                if (_class.comments) {
                                    Array.prototype.forEach.call(
                                        _class.comments,
                                        function (comment) {
                                            cssText += comment + '\n';
                                        }
                                    );
                                }
                                cssText += _spaces + (rulles[index].open !== '' ? spaces : '') + _class.selector + ' { \n';
                                Array.prototype.forEach.call(
                                    _class.properties,
                                    function (property) {
                                        if (property.comments) {
                                            Array.prototype.forEach.call(
                                                property.comments,
                                                function (comment) {
                                                    cssText += comment + '\n';
                                                }
                                            );
                                        }
                                        cssText += _spaces + ((rulles[index].open !== '' ? spaces + spaces : '') + '    ' + property.name + ': ' + property.value + ';\n');
                                    }
                                );
                                cssText += _spaces + (rulles[index].open !== '' ? spaces : '') + '}\n';
                            }
                        );
                    };
                    cssText += rulles[index].open + '\n';
                    if (group.comment) {
                        cssText += '/*' + group.comment + '*/\n';
                    }
                    includeClasses(group.classes, '');
                    Array.prototype.forEach.call(
                        group.frames,
                        function (frame) {
                            cssText += (rulles[index].open !== '' ? spaces : '') + frame.selector + ' { \n';
                            includeClasses(frame.classes.classes, spaces);
                            cssText += (rulles[index].open !== '' ? spaces : '') + '}\n';
                        }
                    );
                    cssText += rulles[index].close + '\n';
                }
            );
            return cssText;
        }
    };
    getResult = function (_medias, _rulles) {
        medias = _medias;
        rulles = _rulles;
        if (medias.length === rulles.length) {
            optimazated = null
            stages.prepare();
            stages.addClasses();
            optimazated = stages.build();
            medias = stages.addComments(medias);
            optimazated = stages.addComments(optimazated);
            return {
                original: medias,
                optimazated: optimazated,
                cssText: stages.getCSSText(optimazated)
            };
        }
        return null;
    };
    return {
        get: getResult
    }
}(this));
