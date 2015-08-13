(function() {

  var applyingRemembered = false;

  $(window).on('optionschange', function() {
    // eventually this could be bound to .header mutation observer
    var remember = getLocalStorageItem('remember', {});
    applyingRemembered = true;

    $.each(remember, function(k,v) {
      var ele = $('#'+k);

      if(ele.is(':checkbox') && !ele.prop('checked')) {
        ele.prop('checked',true).change();
      } else if(ele.is('select') && v && ele.val() != v) {
        // for selects only set value if option exists, mod might not have added it yet
        if(ele.has('option[value='+v+']').length) ele.val(v).change();
      } else if(ele.val() != v) {
        ele.val(v).change();
      }
    });
    applyingRemembered = false;
  });

  $(function() {

      $('.header').on('change input', '.remember', function() {
        if(applyingRemembered) return;
        var remember = getLocalStorageItem('remember', {});
        if($(this).is(':checkbox')) {
          if($(this).is(':checked'))
            remember[this.id] = this.value;
          else
            delete remember[this.id];
        } else {
          remember[this.id] = this.value;
        }
        localStorage.setItem('remember', JSON.stringify(remember));
      });

  });

  trigger("modloaded", "remember.mod.js");
})();