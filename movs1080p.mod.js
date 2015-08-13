/**
 * expects moviesUrl to be json:
 * {"tt036..": {"srcs": ["http://.."], "name": "Movie"},...
 * expects moviesMetaUrl to be json:
 * {"tt036..": {"y": "2003", "r": "5.9", "g": "Adventure, Comedy, Horror"},...
 */
(function() {

  var _name = '1080p';
  var _config = getLocalStorageItem('movs1080p_config', {
    moviesUrl: prompt("1080p movie src:", "https://cdn.rawgit.com/anonymous/"),
    moviesMetaUrl: "movies-1080p-meta.json",
    coverUrlTpl: 'http://example.com/imdb/cache/%s.jpg',
  });
  var genres = {};

  var _loaded = false;

  $(window).on('getvideoelement', function(evt, vid) {
    var meta = $(vid).data();
    if('src' in meta && meta.src == _name) {
      vid.title = _name +': '+ [meta.year, meta.rating, meta.genre].join(' - ');
      return vid;
    }
  });

  function getGenres(gstr) {
    var gen = gstr.split(/[, ]+/);
    $(gen).each(function(i,e) {
        genres[e] = (genres[e]||0) + 1;
    });
    return gen;
  }

  function loadMeta(cb) {
    $.getJSON(_config.moviesMetaUrl, function(meta) {
      if(!trigger("videosmetaload", this)) return;
      cb(meta);
    });
  }

  $(window).on('srcchange', function(evt, name) {
    if(_loaded || name != _name) return;

    _smc.checkUrl(_config.moviesUrl, function(err) {
      if(err) return alert(_name + ': ' + err);
      _loaded = true;

      $.getJSON(_config.moviesUrl, function(data) {
        if(!trigger("videosload", this)) return;

        loadMeta(function(metas) {
          for(var id in data) {
            var vid = {
              imdb: id,
              title: data[id].name,
              img: _config.coverUrlTpl.replace(/%s/, id),
              srcs: data[id].srcs,
            };
            if(id in metas) {
              var meta = metas[id];
              $.extend(vid, {
                rating: meta.r,
                year: meta.y,
                genre: getGenres(meta.g)
              });
            }
            _smc.addVideo(vid, _name);
          }
          trigger("videosmetaready", {genres: genres});
          trigger("videosready", this);
        });

      });
    });
  });

  _smc.addSource(_name);

  trigger("modloaded", _name+".mod.js");
})();