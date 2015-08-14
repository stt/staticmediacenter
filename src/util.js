
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

function getHash() {
  var obj = {};
  // not the best separators, historical reasons
  location.hash.replace(/^#/, '')
  .replace(/([^=,]+)=([^,]*)/g, function (str, key, value) {
    obj[key] = value;
  });
  return obj;
}
function setHash(obj) {
  var str = '';
  $.each(obj, function(k,v) {
    if(str) str += ',';
    str += k+ '=' +v;
  });
  location.hash = str;
}

function trigger(evtname, state, callerguid) {
  var evt = $.Event(evtname);
  evt.callerguid = callerguid;
  $(window).trigger(evt, state);
  return !evt.isDefaultPrevented();
}

function sortByTitle(e1,e2) {
  if(e1.title < e2.title) return -1;
  if(e1.title > e2.title) return 1;
  return 0;
}
