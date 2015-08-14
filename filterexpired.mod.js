(function() {

    _smc.sortVideoServices = function(s1, s2) {
        for(var pi in _smc.getConfig().srcPreferences) {
          var pref = _smc.getConfig().srcPreferences[pi];
          if(s1.indexOf(pref) > 0 && !isExpired(s1)) return -1;
          if(s2.indexOf(pref) > 0 && !isExpired(s2)) return 1;
        }
        if(s1 < s2) return -1;
        if(s1 > s2) return 1;
        return 0;
    };

    function getGoogleVideoExpires(src) {
        var m = src.match(/expire=([0-9]*)/);
        if(!m || m.length != 2) return null;
        return new Date(m[1]*1000);
    }

    function isExpired(src) {
        var expdate = getGoogleVideoExpires(src);
        return (expdate && expdate < new Date());
    }

    function filterExpired(ele) {
        var srcs = ele.srcs;
        if(srcs.length == 1 && isExpired(srcs[0])) return false;
        return true;
    }

    _smc.addFilter(filterExpired);

    $(window).on('videosrcchange', function(evt, src) {
        // don't default to expired video
        if(isExpired(src)) evt.preventDefault();
    });

    $(window).on('playeropened', function(evt, plr) {
        var hasExpire = false;
        $('.srcs li', plr).each(function(i,e) {
            if(isExpired($(e).data('href'))) {
                $('.srcs', plr).after($(e).detach());
                hasExpire = true;
            }
        });
        if(hasExpire) {
            $('.srcs', plr).after($('<span class="heading">expired sources</span>'));
        }
    });

    trigger("modloaded", "filterexpired.mod.js");
})();