(function() {
    var reloffset;

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    function getEventPos(ev) {
        var x = 0, y = 0;
        if("targetTouches" in ev) {
            var touch = ev.targetTouches[0];
          x = touch.pageX;
          y = touch.pageY;
        } else {
          x = $('body').scrollLeft() + ev.pageX;
          y = $('body').scrollTop() + ev.pageY;
          // odd ghost event
          if(!ev.screenX && !ev.screenY) return false;
        }
        return {x:x, y:y};
    }

    function dragstart(ev) {
        // firefox requires setData
        ev.originalEvent.dataTransfer.setData('imdbId', $(this).data('imdb-id'));
        ev.originalEvent.dataTransfer.effectAllowed = 'move';

        var maxZIndex = Math.max.apply(null, 
            $('.plrcontainer').map(function(i,e) {
                return $(e).css('z-index');
            })
        );
        $(this).css('z-index', maxZIndex+1);

        $('body').addClass('dragging');
        if("targetTouches" in ev.originalEvent) {
        } else if(!is_firefox) {
            var img = document.createElement("img");
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
            ev.originalEvent.dataTransfer.setDragImage(img, 0, 0);
        }
        reloffset = getEventPos(ev.originalEvent);
        var off = $(ev.target).offset();
        reloffset.x -= off.left;
        reloffset.y -= off.top;
    }


    $('<style>').append(
      'body.dragging iframe { pointer-events: none; }'+
      '.corner {'+
      '  border-radius: 50%; background-color: #f99;'+
      '  position: absolute; width: 20px; height: 20px; '+
      '}'+
      '.corner.left { left: -5px; }'+
      '.corner.top { top: -5px; }'+
      '.corner.right { right: -5px; }'+
      '.corner.bottom { bottom: -5px; }'+
      'button.info-btn { top: 30px; }'
      ).appendTo('head');


    $('body').on('click', '.plrcontainer button.info-btn', function() {
      $(this).siblings('.info').toggle();
    });


    $(window).on('keydown', $.debounce(250, function(e) {
      if(e.which == 84 && e.altKey) { // alt+t
        $('.plrcontainer').each(function(i,e) {
            $(this).animate({ left: 20*i, top: 40*i });
        });
      } else if(e.which == 72 && e.altKey) { // alt+h
        var pos = [['1%','5%'], ['51%','5%'], ['1%','55%'], ['51%','55%']];
        $('.plrcontainer:visible').each(function(i,e) {
            if(i >= 4) return;
            $(e).animate({left: pos[i][0], top: pos[i][1]});
        });
      }
    }));

    $(window).on('playeropen', function(ev, ele) {
        ev.preventDefault();

        var imdbid = $(ele).data('imdb-id');
        var hash = getHash();
        if(!hash.vids || hash.vids.indexOf(imdbid) < 0) {
            var vids = ('vids' in hash ? hash.vids.split('|') : []);
            vids.push(imdbid);
            hash.vids = vids.join('|');
            setHash(hash);
        }

        var plrcount = $('.plrcontainer').length;
        var pos;

        if(is_firefox) {
            $('body')
            .on('dragover', function(ev) { return false; })
            .on('drop', function(ev) {
                var imdbId = ev.originalEvent.dataTransfer.getData('imdbId');
                var plr = $('.plrcontainer[data-imdb-id="'+ imdbId +'"]');
                move.call(plr, ev);
            });
        }

        function move(ev) {
                ev.preventDefault();
                pos = getEventPos(ev.originalEvent);
                if(pos) {
                    var left = pos.x - reloffset.x;
                    var top = pos.y - reloffset.y;
                    $(this).offset({left: left, top: top});
                }
        }

        var container = $(
            '<div draggable="true" ondragover="event.preventDefault();">'+
            '  <div class="corner left top"></div>'+
            '  <div class="corner right top"></div>'+
            '  <button class="close">x</button><button class="info-btn">o</button>'+
            '  <div class="player"></div><div class="info"></div>'+
            '  <div class="corner left bottom"></div>'+
            '  <div class="corner right bottom"></div>'+
            '</div>')
            .addClass('plrcontainer')
            .attr('data-imdb-id', imdbid)
            .css({position: 'fixed', padding: '5px', left: 20*plrcount, top: 40*plrcount})
            .on('dragstart', dragstart)
            .on('drag touchmove', move)
            .on('dragend', function(ev) {
                $('body').removeClass('dragging');
            })
            .appendTo('body');

        $('.info', container).html(_smc.getVideoInfoHtml(ele));

        document.title = $('.title', ele).text();

        var srcs = $(ele).data('srcs').sort(_smc.sortVideoServices);
        _smc.getVideoFrame(srcs[0]).appendTo($('.player', container));

        trigger("playeropened", container);
    });

    $(window).on('playerclose', function(ev, that) {
        ev.preventDefault();

        var plr = $(that).closest('.plrcontainer');
        var hash = getHash();
        if('vids' in hash) {
            var vids = hash.vids.split('|');
            var idx = vids.indexOf(plr.data('imdb-id'));
            vids.splice(idx, 1);
            hash.vids = vids.join('|');
            setHash(hash);
        }

        plr.remove();
    });

    trigger("modloaded", "multi.mod.js");
})();
