$('<style>').append(
  '#filterby { overflow-y: auto; position: absolute; background-color: #ccc; }'+
  '#filterby label { display:block; color: black; font-size: medium; }'
  ).appendTo('head');

function intersect(array1, array2) {
    return array1.filter(function(n) {
        return array2.indexOf(n) != -1;
    });
}

$(window).on('keyup', $.debounce(250, function(e) {
  if(e.which == 27) { // esc
    if($('#filterby').is(':visible')) $('#filterby').hide();
  }
}));

function getSelectedGenres() {
    var selectedGenres = [];
    $('#filterby input:checked').each(function(i,e) {
        selectedGenres.push(e.value);
    });
    return selectedGenres;
}

var selectedGenres;
function filterByGenre(e,i) {
    // init when necessary
    if(!selectedGenres || i == 0) selectedGenres = getSelectedGenres();
    // nothing searched don't hide anything
    if(!selectedGenres.length) return true;

    var requireAll = $('#allany').val() == 'all';
    if(!e.data('genre')) return false;
    var gmatch = intersect(selectedGenres, e.data('genre'));
    return (requireAll ? gmatch.length == selectedGenres.length : gmatch.length);
}

function getNumericSort(sort) {
    return function sortNumeric(e1,e2) {
        var v1 = $(e1).data(sort);
        var v2 = $(e2).data(sort);
        if(!v1) return 1;
        if(!v2) return -1;
        var ret = Number(v1) - Number(v2);
        // on equals fall back on title sort
        if(!ret) ret = sortByTitle(e1, e2);
        return ret;
    };
}

function prepareControls(genres) {
    var filterdiv = $('<div class="left">');

    var genremenu = $('<div id="filterby">').width(150).height(250).hide();
    $.each(genres, function(g,count) {
        var chk = $('<input type=checkbox>').val(g);
        $('<label>')
            .text(g)
            .prepend(chk)
            .appendTo(genremenu);
    });
    $('<a id="genre-btn" class="button">Genres</a>').appendTo(filterdiv);
    genremenu.appendTo(filterdiv);

    var allany = $('<select id="allany">');
    $.each(['all','any'], function(i,s) {
        allany.append($('<option>').attr('value',s).text(s));
    })
    allany.appendTo(filterdiv);

    _smc.addSorter('year', getNumericSort('year'));
    _smc.addSorter('rating', getNumericSort('rating'));

    return filterdiv;
}

function bindEvents() {
    $('#genre-btn').click(function() {
        $('#filterby').toggle();
    });

    $('#allany').change(_smc.applyFilters);

    $('#filterby input').change(function() {
        $('#genre-btn').attr('title', $('#filterby input:checked').length+' selected');
        _smc.applyFilters();
    });
}


$(window).on('videosmetaready', function(evt, data) {
    if(!$('#filterby').length) {
        _smc.addFilter(filterByGenre, prepareControls(data.genres));
        bindEvents();
    }
});
