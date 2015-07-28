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

function trigger(evtname, state) {
  var evt = $.Event(evtname);
  $(window).trigger(evt, state);
  return !evt.isDefaultPrevented();
}

var _config = getLocalStorageItem('config', {
  moviesJsonUrl: prompt("Movie src:", "https://cdn.rawgit.com/anonymous/"),
  coverUrlTpl: 'http://tunemovietube.com/wp-content/plugins/imdb-info-box/cache/%s.jpg',
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

// declare custom functionality here (key: scriptname, value: url)
var _mods = getLocalStorageItem('mods', {
  "loadinfo": exampleMod
});

$.each(_mods, loadScript);


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

function loadVideos() {
  if(!trigger("videosload", this)) return;
  $.getJSON(_config.moviesJsonUrl, function(data) {
    for(var id in data) {
      $('<div class="vid">')
        .attr('data-img', _config.coverUrlTpl.replace(/%s/, id))
        .data('imdb-id', id)
        .data('srcs', data[id].srcs)
        .append('<span class="title" title="'+data[id].name+'">'+data[id].name+'</span>')
        .appendTo('#content');
    }
    $('div.vid').appear();
    $('body').scroll();
  });
}

$(function() {
  loadVideos();

  $('.info').on('click', '#srcs a', function() {
    if(!trigger("videosrcchange", this)) return;
    var frm = _config.frameTpl.replace(/%s/, $(this).data('href'));
    $('#player iframe').replaceWith(frm);
  });
  
  $('#title').on('keyup', $.debounce(250, function() {
    if(!trigger("search", this)) return;
    if(!$(this).val()) return $('.vid').show();
    var val = $(this).val().replace('"', '\"');
    $('.vid').hide().has('.title:containsi("'+val+'")').show();
    $('body').scroll();
  }));

  $('#close').on('click', function() {
    if(!trigger("playerclose", this)) return;
    $('#bglayer,#plrcontainer').hide();
    $('#player iframe').remove();
  });

  $('body').on('click', 'div.vid', function() {
    if(!trigger("playeropen", this)) return;

    var imdbid = $(this).data('imdb-id');
    location.hash = 'vid-' + imdbid;
    var srcs = $(this).data('srcs').sort(sortVideoServices);

    $('.info').html('<span class="heading">video sources</span><ul id="srcs">'+
      srcs.map(function(e) {
        return '<li class="button"><a data-href="'+ e +'">'+ e.split(/\/+/)[1] +'</a>';
      }).join('')+
      '</ul>'
    );

    document.title = $('.title', this).text();
    $('#player').html(_config.frameTpl.replace(/%s/, srcs[0]));
    $('#bglayer,#plrcontainer').show();
  });

  $('body').on('appear', 'div.vid', function(e, $affected) {
    if(!trigger("coverload", this)) return;
    $.each($affected, function(i,e) {
      if($(e).data('img')) {
        $(e).prepend('<img src="'+$(e).data('img')+'"/>');
        //console.log("loaded", $(e).data('img'));
        $(e).data('img', '');
      }
    });
  });

  $('#bglayer,#plrcontainer').hide();
});
