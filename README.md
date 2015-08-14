# Static media center

This is a lightweight media library that loads iframes from video streaming sites.
Only [one static html file](index.html) required. Customizable through external modules.

To get some actual content in the media center it depends on something to call `_smc.addSource('src')` and then `_smc.addVideo({'title':'..', 'img':'..'}, 'src')`.

Included are a couple example modules for content loading ([movs720p.mod.js](movs720p.mod.js), [movs1080p.mod.js](movs1080p.mod.js)), and the following modules to provide additional functionality:

(Note that the project is in development and the exposed _smc functions or dispatched events may still be changed without notice.)

mod            | description
---------------|------------
filter.mod.js  | Provides genre filters and sorting by rating and year. (Depends on content module adding appropriate jquery data properties.)
filterexpired.mod.js  | Adds a filter that parses googlevideo links to hide the expired ones.
gpad.mod.js    | Gamepad control for Chrome. Select with dpad, play with A, close player with B, triggers scroll the page. (Only tested with Xbox360 controller)
loadinfo       | When video is played uses imdb id to load info from imdbapi.com. (This is module was hardcoded to test/demonstrate that modules don't necessarily require separate files but can live in localstorage.)
imdbrss.mod.js | Filters movies by a list RSS feed created at IMDb http://www.imdb.com/help/show_leaf?listfaq
mgr.mod.js     | Lists loaded mods in the UI and provides controls for removing and adding new mods.
mobile.mod.js  | Improves mobile usability (changes header bar into a menu when window width < 520px)
multi.mod.js   | Support for opening multiple players in draggable layers (alt+h or alt+t to reorder the layers)
remember.mod.js | Stores and restores values from input elements that have class "remember".
seen.mod.js     | Provides filtering for seen movies. Adds checkboxes to each video element and stores which videos user has checked in localStorage.
vttlivecomms.mod.js | Asks [vttlive chrome extension](https://chrome.google.com/webstore/detail/vttlive/bnlbkeoehifnpknkegfjnhiaoechbnkj) for information on the video state at given intervals and remembers those for later use (like restoring unfinished video position). (TODO: once vttlive supports load time injection we can disable video autoplay and add a poster image.)

## Setup

After `git clone` run `grunt`. It combines css and js files from `src/` to `index.html`, copy that file along with chosen modules to a chosen host.

Notice that if you open the media library to browser directly from local disk some videostreaming services might not work as they e.g. might require a Referrer header that wouldn't be present, so prefer using over http.
