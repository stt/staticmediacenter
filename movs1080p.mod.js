(function() {

  var _config = getLocalStorageItem('movs1080p_config', {
    moviesUrl: prompt("Movie src:", "https://cdn.rawgit.com/anonymous/",
    moviesMetaUrl: "movies-1080p-meta.json",
    coverUrlTpl: 'http://example.com/imdb/cache/%s.jpg',
  });

  function loadMeta() {
    var genres = {};
    $.getJSON(_config.moviesMetaUrl, function(meta) {
      if(!trigger("videosmetaload", this)) return;
      $.each(meta, function(id,v) {
          var gen = v.g.split(/[, ]+/);
          $(gen).each(function(i,e) {
              genres[e] = (genres[e]||0) + 1;
          });
          $('.vid[data-imdb-id="'+id+'"]')
              .data('year', v.y)
              .data('rating', v.r)
              .data('genre', gen)
              .attr('title', JSON.stringify(v));
      });
      trigger("videosmetaready", {genres: genres});
    });
  }

  $.getJSON(_config.moviesUrl, function(data) {
    if(!trigger("videosload", this)) return;
    for(var id in data) {
      _smc.addVideo({
        imdb: id,
        title: data[id].name,
        img: _config.coverUrlTpl.replace(/%s/, id),
        srcs: data[id].srcs,
      });
    }
    loadMeta();
    trigger("videosready", this);
  });

})();
