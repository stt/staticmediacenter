
$('<style>').append(
  'input.seen { position:absolute; top:0; left:0; width:17px; height:17px; opacity:.7; }'
  ).appendTo('head');

$('<label class="right"><input type="checkbox" id="hideseen" class="remember">hide seen</label>')
    .prependTo('.header');

// notify that stuff in .header has changed (option remembering initializes with this)
trigger("optionschange");

$(window).on('videoslisted', function(vids) {
    $('.vid:not(:has(.seen))')
        .prepend('<input type="checkbox" title="Seen" class="seen">');

    // could be more performant to iterate the collection that's smaller
    $.each(_seen, function(i,v) {
        $('.vid[data-imdb-id='+v+']')
            .data('seen', true)
            .find('input.seen').prop('checked', true);
    });
});

var _seen = getLocalStorageItem("seen", []);

function filterSeen(e) {
    if(!$('#hideseen').prop('checked')) return true;
    //return !e.data('seen');
    return _seen.indexOf(e.data('imdb-id')) < 0;
}

_smc.addFilter(filterSeen);

$('#hideseen').click(_smc.applyFilters);

$('body').on('click', '.vid input.seen', function(ev) {
    ev.stopPropagation();

    var vid = $(this).closest('.vid');
    var imdbid = vid.data('imdb-id');
    if($(this).prop('checked')) {
        _seen.push(imdbid);
        vid.data('seen', true);
    } else {
        var pos = _seen.indexOf(imdbid);
        if(pos >= 0) {
            _seen.slice(pos, 1);
        }
        vid.data('seen', false);
    }
    localStorage.setItem('seen', JSON.stringify(_seen));

    if($('#hideseen').prop('checked')) {
        // full filter run overkill?
        //vid.detach();
        //_smc.refreshView();
        // ..except that if _filtered is not updated, next slice
        // of vids shown would likely contain the vid detached here
        _smc.applyFilters(filterSeen.name);
    }
});
