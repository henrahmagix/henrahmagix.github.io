$(function() {
    var text = $('.title');
    var textPos = text.position();
    var textColor = text.css('color');
    var numberOfShadows = 30;
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
        'transform-origin': '50% bottom',
        '-o-transform-origin': '50% bottom',
        '-ms-transform-origin': '50% bottom',
        '-moz-transform-origin': '50% bottom',
        '-webkit-transform-origin': '50% bottom'
    });
    var texts = [];
    var scaleDecrement;
    var translateDecrement;
    for (var i = 0, clone, color, transform; i < numberOfShadows; i++) {
        clone = textShadow.clone();
        scaleDecrement = 1 - (0.01 * i);
        translateDecrement = i;
        color = colorToHex(textColor, i * 1);
        transform = [
            'scale3d(' + [scaleDecrement, scaleDecrement, 1].join(', ') + ')',
            'translate3d(' + [0, translateDecrement + '%', 0].join(', ') + ')'
        ];
        clone.css({
            'color': '#' + color.toString(16),
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
    var shadowInterval;
    function hoverShadow(direction) {
        var shadow = texts.eq(shadowIndex);
        if (direction === 'in' && shadowIndex < numberOfShadows - 1) {
            shadow.show();
            shadowIndex++;
        } else if (direction === 'out' && shadowIndex > 0) {
            shadow.hide();
            shadowIndex--;
        } else {
            clearInterval(shadowInterval);
        }
    }
    text.hover(function(e) {
        // Mouse in, 10);
        clearInterval(shadowInterval);
        shadowInterval = setInterval(function() {hoverShadow('in')}, 5);
    }, function(e) {
        // Mouse out
        clearInterval(shadowInterval);
        shadowInterval = setInterval(function() {hoverShadow('out')}, 5);
    });

function colorToHex(color, addAmount) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);

    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);

    if (addAmount) {
        red += addAmount;
        green += addAmount;
        blue += addAmount;
    }

    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + rgb.toString(16);
}
});
