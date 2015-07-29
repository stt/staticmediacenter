# Static media center

This is a lightweight media library that loads iframes from video streaming sites.
Only [one static html file](index.html) required. Customizable through external modules.

To get some actual content in the media center it depends on something to call `_smc.addSource('src')` and then `_smc.addVideo({'title':'..', 'img':'..'}, 'src')`.

Included are a couple example modules for content loading ([720p.mod.js](720p.mod.js), [1080p.mod.js](1080p.mod.js)), and the following modules to provide additional functionality:

mod            | description
---------------|------------
filter.mod.js  | Provides genre filters and sorting by rating and year. (Depends on content module adding appropriate jquery data properties.)
gpad.mod.js    | Gamepad control for Chrome. Select with dpad, play with A, close player with B, triggers scroll the page. (Only tested with Xbox360 controller)
loadinfo       | When video is played uses imdb id to load info from imdbapi.com. (This is module was hardcoded to test/demonstrate that modules don't necessarily require separate files but can live in localstorage.)
imdbrss.mod.js | Filters movies by a list RSS feed created at IMDb http://www.imdb.com/help/show_leaf?listfaq
mgr.mod.js     | Lists loaded mods in the UI and provides controls for removing and adding new mods.
remember.mod.js | Stores and restores values from input elements that have class "remember".
seen.mod.js     | Provides filtering for seen movies. Adds checkboxes to each video element and stores which videos user has checked in localStorage.

