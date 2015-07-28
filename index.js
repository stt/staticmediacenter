function loadInfoFor(ele) {
  if($(ele).attr('title')) return false;
  
  var url = "http://www.imdbapi.com/?i="+$(ele).data('imdb-id');
  $.getJSON(url, function(res) {
    $(ele)
      .css('background-image', 'url('+res.Poster+')')
      .attr('title', res.Plot);
  });
}

$(function() {
  var url = prompt("Movie src:", "https://cdn.rawgit.com/anonymous/");
  $.getJSON(url, function(data) {
    // http://www.imdbapi.com/?i=
    for(var id in data) {
      var d = $('<div class="vid">')
        .attr('data-img', 'http://tunemovietube.com/wp-content/plugins/imdb-info-box/cache/'+id+'.jpg')
        .data('imdb-id', id)
        .data('srcs', data[id].srcs.length)
        .append('<span class="title">'+data[id].name+'</span>');
      
      for(var src in data[id].srcs) {
        d.data('src-'+src, data[id].srcs[src]);
      }
      
      d.appendTo('body');
    }
    $('div.vid').appear();
  });
  
  $('body').on('click', 'div', function() {
    //loadInfoFor(this);
    $('#player').html('<iframe allowfullscreen frameborder="0" width="688" height="382" src="'+$(this).data('src-1')+'"></iframe>').show();
  }).on('appear', 'div.vid', function(e, $affected) {
    $.each($affected, function(i,e) {
      if($(e).data('img')) {
        $(e).append('<img src="'+$(e).data('img')+'"/>');
        $(e).data('img', '');
        console.log("loaded", $(e).data('img'));
      }
    });
    /*
    $affected = $affected.filter(function(e) {
      return !$(e).hasClass('loading');
    });
    if($affected.length) console.log($affected);
    $affected.addClass('loading');
    */
  });
});
