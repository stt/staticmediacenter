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

function sortByTitle(e1,e2) {
  var t1 = $('.title', e1).text();
  var t2 = $('.title', e2).text();
  if(t1 < t2) return -1;
  if(t1 > t2) return 1;
  return 0;
}

// this is the global object available to mods
var _smc = (function(){

  var _version = '2015-07-29';

  // TODO: store _config as separate key-values
  var _config = getLocalStorageItem('config', {
    frameTpl: '<iframe allowfullscreen frameborder="0" width="688" height="382" src="%s"></iframe>',
    srcPreferences: ['googlevideo.com', 'videomega.tv'],
    videoPageLimit: 100,
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
      // only ask if stored modcount != default modcount?
      var msg = 'Server had a newer version ('+curVer+' vs '+_version+
          '), want to reset mods?';
      if(confirm(msg)) {
        localStorage.removeItem('mods');
      }
    }
    localStorage.setItem('version', _version);
  }
  sanitizeStorage();

  // declare custom functionality here (key: scriptname, value: url)
  // TODO: RequireJS?
  var _mods = getLocalStorageItem('mods', {
    'modmgr': 'mgr.mod.js',
    'loadinfo': exampleMod,
    'remember': 'remember.mod.js',
    'filter': 'filter.mod.js',
    'movs1080p': 'movs1080p.mod.js',
    'seen': 'seen.mod.js',
    'gpad': 'gpad.mod.js',
  });

  $.each(_mods, loadScript);

  var _filters = [];
  var _sorters = {};
  var _srcs = {};
  var _filtered = [];

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

  function checkUrl(url, cb) {
    $.ajax({
      url: url,
      type: 'HEAD',
      complete: function(xhr) {
        cb((xhr.status == 200 ? null : xhr.statusText), xhr);
        //xhr.getResponseHeader('Content-Length')
      }
    });
  }

  function addSource(src) {
    if(src && !$('select#src').has('option[value='+src+']').length) {
      $('select#src').append($('<option>').attr('value',src).text(src));
      if(!(src in _srcs)) _srcs[src] = [];
      trigger("optionschange");
    }
  }

  /*
   Called by a mod to add videos to the page
   required opts props: imdb, title, img
  */
  function addVideo(opts, src) {
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

    _srcs[src].push(div);
    /*
    if($('select#src').val() == src && document.querySelectorAll('.vid').length < _config.videoPageLimit) {
      div.appendTo('#content');
    }*/

    return div;
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

    // HAX: wrapping iframe in iframe we can declare referrer=never on top frame,
    // use imdb imgs w/o ref and still send referrer to video sites that require it
    var frm = $(_config.frameTpl.replace(/%s/, '')).width(700).height(400).appendTo('#player')
    var doc = frm[0].contentWindow.document;
    doc.open();
    doc.close();
    $("body", doc).append(_config.frameTpl.replace(/%s/, srcs[0]));

    //$('#player').html(_config.frameTpl.replace(/%s/, srcs[0]));

    $('#bglayer,#plrcontainer').show();
  }

  function closePlayer() {
    if(!trigger("playerclose", this)) return;
    $('#bglayer,#plrcontainer').hide();
    $('#player iframe').remove();
  }

  var applyingFilters = false;
  // TODO: webworkers
  function applyFilters(namedFilter) {
    // should we queue a filtering rerun if one is requested during filtering?
    /* generally synchronous.. but http://stackoverflow.com/a/2734311
    if(applyingFilters) {
      console.log("filter req spam", arguments.callee.caller.name);
      return false;
    }
    applyingFilters = true;
    */
    $('#content .vid').detach();  // GOTCHA, .remove() removes .data() X|
    var srcname = $('select#src').val();
    if(!srcname || !(srcname in _srcs)) return;

    // doesn't actually display cause dom is waiting for us to finish
    $('.loading').removeClass('hidden');

    if(!namedFilter) _filtered = _srcs[srcname];

    var callerguid = arguments.callee.caller.guid;
    $('.filterinfo').text("");

    $.each(_filters, function(i,fn) {
      if(namedFilter && namedFilter != fn.name) return;

      if(!trigger("filter", fn, callerguid)) return;

      $('.progresslabel').text(fn.name);
      // NOTE jquery filter and js array filter have their args reversed X|
      var had = _filtered.length;
      var d1 = Date.now();

      _filtered = _filtered.filter(fn);

      var d2 = Date.now(), diff = (d2-d1)/1000;
      console.log("applying", fn.name, "took", diff,
        "sec, it excluded", had - _filtered.length, "remaining", _filtered.length);
    });

    if($('#reverse').is(':checked')) {
      _filtered = _srcs[srcname].filter(function(e) { return _filtered.indexOf(e) < 0; });
      console.log("after reverse", _filtered.length, "remain");
    }

    $('.loading').addClass('hidden');
    if(!applySorter($('#sortby').val())) showMoreVideos();
    // sorter might also detach and append so send the event after it
    trigger("videosfiltered");
  }

  function addFilter(fn, content) {
    _filters.push(fn);
    if(content) {
      $('.filters').append(content).show();
      trigger("optionschange");
    }
  }

  function applySorter(name) {
    if(!(name in _sorters)) return false;
    var fn = _sorters[name];
    _filtered.sort(fn.bind(_filtered));

    if($('#revsort').is(':checked')) {
      _filtered.reverse();
    }
    $('.vid').detach();
    showMoreVideos();
    refreshView();
  }

  function addSorter(name, fn) {
    _sorters[name] = fn;
    $('#sortby').append($('<option>').attr('value',name).text(name));
    trigger("optionschange");
  }

  function showMoreVideos() {
    var vids = getSomeVids();
    $('#content').append(vids);
    trigger("videoslisted", vids);
  }

  function getSomeVids() {
    var vidcount = document.querySelectorAll('.vid').length;
    if(vidcount >= _filtered.length) return [];
    return _filtered.slice(vidcount, vidcount + (_config.videoPageLimit||100));
  }

  function refreshView() {
    /* holycrap this was slow with 10k elements :)
    var viscount = $('.vid').has(':visible').length;
    */
    var srcname = $('select#src').val();
    if(srcname && srcname in _srcs) {
      $('.filterinfo').text(_filtered.length + " of " + _srcs[srcname].length);
    }
    $('body').scroll();
  }

  $(window).on('videosload', function() {
    $('.loading').show();
    $('.progresslabel').text("loading videos");
  });
  $(window).on('videosready', function() {
    if($('.progresslabel').text() == "loading videos") $('.loading').hide();
    applyFilters();
  });
  $(window).on('videosfiltered', function() {
    $('div.vid').appear();
    refreshView();
  });

  var searchTerm;
  _filters.push(function filterSearch(e,i) {
    // init when necessary
    if(!searchTerm || i == 0) searchTerm = $('#title').val().replace('"', '\"');
    if(!searchTerm) return true;
    // todo test performance difference vs data-attribute
    return e.has('.title:containsi("'+searchTerm+'")').length;
  });

  $(function() {
    // KNOWN ISSUE:
    // Remember mod is tied to optionschange, if default sorter is
    // added before remember is listening then #src is not selected
    // and user has to select manually.
    // This doesn't happen on chrome but does happen on firefox, though
    // less frequently if addSorter is registered on document.ready
    addSorter('title', sortByTitle);

    // -- events
    $('.info').on('click', '#srcs a', function() {
      if(!trigger("videosrcchange", this)) return;
      var frm = _config.frameTpl.replace(/%s/, $(this).data('href'));
      $('#player iframe').replaceWith(frm);
    });
    
    $('#title').on('input', $.debounce(500, function(e) {
      applyFilters();
    }));

    $('#revsort').change(function() {
      applySorter($('#sortby').val());
    });
    $('#sortby').change(function() {
      applySorter($(this).val());
    });
    $('#reverse').change(function() {
        applyFilters();
    });

    $('select#src').change(function() { // $.debounce(2000, 
      if(!trigger("srcchange", this.value)) return;
      if(this.value in _srcs) {
        // video provider likely still loading though
        applyFilters();
      }
    });

    $('#close').on('click', closePlayer);

    $('body').on('click', 'div.vid', function() {
      showVideo($(this));
    });

    $('body').on('appear', 'div.vid', function(e, $affected) {
      var load = $affected.filter('[data-img]');
      if(load.length && !trigger("coverload", load)) return;

      $.each(load, function(i,e) {
        // referrer="no-referrer" 
        var img = $(e).data('img');
        if(!img)
          $('<img class="empty"/>').prependTo($(e));
        else
          $('<img src="'+img+'"/>').prependTo($(e));
        $(e).removeAttr('data-img');
      });
    });

    $(window).scroll(function () {
      var totalh = $(window).scrollTop() + $(window).height();
      var tolerance = 100;
      if ($(document).height() - tolerance <= totalh) {
        showMoreVideos();
      }
    });

    // -- init
    $('#bglayer,#plrcontainer').hide();
  });

  return {
    addVideo: addVideo,
    showVideo: showVideo,
    closePlayer: closePlayer,
    loadScript: loadScript,
    getVersion: function() { return _version; },
    getConfig: function() { return _config; },
    getMods: function() { return _mods; },
    //addFilter: _filters.push.bind(_filters),
    addFilter: addFilter,
    addSorter: addSorter,
    addSource: addSource,
    applyFilters: applyFilters,
    refreshView: refreshView,
    checkUrl: checkUrl
  };

})();