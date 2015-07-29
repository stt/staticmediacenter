/**
 * expects moviesUrl to be json:
 * {"tt036..": {"srcs": ["http://.."], "name": "Movie"},...
 * expects moviesMetaUrl to be json:
 * {"tt036..": {"y": "2003", "r": "5.9", "g": "Adventure, Comedy, Horror"},...
 */
(function() {

  var _config = getLocalStorageItem('movs1080p_config', {
    moviesUrl: prompt("1080p movie src:", "https://cdn.rawgit.com/anonymous/"),
    moviesMetaUrl: "movies-1080p-meta.json",
    coverUrlTpl: 'http://example.com/imdb/cache/%s.jpg',
  });

  var _loaded = false;

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

  $(window).on('srcchange', function(evt, name) {
    if(_loaded || name != "1080p") return;

    _smc.checkUrl(_config.moviesUrl, function(err) {
      if(err) return alert('1080p: ' + err);
      _loaded = true;

      $.getJSON(_config.moviesUrl, function(data) {
        if(!trigger("videosload", this)) return;
        for(var id in data) {
          _smc.addVideo({
            imdb: id,
            title: data[id].name,
            img: _config.coverUrlTpl.replace(/%s/, id),
            srcs: data[id].srcs,
          }, '1080p');
        }
        loadMeta();
        trigger("videosready", this);
      });
    });
  });

  _smc.addSource('1080p');

})();