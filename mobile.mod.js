(function() {
    $('head').append(
        '<meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<link rel="stylesheet" href="mobile.css">'
    );

    $(window).resize(function () {
      if(window.innerWidth < 520) {
        $('body').addClass('mobile');
      } else if($('body').hasClass('mobile')) {
        $('body').removeClass('mobile');
      }
    });

    $(document).on('click', '.mobile #bglayer, .mobile .header', function() {
        $('.header').toggleClass('open').toggleClass('closed');
    });

    $(function() {
        $('.mobile .header > *, .mobile #bglayer').click(function(evt) {
            // don't close when clicking on inputs, or open video when bglayer clicked
            evt.stopPropagation();
        });
        $('.header').addClass('open');
        $(window).resize();
    });
})();