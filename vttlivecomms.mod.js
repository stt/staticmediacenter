(function() {

var timerId = null;

$(window).on('playerclose', function(vids) {
    if(timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
});

// -- events dispatched by vttlive extension content scripts

$(window).on('videofound', function(evt) {
    var hash = getHash();
    var pos = getLocalStorageItem("position", {});
    if('vid' in hash && hash['vid'] in pos) {
        // user might have already skipped to some position before we get here?
        window.postMessage({
            action: 'setvideo',
            reqId: Math.random()*10000|0,
            video: { autoplay: false, currentTime: pos[hash['vid']] }
        }, "*");
    }

    // ask for video position once a minute
    timerId = setTimeout(function() {
        window.postMessage({
            action: 'getvideo',
            reqId: Math.random()*10000|0,
        }, "*");
    }, 60000);
});

$(window).on('getvideoreply', function(evt) {
    var pos = getLocalStorageItem("position", []);
    var hash = getHash();
    if('vid' in hash) {
        pos[hash['vid']] = evt.originalEvent.detail.currentTime;
        localStorage.setItem('position', JSON.stringify(pos));
    }
});

})();
