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
    /* link cards saved with any of the earlier paper-card colour sets go back to the original solid colours */
    var BLOCK=[['#102A4C','#F3ECD6'],['#BF430C','#FFF6EA'],['#2E6646','#F2F8EE'],['#7A1B2E','#FBE3E6'],['#4A5568','#F3ECD6']];
    var OLD={'#7CC4E6':0,'#2B4F80':0,'#2F62B0':0,'#FFA3C2':1,'#A63D40':1,'#CF4A45':1,'#F4E3A1':2,'#5E8F6B':2,'#58A06A':2,'#F9A56E':3,'#D9692B':3,'#F0702B':3,'#C6DDB4':4,'#DDB48A':4,'#E6B57C':4};
    s.pages.forEach(function(p){(p.blocks||[]).forEach(function(b){
      if(b.type==='tiles'&&!b.look)(b.items||[]).forEach(function(t){var n=OLD[String(t.bg||'').toUpperCase()];if(n!==undefined){t.bg=BLOCK[n][0];t.ink=BLOCK[n][1];delete t.bg2}});
    })});
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
