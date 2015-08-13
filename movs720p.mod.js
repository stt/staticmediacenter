/**
 * Expects moviesUrl to be json:
 * {"tt036..": {
 *   "t": "Title", s": ["http://.."], y": "2003", "r": "5.9",
 *   "g": "Adventure, Comedy, Horror", "i": "MV5BMTI4ODI5Mz.."
 *   },...
 * Where "i" is imdb image code for http://ia.media-imdb.com/images/M/..
 */
(function() {

  var _name = '720p';
  var _config = getLocalStorageItem('movs720p_config', {
    moviesUrl: prompt(_name+" movie src:", "https://cdn.rawgit.com/anonymous/"),
  });
  var genres = {};

  var _loaded = false;

  function getGenres(gstr) {
    var gen = gstr.split(/[, ]+/);
    $(gen).each(function(i,e) {
        genres[e] = (genres[e]||0) + 1;
    });
    return gen;
  }

  $(window).on('getvideoelement', function(evt, vid) {
    var meta = $(vid).data();
    if('src' in meta && meta.src == _name) {
      vid.title = _name+': ' + [meta.year, meta.rating, meta.genre].join(' - ');
      return vid;
    }
  });

  $(window).on('srcchange', function(evt, name) {
    if(_loaded || name != _name) return;

    _smc.checkUrl(_config.moviesUrl, function(err) {
      if(err) return alert(_name + ': ' + err);
      _loaded = true;
      
      $.getJSON(_config.moviesUrl, function(data) {
        if(!trigger("videosload", this)) return;

        for(var id in data) {
          var img = '', meta = data[id];
          if('i' in meta) img = 'http://ia.media-imdb.com/images/' + 
            meta.i[0] + '/' + meta.i + '._V1_SX90.jpg';

          var vid = _smc.addVideo({
            imdb: id,
            title: meta.t,
            img: img,
            srcs: meta.s,
            year: meta.y,
            rating: meta.r,
            genre: getGenres(meta.g)
          }, _name);
        }

        trigger("videosmetaready", {genres: genres});
        trigger("videosready", this);

      });
    });

  });

  _smc.addSource(_name);

  trigger("modloaded", _name+".mod.js");
})();