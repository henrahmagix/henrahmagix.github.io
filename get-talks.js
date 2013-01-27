// This script parses .gitmodules for Gist IDs, then fetches each Gist's files.
$(function() {
    var gitModulesUrl = 'https://api.github.com/repos/henrahmagix/presentations/contents/.gitmodules/';
    var gistAPI = 'https://api.github.com/gists/';
    var markdownAPI = 'https://api.github.com/markdown';

    function getTalks(callback) {
        var talks;
        $.get(gitModulesUrl, function(data, textStatus, jqXHR) {
            if (data.content) {
                talks = getGistsFromGitModules(Base64.decode(data.content));
                callback(talks);
            }
        });
    }

    function getGistsFromGitModules(str) {
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
        var url = /gist\.github\.com:([0-9]+)/;
        var matches = str.match(url);
        return (matches) ? matches[1] : matches;
    }

    function getGistName(str) {
        var path = /path = (.+)/;
        return str.match(path)[1];
    }

    function insertTalks(talks) {
        var area = $('.talks');
        var wrapper = $('<article class="talk"><h3><a class="gist"></a></h3><div class="markdown-content"></div></article>');
        for (var id in talks) {
            $.get(gistAPI + id, function(data, textStatus, jqXHR) {
                var $talk = wrapper.clone();
                var thisTalk;
                var markdown;
                talks[id].description = data.description;
                talks[id].files = data.files;
                thisTalk = talks[id];
                if (thisTalk.hasOwnProperty('files')) {
                    for (file in thisTalk.files) {
                        file = thisTalk.files[file];
                        if (file.language === 'Markdown') {
                            markdown = renderTalk(file.content);
                            $talk.find('.markdown-content').hide().append(markdown);
                            $talk.find('.gist')
                                .attr({
                                    'data-gist-id': id,
                                    'data-talk': 'closed',
                                    'href': '//gist.github.com/' + id
                                })
                                .text(thisTalk.description);
                            area.append($talk);
                        }
                    }
                }
            });
        }
        // Click events.
        $(document).on('click', '.gist', showTalk);
    }

    function showTalk(e) {
        // Stop regular click event.
        e.preventDefault();
        var $talkLink = $(e.currentTarget);
        var $talkContent = $talkLink.closest('.talk').find('.markdown-content');
        var gistId = $talkLink.attr('data-gist-id');
        if (gistId) {
            if ($talkLink.attr('data-talk') === 'open') {
                $talkLink.attr('data-talk', null);
                $talkContent.fadeOut(function() {
                    $('.title, .links').slideDown().promise().done(function() {
                        $talkLink.attr('data-talk', 'closed');
                    });
                });
            } else if ($talkLink.attr('data-talk') === 'closed') {
                $talkLink.attr('data-talk', null);
                $('.title, .links').slideUp().promise().done(function() {
                    $talkContent.fadeIn(function() {
                        $talkLink.attr('data-talk', 'open');
                    });
                });
            }
        }
        return false;
    };

    function renderTalk(str) {
        var converter = new Showdown.converter();
        return converter.makeHtml(str);
    }

    getTalks(insertTalks);

});
