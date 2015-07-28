var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

function connecthandler(e) {
  addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;
  requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  delete controllers[gamepad.index];
}

function filterByTop(top) {
  return function(i) { return $(this).offset().top == top; };
}

var repeatSpeed = 100;
$(window).on('gamepadbutton', $.throttle(repeatSpeed, true, function(evt, st) {
  if(!$('.vid.selected').length) {
    $('.vid:eq(0)').addClass('selected');
    return;
  }
  var nowSelected = $('.vid.selected');
  var pos = nowSelected.index();
  if(st.which == 12) { // dpad up
    var rowSz = $('.vid').filter(filterByTop(nowSelected.offset().top)).length;
    var newpos = pos - rowSz;
    if(!$('.vid').eq(newpos).length) return;
    nowSelected.removeClass('selected');
    nowSelected = $('.vid').eq(newpos);

  } else if(st.which == 13) { // dn
    var rowSz = $('.vid').filter(filterByTop(nowSelected.offset().top)).length;
    var newpos = pos + rowSz;
    if(newpos > $('.vid').length) newpos -= $('.vid').length;
    if(!$('.vid').eq(newpos).length) return;
    nowSelected.removeClass('selected');
    nowSelected = $('.vid').eq(newpos);

  } else if(st.which == 14) { // lt
    if(!nowSelected.prev().length) return;
    nowSelected = nowSelected.removeClass('selected').prev();
      
  } else if(st.which == 15) { // rg
    if(!nowSelected.next().length) return;
    nowSelected = nowSelected.removeClass('selected').next();

  } else if(st.which == 6) { // trg lft
    var val = Math.max(0, $('body').scrollTop() - st.value*3);
    $('body').stop().animate({ scrollTop: val }, repeatSpeed, 'linear');
    nowSelected = []; // skip scrollIntoView

  } else if(st.which == 7) { // trg rgt
    var scrollh = $(document).height() - $(window).height();
    var val = Math.min(scrollh, Math.round($('body').scrollTop() + st.value*3));
    $('body').stop().animate({ scrollTop: val }, repeatSpeed, 'linear');
    nowSelected = []; // skip scrollIntoView

  } else if(st.which == 0) { // a
    if(!$('#player').is(':visible')) _smc.showVideo(nowSelected);
  } else if(st.which == 1) { // b
    if($('#player').is(':visible')) _smc.closePlayer();
  }

  if(nowSelected.length) {
    nowSelected.addClass('selected');
    nowSelected[0].scrollIntoView();
  }
}));

function updateStatus() {
  if (!haveEvents) {
    scangamepads();
  }

  var i = 0;

  for (var j in controllers) {
    var controller = controllers[j];

    for (i = 0; i < controller.buttons.length; i++) {
      //var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        val = val.value;
      }
      if(pressed) {
        trigger("gamepadbutton", {which: i, value: val*100});
      }

      var pct = Math.round(val * 100) + "%";
      //console.log("btn",pct,i,controller.buttons[i]);

      //b.style.backgroundSize = pct + " " + pct;
    }

    for (i = 0; i < controller.axes.length; i++) {
      //if(Math.abs(controller.axes[i]) > 0.2) console.log(controller.axes[i]);
    }
  }

  requestAnimationFrame(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].index in controllers) {
        controllers[gamepads[i].index] = gamepads[i];
      } else {
        addgamepad(gamepads[i]);
      }
    }
  }
}


window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
  setInterval(scangamepads, 500);
}
