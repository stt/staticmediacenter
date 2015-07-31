(function() {

    function sortVideoServices(s1, s2) {
        for(var pi in _smc.getConfig().srcPreferences) {
          var pref = _smc.getConfig().srcPreferences[pi];
          if(s1.indexOf(pref) > 0 && !isExpired(s1)) return -1;
          if(s2.indexOf(pref) > 0 && !isExpired(s2)) return 1;
        }
        if(s1 < s2) return -1;
        if(s1 > s2) return 1;
        return 0;
    }

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
        var srcs = ele.data('srcs');
        if(srcs.length == 1 && isExpired(srcs[0])) return false;
        return true;
    }

    _smc.addFilter(filterExpired);

    $(window).on('videosrcchange', function(evt, src) {
        // don't default to expired video
        if(isExpired(src)) evt.preventDefault();
        // for time being can't yet select a new default
    });

    _smc.getVideoInfoHtml = function getVideoInfoHtml(ele) {
        var srcs = ele.data('srcs').sort(sortVideoServices);
        var exp = $('<div>');

        var ret = '<span class="heading">video sources</span>';

        ret += $('<ul id="srcs">').append(
              srcs.map(function(e) {
                var domain = e.split(/\/+/)[1];
                if(isExpired(e)) {
                    exp.append('<div class="button disabled"><a data-old-href="'+ e +'">'+ domain +'</div>');
                } else {
                    return '<li class="button"><a data-href="'+ e +'">'+ domain +'</a>';
                }
              }).join('')
            )
            .prop('outerHTML');

        ret += '<span class="heading">expired sources</span>';
        ret += exp.html();
        return ret;
    };

})();