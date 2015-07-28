$.extend($.expr[':'], {
  'containsi': function(elem, i, match, array) {
    return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || "").toLowerCase()) >= 0;
  }
});
/*
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(b,c){var $=b.jQuery||b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);

function getLocalStorageItem(key, def) {
  var val = localStorage.getItem(key);
  if(val == null) {
    localStorage.setItem(key, JSON.stringify(def));
    return def;
  }
  try {
    return (val ? JSON.parse(val) : val);
  } catch(e) {
    console.log(e);
  }
}

function trigger(evtname, state, callerguid) {
  var evt = $.Event(evtname);
  evt.callerguid = callerguid;
  $(window).trigger(evt, state);
  return !evt.isDefaultPrevented();
}

// this is the global object available to mods
var _smc = (function(){

  var _version = '2015-07-27';

  var _config = getLocalStorageItem('config', {
    frameTpl: '<iframe allowfullscreen frameborder="0" width="688" height="382" src="%s"></iframe>',
    srcPreferences: ['googlevideo.com', 'videomega.tv'],
  });

  // if you change this, remove mods from localStorage
  var exampleMod = "data:text/javascript;base64," + btoa('console.log("info mod loaded");'+
    '$(window).on("playeropen", function(ev, that) {'+
    '  $.getJSON("http://www.imdbapi.com/?i=" + $(that).data("imdb-id"), function(res) {'+
    '    var lst = $(\'<dl style="overflow-y: auto;">\').height(250);'+
    '    for(var i in res) lst.append("<dt>"+i+"</dt><dd>"+res[i]+"</dd>");'+
    '    $(".info").append(lst);'+
    '  });'+
    '});');

  function sanitizeStorage() {
    var curVer = localStorage.getItem('version');
    var haveVersion = curVer != null;
    var haveMods = localStorage.getItem('mods') != null;
    if(!haveVersion && haveMods) {
      console.log("early version");
      localStorage.removeItem('mods');
    } else if (haveVersion && Date.parse(curVer) < Date.parse(_version)) {
      console.log("old version", curVer);
    }
    localStorage.setItem('version', _version);
  }
  sanitizeStorage();

  // declare custom functionality here (key: scriptname, value: url)
  // TODO: RequireJS?
  var _mods = getLocalStorageItem('mods', {
    'modmgr': 'mgr.mod.js',
    'loadinfo': exampleMod,
    'filter': 'filter.mod.js',
    'movs1080p': 'movs1080p.mod.js',
    'gpad': 'gpad.mod.js',
  });

  $.each(_mods, loadScript);

  var _filters = [];

  function loadScript(k, v) {
    if(!trigger("scriptload", arguments)) return;
    var script = $("<script>");
    var head = $('head').append(script);
    console.log("loading mod", arguments);
    // jquery adds a timestamp param if src attrib is there when injected to head
    script.attr('src', v);
  }

  function sortVideoServices(s1, s2) {
    for(var pi in _config.srcPreferences) {
      var pref = _config.srcPreferences[pi];
      if(s1.indexOf(pref) > 0) return -1;
      if(s2.indexOf(pref) > 0) return 1;
    }
    if(s1 < s2) return -1;
    if(s1 > s2) return 1;
    return 0;
  }

  /*
   Called by a mod to add videos to the page
   required opts props: imdb, title, img
  */
  function addVideo(opts) {
    if(!trigger("videoadd", opts)) return;
    if(!'imdb,title,img'.split(',').every(opts.hasOwnProperty, opts)) return false;
    var div = $('<div class="vid">')
      .attr('data-img', opts.img)
      .attr('data-imdb-id', opts.imdb)
      .append('<span class="title" title="'+opts.title+'">'+opts.title+'</span>');
    delete opts.img;
    delete opts.imdb;
    delete opts.title;
    // some mods use data props such as: rating, genre, year
    for(var p in opts) {
      div.data(p, opts[p]);
    }
    div.appendTo('#content');
  }

  function showVideo(ele) {
    if(!trigger("playeropen", ele)) return;
    var imdbid = ele.data('imdb-id');
    location.hash = 'vid-' + imdbid;
    var srcs = ele.data('srcs').sort(sortVideoServices);

    $('.info').html('<span class="heading">video sources</span><ul id="srcs">'+
      srcs.map(function(e) {
        return '<li class="button"><a data-href="'+ e +'">'+ e.split(/\/+/)[1] +'</a>';
      }).join('')+
      '</ul>'
    );

    document.title = $('.title', ele).text();
    $('#player').html(_config.frameTpl.replace(/%s/, srcs[0]));
    $('#bglayer,#plrcontainer').show();
  }

  function closePlayer() {
    if(!trigger("playerclose", this)) return;
    $('#bglayer,#plrcontainer').hide();
    $('#player iframe').remove();
  }

  /*
  TODO: refiltering based on events is hazardous (loop), add a queue where
  mods can register filter functions and let index.js decide when to filter
   @param lst, jquery obj
   @param filterOut, false: only show lst, true: lst is hidden
   @param incremental, only operate on lst, don't touch others
  */
  function filterVideos(lst, filterOut, incremental) {
    if(!trigger("filter", arguments, arguments.callee.caller.guid)) return;
    if(filterOut) {
      if(!incremental) $('.vid').show();
      $(lst).hide();
    } else {
      if(!incremental) $('.vid').hide();
      $(lst).show();
    }
    $('body').scroll();
  }

  // e.g. 1 show, 2 hide !genres, 3 hide seen, hide !search
  function applyFilters() {
    $('.vid').show();
    $.each(_filters, function(i,fn) {
      $('.vid:visible').filter(fn).hide();
    });
  }

  $(window).on('videosready', function() {
    $('div.vid').appear();
    $('body').scroll();
  });

  var searchTerm;
  _filters.push(function(i,e) {
    // init when necessary
    if(!searchTerm || i == 0) searchTerm = $('#title').val().replace('"', '\"');
    // nothing searched don't hide anything
    if(!searchTerm) return false;
    // simple case-insensitive indexOf
    return $(e).has('.title:containsi("'+searchTerm+'")');
  });

  $(function() {
    $('.info').on('click', '#srcs a', function() {
      if(!trigger("videosrcchange", this)) return;
      var frm = _config.frameTpl.replace(/%s/, $(this).data('href'));
      $('#player iframe').replaceWith(frm);
    });
    
    var lastSearchScope;
    $('#title').on('input', $.debounce(250, function(e) {
      $('.srchinfo').text("");
      if(!trigger("search", this)) return;
      if(!$(this).val()) return filterVideos([], true);
      var val = $(this).val().replace('"', '\"');
      /* reset visibility of last search
      if(lastSearchScope) lastSearchScope.show();
      lastSearchScope = $('.vid:visible');
      */
      var res = $('.vid:visible').has('.title:containsi("'+val+'")');
      $('.srchinfo').text(res.length + " results");
      filterVideos(res);
    }));

    $('#close').on('click', closePlayer);

    $('body').on('click', 'div.vid', function() {
      showVideo($(this));
    });

    $('body').on('appear', 'div.vid', function(e, $affected) {
      var load = $affected.filter('[data-img]');
      if(load.length && !trigger("coverload", load)) return;

      $.each(load, function(i,e) {
        // referrer="no-referrer" 
        $(e).prepend('<img src="'+$(e).data('img')+'"/>');
        $(e).removeAttr('data-img');
      });
    });

    $('#bglayer,#plrcontainer').hide();
  });

  return {
    addVideo: addVideo,
    showVideo: showVideo,
    //filterVideos: filterVideos,
    closePlayer: closePlayer,
    loadScript: loadScript,
    getVersion: function() { return _version; },
    getConfig: function() { return _config; },
    getMods: function() { return _mods; },
    addFilter: _filters.push,
  };

})();
