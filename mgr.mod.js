var _disabledmods = []; //getLocalStorageItem('disabledmods', []);
var _mods = _smc.getMods();

// gets registered too late, we'd need to load mods synchronously for this to work
$(window).on('scriptload', function(ev, args) {
  console.log("ld", arguments);
  var pos = _disabledmods.indexOf(args[0]);
  if(pos >= 0) ev.preventDefault();
});

$('<style>').append(
  '.mods, #togmod, #delmod { display: none; }'+
  '.mods button { background-color: #bbb; }'
  ).appendTo('head');

$('.header').prepend(
  '<button class="right mods-btn">mods</button>'+
  '<div class="right mods">'+
    '<input type="text" id="mod" value="" list="mods" placeholder="Mods">'+
    '<datalist id="mods"></datalist>'+
    '<button id="addmod">Add</button><button id="delmod">Del</button>'+
    //<button id="togmod"></button>
  '</div>'
);

function saveAndRefreshMods() {
  localStorage.setItem("mods", JSON.stringify(_mods));
  populateModlist();
  $('#mod').val('');
  updateModButtons();
}

function populateModlist() {
  $('#mods option').remove();
  $.each(_mods, function(k,v) {
    $('#mods').append($('<option />').val(k).text(k));
  });
}

populateModlist();

function updateModButtons() {
  var modname = $('#mod').val().trim();
  if(modname in _mods) {
    $('#addmod').hide();
    $('#togmod, #delmod').show();
    /*
    var disabled = (_disabledmods.indexOf(modname) >= 0);
    $('#togmod').text(disabled ? 'Enable' : 'Disable');
    */
  } else {
    $('#addmod').show();
    $('#togmod, #delmod').hide();
  }
}
$('#mod').on('input', updateModButtons);

$('.mods-btn').on('click', function() {
  $('.mods, .mods-btn').toggle();
});
/*
$('#togmod').on('click', function() {
  var disable = $(this).text() == 'Disable';
  if(disable) {
    _disabledmods.push($('#mod').val());
  } else {
    var pos = _disabledmods.indexOf($('#mod').val());
    if(pos < 0) return;
    _disabledmods.splice(pos, 1);
  }
  localStorage.setItem('disabledmods', JSON.stringify(_disabledmods));
  updateModButtons();
});
*/

$('#addmod').on('click', function() {
  if(!trigger("modadd", this)) return;
  var name = $('#mod').val().trim();
  if(name) {
    var url = prompt("Mod url:");
    if(url != null) {
      _smc.checkUrl(url, function(err, xhr) {
        if(err) return alert(err);
        _mods[name] = url;
        _smc.loadScript(name, url);
        saveAndRefreshMods();
      });
    }
  }
});

$('#delmod').on('click', function() {
  if(!trigger("moddel", this)) return;
  var modname = $('#mod').val().trim();
  if(confirm("Forget "+modname+"?")) {
    delete _mods[modname];
    saveAndRefreshMods();
  }
});

trigger("modloaded", "mgr.mod.js");