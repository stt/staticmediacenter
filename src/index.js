var _smc = (function(){

  var _version = '2015-08-13';

  // TODO: store _config as separate key-values
  var _config = getLocalStorageItem('config', {
    frameTpl: '<iframe scrolling="no" allowfullscreen frameborder="0" width="688" height="382" src="%s"></iframe>',
    srcPreferences: ['googlevideo.com', 'videomega.tv'],
    videoPageLimit: 100,
  });

  // if you change this, remove mods from localStorage
  var exampleMod = "data:text/javascript;base64," + btoa(
    '$(window).on("playeropened", function(ev, that) {'+
    '  $.getJSON("http://www.imdbapi.com/?i=" + $(that).data("imdb-id"), function(res) {'+
    '    var lst = $(\'<dl style="overflow-y: auto;">\').height(250);'+
    '    for(var i in res) lst.append("<dt>"+i+"</dt><dd>"+res[i]+"</dd>");'+
    '    $(".info", that).append(lst);'+
    '  });'+
    '});'+
    'trigger("modloaded", "loadinfo");'
    );

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
    'multi': 'multi.mod.js',
  });
  var _modloadcount = 0;

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

  function addFilter(fn, content, ctxfn) {
    _filters.push({fn: fn, ctx: ctxfn});
    if(content) {
      $('.filters').append(content);
      trigger("optionschange");
    }
  }

  function addSorter(name, fn) {
    _sorters[name] = fn;
    $('#sortby').append($('<option>').attr('value',name).text(name));
    trigger("optionschange");
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
    // TODO: should probably be public function if there's need for override
    var ret = $(window).triggerHandler($.Event("getvideoelement"), div);
    return (ret ? ret : div);
  }

  function getVideoInfoHtml(ele) {
    var srcs = $(ele).data('srcs').sort(_smc.sortVideoServices);
    return '<h3>'+ $('.title', ele).text() +'</h3>'+
      '<span class="heading">video sources</span><ul class="srcs">'+
      srcs.map(function(e) {
        return '<li class="button" data-href="'+ e +'">'+ e.split(/\/+/)[1] +'</li>';
      }).join('')+
      '</ul>';
  }

  function getVideoFrame(url) {
    // HAX: wrapping iframe in iframe we can declare referrer=never on top frame,
    // use imdb imgs w/o ref and still send referrer to video sites that require it
    var frm = $(_config.frameTpl.replace(/%s/, ''))
      .width(700).height(400);
    frm.load(function() {
      var doc = frm[0].contentWindow.document;
      doc.open();
      doc.close();
      var vidfrm = $(_config.frameTpl.replace(/%s/, url))
        .width('96%').height('96%');
      $("body", doc).append(vidfrm);
    });

    //$('#player').html(_config.frameTpl.replace(/%s/, url));
    return frm;
  }

  function showVideo(ele) {
    if(!trigger("playeropen", ele)) return;

    var imdbid = ele.data('imdb-id');
    location.hash = 'vid=' + imdbid;

    $('.selected').removeClass('selected');
    $(ele).addClass('selected');

    // call through public object incase it was overloaded
    $('.info').html(_smc.getVideoInfoHtml(ele));

    document.title = $('.title', ele).text();

    // open first video source by default, if nobody stops us
    var srcs = ele.data('srcs').sort(_smc.sortVideoServices);
    if(trigger("videosrcchange", srcs[0])) {
      $('iframe', '.plrcontainer .player').remove();
      getVideoFrame(srcs[0]).appendTo($('.plrcontainer .player'));
    }

    $('.plrcontainer')
      .data('imdb-id', imdbid)
      .removeClass('hidden');

    $('body').addClass('video-mode');
    trigger("playeropened", $('.plrcontainer'));
  }

  function closePlayer() {
    if(!trigger("playerclose", this)) return;
    $('body').removeClass('video-mode');
    $('.plrcontainer').addClass('hidden');
    $('.player iframe').remove();
    location.hash = '';
  }

  function applyFilters(namedFilter) {
    var deferred = $.Deferred();

    var srcname = $('select#src').val();
    if(!srcname || !(srcname in _srcs)) return;

    // initiate filter run so we can still update dom
    setTimeout(function() {

      _filtered = _srcs[srcname]; //if(!namedFilter) 
      if(!_filtered.length) return;

      var callerguid = 0;
      if(arguments.callee.caller) callerguid = arguments.callee.caller.guid;
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

  // clear videos, apply filters, sorter and relist videos
  function refresh() {
    var ds1 = Date.now();
    $('#content .vid').detach();  // GOTCHA, .remove() removes .data() X|

    _smc.applyFilters().then(function() {
      applySorter($('#sortby').val());
      console.log("filters+sort:", (Date.now()-ds1)/1000, "sec");

      $('.vid').detach();
      showMoreVideos();
      _smc.refreshView();
    });
  }

  // update UI to reflect the videos listed
  function refreshView() {
    var srcname = $('select#src').val();
    if(srcname && srcname in _srcs) {
      $('.filterinfo').text(_filtered.length + " of " + _srcs[srcname].length);
    }
    $('div.vid').appear();
    $('body').scroll();
  }

  function showMoreVideos() {
    var vids = getSomeVids();
    $('#content').append(vids);
    trigger("videoslisted", vids);
  }

  // -- dom events

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

  $(window).on('modloaded', function(evt, mod) {
    console.log(mod, "loaded");
    _modloadcount++;
  });

  $(window).on('videosready', function() {
    function init() {
      _smc.refresh();

      var srcname = $('select#src').val();
      if(srcname && location.hash) {
        $.each(_srcs[srcname], function(i,e) {
          if(location.hash.indexOf(e.imdb) > 0)
            showVideo($(getVideoElement(e)));
        });
      }
    }

    if(_modloadcount >= Object.keys(_mods).length) {
      init();
    } else {
      console.log("videos are ready but mods are still loading, waiting a sec");
      setTimeout(init, 300);
    }
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
    $('body').on('click', '.srcs *[data-href]', function() {
      var url = $(this).data('href');
      if(trigger("videosrcchange", url)) {
        var plr = $(this).closest('.plrcontainer');
        $('iframe', plr).remove();
        getVideoFrame(url).appendTo($('.player', plr));
      }
    });

    $('#title').on('input', $.debounce(500, function(e) {
      if(!trigger("search", $('#title').val().replace('"', '\"'))) return;
      _smc.refresh();
    }));

    $('#revsort, #sortby').change(function() {
      _smc.applySorter($('#sortby').val());
      $('.vid').detach();
      refreshView();
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

    $('body').on('click', '.plrcontainer button.close', closePlayer);

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
    getVideoFrame: getVideoFrame,
    getVideoInfoHtml: getVideoInfoHtml,
    loadScript: loadScript,
    showVideo: showVideo,
    sortVideoServices: sortVideoServices,
    refresh: refresh,
    refreshView: refreshView
  };

})();
