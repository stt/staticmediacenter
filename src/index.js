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

function getHash() {
  var obj = {};
  // not the best separators, historical reasons
  location.hash.replace(/^#/, '')
  .replace(/([^=,]+)=([^,]*)/g, function (str, key, value) {
    obj[key] = value;
  });
  return obj;
}
function setHash(obj) {
  var str = '';
  $.each(obj, function(k,v) {
    if(str) str += ',';
    str += k+ '=' +v;
  });
  location.hash = str;
}

function trigger(evtname, state, callerguid) {
  var evt = $.Event(evtname);
  evt.callerguid = callerguid;
  $(window).trigger(evt, state);
  return !evt.isDefaultPrevented();
}

function sortByTitle(e1,e2) {
  if(e1.title < e2.title) return -1;
  if(e1.title > e2.title) return 1;
  return 0;
}

// this is the global object available to mods
var _smc = (function(){

  var _version = '2015-08-03';

  // TODO: store _config as separate key-values
  var _config = getLocalStorageItem('config', {
    frameTpl: '<iframe scrolling="no" allowfullscreen frameborder="0" width="688" height="382" src="%s"></iframe>',
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
    'mobile': 'mobile.mod.js',
    'remember': 'remember.mod.js',
    'filter': 'filter.mod.js',
    'filterexpired': 'filterexpired.mod.js',
    'movs720p': 'movs720p.mod.js',
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
    //if(!trigger("videoadd", opts)) return;  // a bit heavy?
    if(!'imdb,title,img'.split(',').every(opts.hasOwnProperty, opts)) return false;
    var imdb = opts.imdb;
    _srcs[src].push(opts);

    // don't assume too much about the syntax of hash, mods may
    // also want to maintain some of their state there
    if(location.hash && location.hash.indexOf(imdb) > 0) {
      showVideo($(getVideoElement(opts)));
    }
  }

  function openVideoFrame(url) {
    $('#player iframe').remove();
    // HAX: wrapping iframe in iframe we can declare referrer=never on top frame,
    // use imdb imgs w/o ref and still send referrer to video sites that require it
    var frm = $(_config.frameTpl.replace(/%s/, '')).width(700).height(400).appendTo('#player');
    var doc = frm[0].contentWindow.document;
    doc.open();
    doc.close();
    var vidfrm = $(_config.frameTpl.replace(/%s/, url)).width('96%').height('96%');
    $("body", doc).append(vidfrm);

    //$('#player').html(_config.frameTpl.replace(/%s/, url));
  }

  function getVideoInfoHtml(ele) {
    var srcs = ele.data('srcs').sort(_smc.sortVideoServices);
    return '<span class="heading">video sources</span><ul id="srcs">'+
      srcs.map(function(e) {
        return '<li class="button" data-href="'+ e +'">'+ e.split(/\/+/)[1] +'</li>';
      }).join('')+
      '</ul>';
  }

  function showVideo(ele) {
    // mods might want to get video id from hash, so update that before event
    var imdbid = ele.data('imdb-id');
    location.hash = 'vid=' + imdbid;
    if(!trigger("playeropen", ele)) return;

    $('.selected').removeClass('selected');
    $(ele).addClass('selected');

    // call through public object incase it was overloaded
    $('.info').html(_smc.getVideoInfoHtml(ele));

    document.title = $('.title', ele).text();

    // open first video source by default, if nobody stops us
    var srcs = ele.data('srcs').sort(_smc.sortVideoServices);
    if(trigger("videosrcchange", srcs[0])) openVideoFrame(srcs[0]);

    $('body').addClass('video-mode');
  }

  function closePlayer() {
    if(!trigger("playerclose", this)) return;
    $('body').removeClass('video-mode');
    $('#player iframe').remove();
    location.hash = '';
  }

  $(window).on('progressing', function(evt, data) {
    if(data === "") {
      $('.loading').addClass('hidden');
      $('.progresslabel').text("");
    } else {
      $('.progresslabel').text(data);
      $('.loading').removeClass('hidden');
      //console.log(evt);
    }
  });

  function applyFilters(namedFilter) {
    var deferred = $.Deferred();

    $('#content .vid').detach();  // GOTCHA, .remove() removes .data() X|
    var srcname = $('select#src').val();
    if(!srcname || !(srcname in _srcs)) return;

    // initiate filter run so we can still update dom
    setTimeout(function() {

      _filtered = _srcs[srcname]; //if(!namedFilter) 
      if(!_filtered.length) return;

      var callerguid = 0;
      if(arguments.callee.caller) callerguid = arguments.callee.caller.guid;
      $('.filterinfo').text("");
      trigger('progressing', "running filters");

      $.each(_filters, function(i,filt) {

        var fn, ctx = {};
        if(typeof(filt) == "function") {
          fn = filt;
        } else if(typeof(filt) == "object" && 'fn' in filt) {
          fn = filt.fn;
          if('ctx' in filt && typeof(filt.ctx) == "function") ctx = filt.ctx();
        } else {
          return;
        }

        //if(namedFilter && namedFilter != fn.name) return;
        if(!trigger("filter", fn, callerguid)) return;

        deferred.notify();

        trigger('progressing', fn.name);

        var had = _filtered.length;
        var d1 = Date.now();

        /* TODO
          - should run worker(s) in promise queue
        vkthread.exec(_filtered.filter, [fn, ctx],
          function(data){
            console.log(arguments);
            _filtered = data;
          },
          _filtered);
        */
        _filtered = _filtered.filter(fn.bind(ctx));

        var d2 = Date.now(), diff = (d2-d1)/1000;
        console.log("applying", fn.name, "took", diff,
          "sec, it excluded", had - _filtered.length, "remaining", _filtered.length);

      });

      if($('#reverse').is(':checked')) {
        _filtered = _srcs[srcname].filter(function(e) { return _filtered.indexOf(e) < 0; });
        console.log("after reverse", _filtered.length, "remain");
      }

      $('.loading').addClass('hidden');

      trigger("videosfiltered");
      deferred.resolve();

    }, 10); // timeout

    return deferred.promise();
  }

  function applySorter(name) {
    if(!(name in _sorters)) return false;
    var fn = _sorters[name];
    _filtered.sort(fn);

    if($('#revsort').is(':checked')) {
      _filtered.reverse();
    }
    trigger("videossorted");
  }

  function refresh() {
    var ds1 = Date.now();

    _smc.applyFilters().then(function() {
      if(!applySorter($('#sortby').val())) showMoreVideos();
      console.log("filters+sort:", (Date.now()-ds1)/1000, "sec");

      $('.vid').detach();
      showMoreVideos();
      _smc.refreshView();
    });

  }

  function addFilter(fn, content, ctxfn) {
    _filters.push({fn: fn, ctx: ctxfn});
    if(content) {
      $('.filters').append(content).show();
      trigger("optionschange");
    }
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
    return _filtered
      .slice(vidcount, vidcount + (_config.videoPageLimit||100))
      .map(function(e,i) {
        return getVideoElement(e);
      });
  }

  function getVideoElement(opts) {
    var div = $('<div class="vid">');
    div.data('src', $('select#src').val());

    $.each(opts, function(k,v) {
      if(k == 'img') div.attr('data-img', v);
      else if(k == 'imdb') div.attr('data-imdb-id', v);
      else if(k == 'title') div.append('<span class="title" title="'+v+'">'+v+'</span>');
      else {
        // some mods use data props such as: rating, genre, year
        div.data(k, v);
      }
    });

    // let's see if mods like the default
    var ret = $(window).triggerHandler($.Event("getvideoelement"), div);
    return (ret ? ret : div);
  }

  function refreshView() {
    var srcname = $('select#src').val();
    if(srcname && srcname in _srcs) {
      $('.filterinfo').text(_filtered.length + " of " + _srcs[srcname].length);
    }
    $('div.vid').appear();
    $('body').scroll();
  }

  $(window).on('videosload', function() {
  });
  $(window).on('videosready', function() {
    _smc.refresh();
  });

  $(function() {

    _smc.addFilter(
      // minifying makes this a nameless function
      function filterSearch(e,i) {
        if(!this.searchTerm) return true;
        return e.title.toLowerCase().indexOf(this.searchTerm.toLowerCase()) >= 0;
      },
      // content
      null,
      // context (this)
      function() {
        return {searchTerm: $('#title').val().replace('"', '\"')};
      }
    );

    // KNOWN ISSUE:
    // Remember mod is tied to optionschange, if default sorter is
    // added before remember is listening then #src is not selected
    // and user has to select manually.
    // This doesn't happen on chrome but does happen on firefox, though
    // less frequently if addSorter is registered on document.ready
    addSorter('title', sortByTitle);

    // -- events
    $('.info').on('click', '#srcs *[data-href]', function() {
      var url = $(this).data('href');
      if(trigger("videosrcchange", url)) openVideoFrame(url);
    });
    
    $('#title').on('input', $.debounce(500, function(e) {
      if(!trigger("search", $('#title').val().replace('"', '\"'))) return;
      _smc.refresh();
    }));

    $('#revsort').change(function() {
      _smc.applySorter($('#sortby').val());
    });
    $('#sortby').change(function() {
      _smc.applySorter($(this).val());
    });
    $('#reverse').change(function() {
      _smc.refresh();
    });

    $('select#src').change(function() { // $.debounce(2000, 
      trigger('progressing', "loading videos");
      // queue the event that launches src loading, so
      // our dom update becomes visible first
      var src = this.value;
      setTimeout(function() {
        var d1 = Date.now();
        trigger("srcchange", src);
        console.log("video load took", (Date.now()-d1)/1000, "sec");
        trigger('progressing', "");
      }, 10);
    });

    $('#close').on('click', closePlayer);
    $(window).on('hashchange', function() {
      if(!location.hash) closePlayer();
    });

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
  });

  return {
    addFilter: addFilter,
    addSorter: addSorter,
    addSource: addSource,
    addVideo: addVideo,
    applyFilters: applyFilters,
    applySorter: applySorter,
    checkUrl: checkUrl,
    closePlayer: closePlayer,
    getConfig: function() { return _config; },
    getMods: function() { return _mods; },
    getVersion: function() { return _version; },
    getVideoInfoHtml: getVideoInfoHtml,
    loadScript: loadScript,
    showVideo: showVideo,
    sortVideoServices: sortVideoServices,
    refresh: refresh,
    refreshView: refreshView
  };

})();
