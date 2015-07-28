$('<style>').append(
  '#filterby { overflow-y: auto; position: absolute; background-color: #ccc; }'+
  '#filterby label { display:block; color: black; font-size: medium; }'+
  'label[for=sortby] { margin-left: 15px; }'+
  'inputy[type=checkbox] { vertical-align: middle; }'
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

function applyGenreFilter() {
    var selectedGenres = getSelectedGenres();
    if(!selectedGenres.length) return _smc.filterVideos([], true);

    var requireAll = $('#allany').val() == 'all';
    // return true for ones we want to hide
    var filtered = $('.vid').filter(function(i,e) {
        if(!$(e).data('genre')) return true;
        var gmatch = intersect(selectedGenres, $(e).data('genre'));
        return (requireAll ? gmatch.length != selectedGenres.length : gmatch.length == 0);
    });
    _smc.filterVideos(filtered, true);
}

// called once after video metadata has loaded
function dominject(genres) {
    var filterdiv = $('<div class="left">');

    $('<label for="filterby">filter:</label>').appendTo(filterdiv);
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

    $('<label><input type="checkbox" id="reverse">reverse</label>')
        .appendTo(filterdiv);

    var sorts = ['year','rating'];
    $('<label for="sortby">sort:</label>').appendTo(filterdiv);
    var sele = $('<select id="sortby">');
    $.each(sorts, function(i,s) {
        sele.append($('<option>').attr('value',s).text(s));
    })
    sele.appendTo(filterdiv);

    filterdiv.prependTo('.header')

    // events

    $('#genre-btn').click(function() {
        $('#filterby').toggle();
    });

    $('#reverse').click(function() {
        $('.vid').toggle();
    });

    $('#sortby').change(function() {
        var sort = $(this).val();
        if(sort == 'year' || sort == 'rating') {
            $('.vid').sort(function(e1,e2) {
                var v1 = $(e1).data(sort);
                var v2 = $(e2).data(sort);
                if(!v1) return 1;
                if(!v2) return -1;
                return Number(v1) - Number(v2);
            }).appendTo('#content');
        }

        $('body').scroll();
    });

    // intercept filter events (e.g. title search) and apply genre filters
    $(window).on("filter", function(evt, args, fout) {
        // was event caused by this module
        if(evt.callerguid == applyGenreFilter.guid) return;

        console.log("reapply genre filter?", args.length, fout);
        if(!getSelectedGenres().length) return;

        // if we have genres and user searched for empty
        if(!args.length && fout) {
            evt.preventDefault();
            applyGenreFilter();
        //} else {
        //    $('#filterby input:checked').prop('checked',false);
        }
    });

    $('#allany').change(applyGenreFilter);

    $('#filterby input').change(applyGenreFilter);
}


$(window).on('videosmetaready', function(evt, data) {
    if(!$('#filterby').length) dominject(data.genres);
});
