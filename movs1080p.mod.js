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

  $(window).on('getvideoelement', function(evt, vid) {
    var meta = $(vid).data();
    if('src' in meta && meta.src == '1080p') {
      vid.title = '1080p:' + [meta.year, meta.rating, meta.genre].join(' - ');
      return vid;
    }
  });

  function loadMeta(cb) {
    var genres = {};
    $.getJSON(_config.moviesMetaUrl, function(meta) {
      if(!trigger("videosmetaload", this)) return;
      $.each(meta, function(id,v) {
          var gen = v.g.split(/[, ]+/);
          $(gen).each(function(i,e) {
              genres[e] = (genres[e]||0) + 1;
          });
      });
      trigger("videosmetaready", {genres: genres});
      cb(meta);
    });
  }

  $(window).on('srcchange', function(evt, name) {
    if(_loaded || name != "1080p") return;

    _smc.checkUrl(_config.moviesUrl, function(err) {
      if(err) return alert('1080p: ' + err);
      _loaded = true;

      $.getJSON(_config.moviesUrl, function(data) {
        if(!trigger("videosload", this)) return;

        loadMeta(function(meta) {
          for(var id in data) {
            _smc.addVideo($.extend({
              imdb: id,
              title: data[id].name,
              img: _config.coverUrlTpl.replace(/%s/, id),
              srcs: data[id].srcs,
            }, meta[id]), '1080p');
          }
          trigger("videosready", this);
        });

      });
    });
  });

  _smc.addSource('1080p');

})();