$(function() {
    var text = $('.title');
    var textPos = text.position();
    var textColor = text.css('color');
    var numberOfShadows = 60;
    text.css({
        'color': '#edede7',
        'cursor': 'default',
        position: 'relative',
        'z-index': numberOfShadows + 1
    });
    var textShadow = text.clone().css({
        position: 'absolute',
        top: textPos.top,
        left: textPos.left,
        'z-index': numberOfShadows,
        width: '100%',
        'transform-origin': '49% bottom',
        '-o-transform-origin': '49% bottom',
        '-ms-transform-origin': '49% bottom',
        '-moz-transform-origin': '49% bottom',
        '-webkit-transform-origin': '49% bottom'
    });
    var texts = [];
    var scaleDecrement;
    var translateDecrement;
    var bgColorHex = colorToHex($('body').css('background-color'));
    var bgColorRgb = getRgbArray($('body').css('background-color'));
    var textColorRgb = getRgbArray(textColor);
    var colorStep = bgColorRgb.map(function(val, i) {
        return (parseInt(val, 10) - parseInt(textColorRgb[i], 10)) / numberOfShadows;
    });
    for (var i = 0, clone, color, transform; i < numberOfShadows; i++) {
        clone = textShadow.clone();
        scaleDecrement = 1 - (0.01 * i);
        translateDecrement = i;
        color = colorToHex(textColor, colorStep.map(function(val, j) {
            return val * (i + 1);
        }));
        transform = [
            'scale3d(' + [scaleDecrement, scaleDecrement, 1].join(', ') + ')',
            'translate3d(' + [0, translateDecrement + '%', 0].join(', ') + ')'
        ];
        clone.css({
            'color': '#' + color,
            'z-index': numberOfShadows - i,
            'transform': transform.join(' '),
            '-o-transform': transform.join(' '),
            '-ms-transform': transform.join(' '),
            '-moz-transform': transform.join(' '),
            '-webkit-transform': transform.join(' ')
        });
        texts.push(clone.get(0));
    }
    texts = $(texts);
    texts.hide();
    text.after(texts);

    var shadowIndex = 0;
    var prevTime = Date.now();
    var hoverTime = Date.now();
    var hoverDirection;
    var hoverAnim;
    function hoverShadow() {
        var shadow = texts.eq(shadowIndex);
        hoverTime = Date.now();
        if (shadowIndex < numberOfShadows && shadowIndex >= 0) {
            if (hoverTime - prevTime > (shadowIndex + 1) / 10) {
                prevTime = hoverTime;
                if (hoverDirection === 'in' && shadowIndex < numberOfShadows - 1) {
                    shadow.show();
                    shadowIndex++;
                } else if (hoverDirection === 'out' && shadowIndex > 0) {
                    shadow.hide();
                    shadowIndex--;
                }
            }
            requestAnimationFrame(hoverShadow, text);
        } else {
            cancelAnimationFrame(hoverAnim);
        }
    }
    text.hover(function(e) {
        // Mouse in
        hoverDirection = 'in';
        hoverAnim = requestAnimationFrame(hoverShadow, text);
    }, function(e) {
        // Mouse out
        hoverDirection = 'out';
        hoverAnim = requestAnimationFrame(hoverShadow, text);
    });

    function colorToHex(color, addAmount) {
        var rgb;
        if (color.substr(0, 1) === '#') {
            // This is already a hex string, so chop of the hash.
            rgb = color.substr(1);
            // If this is a 3-character hex string, make it 6-characters long.
            if (rgb.length === 3) {
                // Get an array with each value duplicated, then join it into a
                // string.
                rgb = $.map(rgb.split(''), function(val) {
                    return val + val;
                }).join('');
            }
        } else {
            var digits = /(.*?)rgb\((\d+), ?(\d+), ?(\d+)\)/.exec(color);
            var red = parseInt(digits[2]);
            var green = parseInt(digits[3]);
            var blue = parseInt(digits[4]);
            // Adjust values if addAmount is passed.
            if (typeof addAmount !== 'undefined') {
                if (typeof addAmount === 'number') {
                    red += addAmount;
                    green += addAmount;
                    blue += addAmount;
                } else if (addAmount instanceof Array) {
                    red += addAmount[0] || 0;
                    green += addAmount[1] || 0;
                    blue += addAmount[2] || 0;
                } else if (typeof addAmount !== 'string') {
                    if (addAmount.hasOwnProperty('red')) {
                        red += addAmount.red;
                    } else if (addAmount.hasOwnProperty('green')) {
                        green += addAmount.green;
                    } else if (addAmount.hasOwnProperty('blue')) {
                        blue += addAmount.blue;
                    }
                }
            }
            // Get a base10 number.
            rgb = blue | (green << 8) | (red << 16);
            rgb = rgb.toString(16);
        }
        // Prepend rgb with zeros until it is 6 characters long.
        while (rgb.length < 6) {
            rgb = '0' + rgb;
        }
        return rgb;
    }

    function getRgbArray(color) {
        var hex;
        var rgb = [];
        if (color.substr(0, 1) === '#') {
            hex = color.substr(1);
            for (var i = 0; i < 3; i++) {
                rgb[i] = parseInt(hex[i * 2] + hex[i * 2 + 1], 16);
            }
        } else {
            hex = color.match(/rgb\(([^)]+)/);
            if (hex !== null && hex[1]) {
                rgb = hex[1].split(/, ?/);
            }
        }
        return rgb;
    }
});
