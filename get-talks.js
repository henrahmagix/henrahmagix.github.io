// This script parses .gitmodules for Gist IDs, then fetches each Gist's files.
$(function() {

    var $document = $(document);
    var $container = $('.talks');
    // Get the element with which we can animate scroll. Info about how to not
    // break in Opera from http://stackoverflow.com/a/5580397
    var $scrollWindow = $(window.opera ? 'html' : 'html, body');
    var myTalks;
    // Define the speed of animations.
    var speed = {
        instant: 80,
        fast: 200,
        slow: 450
    };
    // Here are the various GitHub API urls we use, tidied into a handy object.
    var urls = {
        api: 'https://api.github.com',
        gitModules: 'https://api.github.com/repos/henrahmagix/presentations/contents/.gitmodules',
        gist: 'https://api.github.com/gists'
    };
    // Lets keep all our messages in a nice object too.
    var msg = {
        load: {
            $el: $('.loading'),
            original: $('.loading').html()
        },
        error: {
            $el: $('.error'),
            original: $('.error').html()
        }
    };

    // Setup ajax consistents.
    $.ajaxSetup({
        cache: true,
        dataType: 'jsonp',
        data: {
            access_token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
    });

    function getListOfTalks() {
        // Fetch talks from GitHub API.
        $.ajax({
            url: urls.gitModules
        }).done(function(response) {
            var decoded;
            var data = response.data;
            if (typeof data === 'string') {
                // Without dataType = json, the JSON shouldn't get parsed
                // automatically.
                data = $.parseJSON(data);
            }
            if (data !== null && data.hasOwnProperty('content')) {
                // To ensure compatibility with all browsers, use the Base64
                // library. This also deals with whitespace and newline chars.
                decoded = Base64.decode(data.content);
                // Parse and save the returned list of talks.
                myTalks = parseGists(decoded);
                if (myTalks) {
                    for (var id in myTalks) {
                        getIndividualTalk(myTalks[id]);
                    }
                } else {
                    $document.trigger('talk.error');
                }
            } else {
                $document.trigger('talk.error');
            }
        }).fail(function() {
            $document.trigger('talk.error');
        });
    }

    function getIndividualTalk(talk) {
        $.ajax({
            url: urls.gist + '/' + talk.id
        }).done(function(response) {
            var data = response.data;
            if (typeof data === 'string') {
                data = $.parseJSON(data);
            }
            if (data !== null && data.hasOwnProperty('files')) {
                talk.files = data.files;
                talk.description = data.description || '';
                insertFiles(talk);
            } else {
                $document.trigger('talk.error', ['No files found in gist "' + talk.name + '"']);
            }
        }).fail(function() {
            $document.trigger('talk.error', ['Gist "' + talk.name + '" failed to load.']);
        });
    }

    function parseGists(str) {
        var submodules = {};
        var getSegments = /\[submodule.*\n[^\[]*\n[^\[]*/g;
        var segments = str.match(getSegments);
        var segment;
        var gistId;
        for (var i = 0; i < segments.length; i++) {
            segment = segments[i];
            gistId = getGistId(segment);
            if (gistId) {
                submodules[gistId] = {
                    id: gistId,
                    name: getGistName(segment)
                };
            }
        }
        return submodules;
    }

    function getGistId(str) {
        var url = /gist\.github\.com:([0-9a-zA-Z]+)/;
        var matches = str.match(url);
        return (matches && matches[1]) ? matches[1] : false;
    }

    function getGistName(str) {
        var path = /path = (.+)/;
        var matches = str.match(path);
        return (matches && matches[1]) ? matches[1] : false;
    }

    function getTalkGist(talk) {
        return $.ajax({
            url: urls.gist + talk.id
        });
    }

    function insertFiles(talk) {
        var file;
        var fileName;
        var markdown;
        var wrapper = $('<article class="talk"><h3 class="talk-title"><a class="gist"></a></h3><div class="markdown-content"></div></article>');
        var $talk;
        for (fileName in talk.files) {
            file = talk.files[fileName];
            if (file.language === 'Markdown') {
                $talk = wrapper.clone();
                markdown = renderTalk(file.content);
                $talk.find('.markdown-content').hide().append(markdown);
                $talk.find('.gist').attr({
                    'data-gist-id': talk.id,
                    'data-talk': 'closed',
                    'href': '//gist.github.com/' + talk.id
                }).text(talk.description);
                // Add the talk.
                $container.append($talk);
                $document.trigger('talk.success', [talk.id]);
            }
        }
    }

    function renderTalk(str) {
        var converter = new Showdown.converter();
        return converter.makeHtml(str);
    }

    function toggleTalk(e) {
        // Stop regular click event and propagation.
        e.preventDefault();
        e.stopPropagation();
        var $talkLink = $(e.currentTarget);
        var $talkContent = $talkLink.closest('.talk').find('.markdown-content');
        var gistId = $talkLink.attr('data-gist-id');
        if (gistId) {
            if ($talkLink.attr('data-talk') === 'open') {
                $talkLink.attr('data-talk', null);
                $talkContent.slideUp(speed.slow, function() {
                    $talkLink.attr('data-talk', 'closed');
                });
            } else if ($talkLink.attr('data-talk') === 'closed') {
                $talkLink.attr('data-talk', null);
                $talkContent.slideDown(speed.slow, function() {
                    $talkLink.attr('data-talk', 'open');
                });
                $scrollWindow.animate({
                    scrollTop: $talkLink.offset().top - parseInt($talkLink.closest('.talk').css('margin-top'), 10)
                }, speed.slow);
            }
        }
        return false;
    }

    function showError(e, text) {
        var err = msg.error;
        var load = msg.load;
        if (text) {
            err.$el.text(text);
        } else {
            err.$el.html(err.original);
        }
        load.$el.fadeOut(speed.instant, function() {
            err.$el.fadeIn(speed.fast);
        });
    }

    function showSuccess(e, id) {
        var err = msg.error;
        var load = msg.load;
        err.$el.add(load.$el).fadeOut(speed.instant).promise().done(function() {
            $('.gist').filter(function() {
                return $(this).attr('data-gist-id') === id;
            }).closest('.talk').fadeIn(speed.fast);
        });
    }

    // When the DOM is ready, start fetching the talks.
    getListOfTalks();

    // Catch and action events resulting from fetching the talks.
    // Notifications to the user.
    $document.on('talk.error', showError);
    // Insert the talks into the DOM.
    $document.on('talk.success', showSuccess);
    // Toggle the display of a talk's content when clicking it.
    $document.on('click', '.gist', toggleTalk);
});
