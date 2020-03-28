---
layout: default
title: Do it for me
class: post
---

What can I do for you?

<form id="doit">
    <input id="doit-input" type="text" placeholder="Tell me what to do">
    <button type="submit">Please?</button>
</form>

<script>
var form = document.getElementById('doit');
var input = document.getElementById('doit-input');

var image = document.createElement('img');
image.alt = 'GIF saying it is done';

var message = document.createElement('p');
message.textContent = '🎉it is done 🎉';

var images = [
    'https://media.giphy.com/media/Vh2AWuLGA1TX2MPGkn/giphy.gif',
    'https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif',
    'https://media.giphy.com/media/QMsS2IxP812wbn4WeE/giphy.gif',
    'https://media.giphy.com/media/QhmboW0R7eUbm/giphy.gif',
    'https://media.giphy.com/media/9g8PH1MbwTy4o/giphy.gif',
    'https://media.giphy.com/media/8UF0EXzsc0Ckg/giphy.gif',
    'https://media.giphy.com/media/52FcaTVc9Y1rk7q1NQ/giphy.gif',
    'https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif',
    'https://media.giphy.com/media/32aROMpuC7xqKdWbKO/giphy.gif',
];

form.addEventListener('submit', function (event) {
    event.preventDefault();
    form.replaceWith(message);
    var imageIndex = Math.floor(Math.random() * (images.length - 1));
    image.src = images[imageIndex];
    form.parentElement.appendChild(image);
});
</script>
