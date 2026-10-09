/* Where edited content lives. Today: this browser's storage. Swap these two functions for a server later. */
window.Store=(function(){
  var KEY='baldwin-site-v1';
  function clone(o){return JSON.parse(JSON.stringify(o))}
  var FILES={home:'index.html',calendar:'calendar.html',friends:'friends.html',board:'board.html','kansas-room':'kansas-room.html','harmony-garden':'harmony-garden.html'};
  /* a copy saved before a page was built still gets that page, and menu links that pointed at the old site now point here */
  function upgrade(s){
    window.DEFAULT_SITE.pages.forEach(function(p){
      if(!s.pages.some(function(x){return x.slug===p.slug})){
        s.pages.push(clone(p));
        (s.nav||[]).forEach(function(n){if(new RegExp('mykansaslibrary\\.org/'+p.slug+'/?$').test(n.url))n.url=FILES[p.slug]||n.url});
      }
    });
    return s;
  }
  return {
    load:function(){
      try{var raw=localStorage.getItem(KEY);if(raw){var s=JSON.parse(raw);if(s&&s.pages)return upgrade(s)}}catch(e){}
      return clone(window.DEFAULT_SITE);
    },
    save:function(site){try{localStorage.setItem(KEY,JSON.stringify(site));return true}catch(e){return false}},
    reset:function(){try{localStorage.removeItem(KEY)}catch(e){}return clone(window.DEFAULT_SITE)},
    edited:function(){try{return !!localStorage.getItem(KEY)}catch(e){return false}},
    builtIn:function(slug){return !!FILES[slug]},
    pageUrl:function(slug){return FILES[slug]||'page.html?p='+encodeURIComponent(slug)}
  };
})();
