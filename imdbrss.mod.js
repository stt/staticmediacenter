(function() {

function filterByRssFeed(e) {
    return !imdbidLst.length || imdbidLst.indexOf(e.data('imdb-id')) >= 0;
}

var imdbidLst = [];

_smc.addFilter(filterByRssFeed, $('<div class="left">')
    .append('<button id="imdbrss">filter by imdb rss</button>'));

$('button#imdbrss').click(function() {
    var url = prompt('Imdb list RSS URL:', 'http://rss.imdb.com/list/ls000344406/');
    if(!url) return;
    try {
        new URL(url);
    } catch(e) {
        alert(e);
        return;
    }

    //url = 'http://www.whateverorigin.org/get?url='+ encodeURIComponent(url) +'&callback=?';
    //url = 'http://anyorigin.com/dev/get?url='+ encodeURIComponent(url) +'&callback=?';
    //$.getJSON(url, function(data) {  $(data.contents)

    $.get('http://demo.allow-any-origin.appspot.com/'+url, function(data) {
        var matches = $();
        var title = $(data).find('channel > title').text();
        var guids = $(data).find('item guid');
        console.log('loaded feed:', title, guids.length, 'items');

        guids.each(function(i,e) {
            var imdbid = $(e).text().match(/tt[0-9]+/);
            if(imdbid) {
                imdbidLst.push(imdbid[0]);
            }
        });

        _smc.applyFilters();

    }).error(function(err) {
        alert("error: " + JSON.stringify(err));
    });
});

})();
