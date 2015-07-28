
$('<style>').append(
  'input.seen { position:absolute; top:0; left:0; width:17px; height:17px; opacity:.7; }'
  ).appendTo('head');

$('<label class="right"><input type="checkbox" id="hideseen">hide seen</label>')
    .prependTo('.header');

$(window).on('videosready', function() {
    $('.vid').prepend('<input type="checkbox" title="Seen" class="seen">');
    $.each(_seen, function(i,v) {
        $('.vid[data-imdb-id='+v+'] input.seen').prop('checked', true);
    });
});

var _seen = getLocalStorageItem("seen", []);

function hideSeen() {
    _smc.filterVideos($('.vid').has('.seen:checked'), true, true);
}

$(window).on("filter", function(evt, args, fout) {
    // was event caused by this module
    if(evt.callerguid == hideSeen.guid) return;
    if($('#hideseen').prop('checked')) hideSeen();
});

$('#hideseen').click(function() {
    if($(this).prop('checked'))
        hideSeen();
    else
        _smc.filterVideos([], true);
});

$('body').on('click', '.vid input.seen', function(ev) {
    ev.stopPropagation();

    var vid = $(this).closest('.vid');
    var imdbid = vid.data('imdb-id');
    if($(this).prop('checked')) {
        _seen.push(imdbid);
    } else {
        var pos = _seen.indexOf(imdbid);
        if(pos >= 0) {
            _seen.slice(pos, 1);
        }
    }
    localStorage.setItem('seen', JSON.stringify(_seen));

    if($('#hideseen').prop('checked')) hideSeen();
});
