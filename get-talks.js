// This script parses .gitmodules for Gist IDs, then fetches each Gist's files.
$(function() {
    var gitModulesUrl = 'https://api.github.com/repos/henrahmagix/presentations/contents/.gitmodules/';
    var gistAPI = 'https://api.github.com/gists/';

    function getTalks(callback) {
        var talks;
        $.get(gitModulesUrl, function(data, textStatus, jqXHR) {
            talks = getGistsFromGitModules(Base64.decode(data.content));
            callback(talks);
        });
    }

    function getGistsFromGitModules(str) {
        var submodules = [];
        var getSegments = /\[submodule.*\n[^\[]*\n[^\[]*/g;
        var segments = str.match(getSegments);
        var segment;
        var gistId;
        for (var i = 0; i < segments.length; i++) {
            segment = segments[i];
            gistId = getGistId(segment);
            if (gistId) {
                submodules.push({
                    id: gistId,
                    name: getGistName(segment)
                });
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

    function showTalks(talks) {
        var area = $('.talks');
        var talk;
        for (var i = 0; i < talks.length; i++) {
            talk = talks[i];
            $.get(gistAPI + talk.id, function(data, textStatus, jqXHR) {
                area.append('<div class="talk"><h3><a href="#' + talk.id + '">' + talk.name + '</a></h3></div>');
            });
        }
    }

    getTalks(showTalks);
});
