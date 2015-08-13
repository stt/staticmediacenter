(function() {
    $('head').append(
        '<meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<link rel="stylesheet" href="mobile.css">'
    );

    $(window).on('playeropen', function(evt, data) {
        $('.header').removeClass('open').addClass('closed');
    });

    $(window).resize(function () {
      if(window.innerWidth < 520) {
        $('body').addClass('mobile');
      } else if($('body').hasClass('mobile')) {
        $('body').removeClass('mobile');
      }
    });

    $(document).on('click', '.mobile #bglayer, .mobile .header', function(evt) {
        // only react if it wasn't a child that was clicked
        if(evt.target != this) return;
        $('.header').toggleClass('open').toggleClass('closed');
    });

    $(function() {
        $('.header').addClass('open');
        $(window).resize();
    });

    trigger("modloaded", "mobile.mod.js");
})();