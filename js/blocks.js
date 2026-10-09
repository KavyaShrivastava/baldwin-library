/* Every component a page can be built from: its editable fields, its starting content, and how it draws. */
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function paras(s){return esc(s).split(/\n\s*\n/).filter(Boolean).map(function(p){return '<p>'+p.replace(/\n/g,'<br>')+'</p>'}).join('')}
  /* text with light structure: blank line = new paragraph; a run of lines starting with "- " = a list; a short line directly above text or a list = a small heading */
  function rich(src){
    return String(src==null?'':src).split(/\n\s*\n/).map(function(chunk){
      var lines=chunk.split('\n').map(function(l){return l.trim()}).filter(Boolean),out='';
      if(!lines.length)return '';
      if(lines.length>1&&lines[0].length<40&&!/^- /.test(lines[0])&&!/[.!?]$/.test(lines[0])){out+='<h3 class="mini">'+esc(lines.shift())+'</h3>'}
      if(lines.every(function(l){return /^- /.test(l)}))return out+'<ul>'+lines.map(function(l){return '<li>'+esc(l.slice(2))+'</li>'}).join('')+'</ul>';
      return out+'<p>'+lines.map(esc).join('<br>')+'</p>';
    }).join('');
  }
  function linkify(s){return esc(s).replace(/([\w.+-]+@[\w-]+(\.[\w-]+)+)/g,'<a href="mailto:$1">$1</a>')}
  function id(b){return b.anchor?' id="'+esc(b.anchor)+'"':''}
  function head(b){return (b.kicker?'<p class="kicker">'+esc(b.kicker)+'</p>':'')+(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')}
  function col(bg,ink){return (bg?'--tb:'+esc(bg)+';':'')+(ink?'--ti:'+esc(ink)+';':'')}
  /* rows of up to `max`, balanced so nothing is left alone (5 with max 4 = 2 + 3); returns how many of 12 columns item i takes */
  function rowSpan(i,n,max){
    var rows=Math.ceil(n/max),base=Math.floor(n/rows),small=rows-(n%rows),row=0,left=i;
    while(left>=(row<small?base:base+1)){left-=(row<small?base:base+1);row++}
    return 12/(row<small?base:base+1);
  }
  var COLOR=function(key,label){return {key:key,label:label,type:'color'}};
  var ANCHOR={key:'anchor',label:'Link name (for #links to this section)',type:'text'};


  /* one flat maple leaf, reused wherever the site needs its mark */
  var LEAF='<svg class="leaf" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l8 18 14-8-4 26 16-10-2 14 14 6-18 12 4 12-22-4-4 8h-3v18h-6V78h-3l-4-8-22 4 4-12L4 50l14-6-2-14 16 10-4-26 14 8z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
  window.LEAF=LEAF;

  /* the same leaf as stained glass: flat facets with lead lines */
  var glassN=0;
  function glassLeaf(){var id='lf'+(++glassN);return '<svg class="leaf glass" viewBox="0 0 100 100" aria-hidden="true"><clipPath id="'+id+'"><path d="M50 4l8 18 14-8-4 26 16-10-2 14 14 6-18 12 4 12-22-4-4 8h-3v18h-6V78h-3l-4-8-22 4 4-12L4 50l14-6-2-14 16 10-4-26 14 8z"/></clipPath><g clip-path="url(#'+id+')"><polygon class="f1" points="50,78 0,80 0,45"/><polygon class="f3" points="50,78 0,45 0,10"/><polygon class="f2" points="50,78 0,10 28,0"/><polygon class="f4" points="50,78 28,0 50,0"/><polygon class="f2" points="50,78 50,0 72,0"/><polygon class="f3" points="50,78 72,0 100,10"/><polygon class="f1" points="50,78 100,10 100,45"/><polygon class="f4" points="50,78 100,45 100,80"/><polygon class="f4" points="50,78 24.0,79.0 24.0,60.8"/><polygon class="f2" points="50,78 24.0,60.8 24.0,42.6"/><polygon class="f5" points="50,78 24.0,42.6 38.6,37.4"/><polygon class="f1" points="50,78 38.6,37.4 50.0,37.4"/><polygon class="f3" points="50,78 50.0,37.4 61.4,37.4"/><polygon class="f5" points="50,78 61.4,37.4 76.0,42.6"/><polygon class="f2" points="50,78 76.0,42.6 76.0,60.8"/><polygon class="f1" points="50,78 76.0,60.8 76.0,79.0"/><rect class="f3" x="0" y="80" width="100" height="20"/><g class="lead"><line x1="50" y1="78" x2="0" y2="80"/><line x1="50" y1="78" x2="0" y2="45"/><line x1="50" y1="78" x2="0" y2="10"/><line x1="50" y1="78" x2="28" y2="0"/><line x1="50" y1="78" x2="50" y2="0"/><line x1="50" y1="78" x2="72" y2="0"/><line x1="50" y1="78" x2="100" y2="10"/><line x1="50" y1="78" x2="100" y2="45"/><line x1="50" y1="78" x2="100" y2="80"/><polyline points="24.0,79.0 24.0,60.8 24.0,42.6 38.6,37.4 50.0,37.4 61.4,37.4 76.0,42.6 76.0,60.8 76.0,79.0"/></g></g><path class="rim" d="M50 4l8 18 14-8-4 26 16-10-2 14 14 6-18 12 4 12-22-4-4 8h-3v18h-6V78h-3l-4-8-22 4 4-12L4 50l14-6-2-14 16 10-4-26 14 8z"/></svg>'}
  window.glassLeaf=glassLeaf;

  /* small flat pictures a notice card can carry */
  var ART={
    van:{label:'Food van',bg:'#102A4C',svg:'<g class="van"><rect x="14" y="42" width="70" height="42" rx="6" fill="#E8591F"/><path d="M84 54h13l11 15v15H84z" fill="#F58A55"/><path d="M88 59h7l8 11H88z" fill="#F7EEDF"/><circle cx="49" cy="64" r="10" fill="#F7EEDF"/><path d="M50 53c1-6 6-8 11-7-1 5-5 8-11 7z" fill="#5E8F6B"/><circle cx="36" cy="86" r="9" fill="#16151A"/><circle cx="36" cy="86" r="3.5" fill="#F7EEDF"/><circle cx="92" cy="86" r="9" fill="#16151A"/><circle cx="92" cy="86" r="3.5" fill="#F7EEDF"/></g><rect x="8" y="96" width="104" height="3" rx="1.5" fill="#F7EEDF" opacity=".45"/>'},
    star:{label:'Star',bg:'#102A4C',svg:'<polygon points="60.0,24.0 68.8,47.9 94.2,48.9 74.3,64.6 81.2,89.1 60.0,75.0 38.8,89.1 45.7,64.6 25.8,48.9 51.2,47.9" fill="#F7EEDF"/><circle cx="60" cy="60" r="6" fill="#E8591F"/>'},
    signpost:{label:'Signpost',bg:'#BF430C',svg:'<rect x="57" y="24" width="6" height="76" rx="2" fill="#F7EEDF"/><path d="M34 30h44l11 10-11 10H34z" fill="#F7EEDF"/><path d="M86 56H44L33 66l11 10h42z" fill="#F6C9AE"/><rect x="40" y="98" width="40" height="4" rx="2" fill="#F7EEDF" opacity=".5"/>'},
    nofine:{label:'No fines',bg:'#2E6646',svg:'<circle cx="60" cy="60" r="30" fill="#F7EEDF"/><circle cx="60" cy="60" r="23" fill="none" stroke="#2E6646" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/><path d="M60 43v34M68 51c-2-3-5-4-8-4-5 0-8 3-8 6 0 8 16 5 16 13 0 4-4 7-9 7-4 0-7-2-9-5" fill="none" stroke="#2E6646" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect class="strike" x="18" y="55" width="84" height="10" rx="5" fill="#16151A" transform="rotate(-38 60 60)"/>'}
  };
  function artHtml(k){var a=ART[k];return a?'<span class="art art-'+k+'" style="background:'+a.bg+'" aria-hidden="true"><svg viewBox="0 0 120 120">'+a.svg+'</svg></span>':''}

  /* ---- calendar helpers ---- */
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function p2(n){return (n<10?'0':'')+n}
  function iso(y,m,d){return y+'-'+p2(m+1)+'-'+p2(d)}
  function t12(t){var a=t.split(':'),h=+a[0],m=a[1]||'00';return {h:(h%12)||12,m:m,ap:h<12?'a.m.':'p.m.'}}
  function one(x,ap){return x.h+(x.m!=='00'?':'+x.m:'')+(ap?' '+x.ap:'')}
  function fmtTime(s,e){
    if(!s)return '';
    var a=t12(s);if(!e)return one(a,true);
    var b=t12(e);return one(a,a.ap!==b.ap)+'\u2013'+one(b,true);
  }
  window.fmtTime=fmtTime;

  function mountCalendar(root,b,site){
    var cats={};(site.cats||[]).forEach(function(c){cats[c.id]=c});
    var evs=(site.events||[]).slice().sort(function(x,y){return (x.date+(x.start||'00:00')).localeCompare(y.date+(y.start||'00:00'))});
    var byDay={};evs.forEach(function(e){(byDay[e.date]=byDay[e.date]||[]).push(e)});
    var now=new Date(),today=iso(now.getFullYear(),now.getMonth(),now.getDate());
    var y=now.getFullYear(),m=now.getMonth();
    var hasThisMonth=evs.some(function(e){return e.date.slice(0,7)===today.slice(0,7)});
    if(!hasThisMonth&&evs.length){var f=evs.filter(function(e){return e.date>=today})[0]||evs[0];y=+f.date.slice(0,4);m=+f.date.slice(5,7)-1}
    var off={},sel=null,view='list';
    try{if(localStorage.getItem('cal-view')==='month')view='month'}catch(e){}
    function shown(e){return !off[e.cat]}
    function style(e){var c=cats[e.cat]||{bg:'#8E8A80',ink:'#141414'};return 'style="--c:'+esc(c.bg)+';--k:'+esc(c.ink)+'"'}

    function row(e){
      var c=cats[e.cat];
      return '<li '+style(e)+'><span class="time">'+(esc(fmtTime(e.start,e.end))||'All day')+'</span><span class="what"><strong>'+esc(e.title)+'</strong>'+(e.note?'<span class="sub">'+esc(e.note)+'</span>':'')+'</span>'+(c?'<span class="tag">'+esc(c.label)+'</span>':'')+'</li>';
    }
    function draw(){
      var first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),prefix=y+'-'+p2(m+1);
      if(!sel||sel.slice(0,7)!==prefix){
        sel=today.slice(0,7)===prefix?today:null;
        if(!sel){for(var d0=1;d0<=days;d0++){if(byDay[iso(y,m,d0)]){sel=iso(y,m,d0);break}}}
        if(!sel)sel=iso(y,m,1);
      }
      var h='<div class="cal-top"><h2 class="cal-month">'+MONTHS[m]+' <span>'+y+'</span></h2>'+
        '<div class="cal-tools"><div class="cal-view" role="group" aria-label="Calendar view"><button type="button" data-view="list" aria-pressed="'+(view==='list')+'">List</button><button type="button" data-view="month" aria-pressed="'+(view==='month')+'">Full month</button></div>'+
        '<div class="cal-nav"><button type="button" data-go="-1" aria-label="Previous month">&larr;</button><button type="button" data-go="0">Today</button><button type="button" data-go="1" aria-label="Next month">&rarr;</button></div></div></div>';
      h+='<div class="cal-filters" role="group" aria-label="Show or hide kinds of programs">';
      (site.cats||[]).forEach(function(c){h+='<label class="filt" style="--c:'+esc(c.bg)+'"><input type="checkbox" data-cat="'+esc(c.id)+'"'+(off[c.id]?'':' checked')+'>'+esc(c.label)+'</label>'});
      h+='</div><div class="cal-scroll" role="region" aria-label="Full month calendar" tabindex="0"><div class="cal-grid">';
      DOW.forEach(function(d,i){h+='<div class="dow'+(i===0||i===6?' we':'')+'">'+d+'</div>'});
      for(var i=0;i<first;i++)h+='<div class="day blank"></div>';
      var n=0;
      for(var d=1;d<=days;d++){
        var key=iso(y,m,d),list=(byDay[key]||[]).filter(shown),dow=(first+d-1)%7;
        var closed=list.some(function(e){return e.cat==='closed'});
        h+='<button type="button" class="day'+(key===today?' today':'')+(key===sel?' sel':'')+(closed?' closed':'')+(dow===0||dow===6?' we':'')+'" data-d="'+key+'" aria-pressed="'+(key===sel)+'" aria-label="'+DOWL[dow]+', '+MONTHS[m]+' '+d+(list.length?': '+esc(list.map(function(e){return (e.start?fmtTime(e.start)+' ':'')+e.title}).join(', ')):', nothing scheduled')+'">'+
          '<span class="num">'+d+'</span><span class="chips">';
        list.forEach(function(e){h+='<span class="chip" '+style(e)+'>'+(e.start?'<b>'+esc(fmtTime(e.start))+'</b>':'')+esc(e.title)+'</span>'});
        h+='</span></button>';
      }
      h+='</div></div>';
      /* day-by-day list, used instead of the grid on narrower screens */
      h+='<div class="cal-agenda">';
      var past='',rest='',pastN=0;
      for(var d2=1;d2<=days;d2++){
        var k2=iso(y,m,d2),l2=(byDay[k2]||[]).filter(shown);if(!l2.length)continue;
        var w2=(first+d2-1)%7;
        var sec='<section class="ag-day'+(k2===today?' today':'')+'"><h3><span class="big">'+d2+'</span> <span>'+DOWL[w2]+(k2===today?' <em>Today</em>':'')+'</span></h3><ul class="cal-list">'+l2.map(row).join('')+'</ul></section>';
        if(k2<today){past+=sec;pastN++}else rest+=sec;
      }
      if(past&&rest)h+='<details class="ag-past"><summary>Earlier this month ('+pastN+' days)</summary><div class="cal-agenda-in">'+past+'</div></details>'+rest;
      else h+=past+rest;
      if(!past&&!rest)h+='<p class="empty-month">Nothing is posted for '+MONTHS[m]+' yet.</p>';
      h+='</div>';
      var sd=new Date(+sel.slice(0,4),+sel.slice(5,7)-1,+sel.slice(8,10)),sl=(byDay[sel]||[]).filter(shown);
      h+='<div class="cal-day" aria-live="polite"><div class="cal-date"><span class="big">'+sd.getDate()+'</span><span>'+DOWL[sd.getDay()]+'<br>'+MONTHS[sd.getMonth()]+'</span></div><ul class="cal-list">';
      if(!sl.length)h+='<li class="empty">Nothing on the calendar for this day.</li>';
      h+=sl.map(row).join('');
      h+='</ul></div>';
      var body=root.querySelector('.cal-body');body.className='cal-body view-'+view;body.innerHTML=h;
    }
    root.addEventListener('click',function(ev){
      var t=ev.target.closest('button');if(!t||!root.contains(t))return;
      var key=null,ds=t.dataset;
      if(ds.go!==undefined){
        key='[data-go="'+ds.go+'"]';
        var g=+ds.go;
        if(g===0){y=now.getFullYear();m=now.getMonth();sel=today}else{m+=g;if(m<0){m=11;y--}if(m>11){m=0;y++}sel=null}
      }else if(ds.view){key='[data-view="'+ds.view+'"]';view=ds.view;try{localStorage.setItem('cal-view',view)}catch(e){}}
      else if(ds.cat){key='[data-cat="'+ds.cat+'"]';off[ds.cat]=!off[ds.cat]}
      else if(ds.d){key='[data-d="'+ds.d+'"]';sel=ds.d}
      else return;
      draw();
      var again=root.querySelector(key);if(again)again.focus({preventScroll:true});
      if(ds.d&&window.matchMedia('(max-width:760px)').matches)root.querySelector('.cal-day').scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    root.addEventListener('change',function(ev){
      var t=ev.target;if(!t.matches||!t.matches('input[data-cat]'))return;
      off[t.dataset.cat]=!t.checked;draw();
      var again=root.querySelector('input[data-cat="'+t.dataset.cat+'"]');if(again)again.focus();
    });
    draw();
  }

  window.BLOCKS={
    shelf:{label:'Book shelf hero',
      fields:[{key:'title',label:'Title',type:'text'},{key:'eyebrow',label:'Small line above the title (optional)',type:'text'},
        {key:'lede',label:'Intro text',type:'textarea'},{key:'linkLabel',label:'Link text',type:'text'},{key:'linkUrl',label:'Link address',type:'text'},
        {key:'books',label:'Books on the shelf',type:'list',itemLabel:'t',noun:'book',fields:[
          {key:'t',label:'Title',type:'text'},{key:'first',label:'Author first name',type:'text'},{key:'last',label:'Author last name',type:'text'},{key:'y',label:'Year',type:'text'},
          {key:'call',label:'Spine label (e.g. FIC TAR)',type:'text'},{key:'note',label:'One-line description',type:'textarea'},
          {key:'cover',label:'Cover picture',type:'image'},COLOR('bg','Spine colour'),COLOR('ink','Spine text colour'),COLOR('ac','Decoration colour'),
          {key:'pat',label:'Decoration',type:'select',options:[['','None'],['bands','Two stripes'],['cap','Colour cap'],['dot','Dot']]},
          {key:'face',label:'Title lettering',type:'select',options:[['serif','Wide'],['cond','Tall and narrow']]},
          {key:'fs',label:'Title size',type:'text'},{key:'T',label:'Spine thickness',type:'text'},{key:'H',label:'Book height',type:'text'},{key:'ar',label:'Cover width \u00f7 height',type:'text'},
          {key:'lean',label:'Leaning',type:'select',options:[['','No'],['yes','Yes']]}
        ],make:function(){return {t:'New book',first:'',last:'',y:'',call:'FIC',note:'',subj:'',cover:'',bg:'#24456E',ink:'#F3ECD6',ac:'',pat:'',face:'serif',fs:'1.6',T:'4',H:'23',ar:'.65',lean:''}}}],
      make:function(){return {type:'shelf',title:'Staff picks',eyebrow:'',lede:'',linkLabel:'',linkUrl:'',books:[]}},
      render:function(b){
        return '<section class="hero"'+id(b)+'><div class="wrap">'+
          (b.eyebrow?'<p class="eyebrow">'+esc(b.eyebrow)+'</p>':'')+
          '<h1>'+esc(b.title)+'</h1>'+
          '<div class="stage"><div class="shelf-in"><div class="row"></div><div class="plank"></div></div></div>'+
          '<div class="below"><div class="lede"><p>'+esc(b.lede)+'</p>'+(b.linkLabel?'<a href="'+esc(b.linkUrl||'#')+'">'+esc(b.linkLabel)+'</a>':'')+
          '<div class="pager"><button type="button" class="prev" aria-label="Previous book">&larr;</button><button type="button" class="next" aria-label="Next book">&rarr;</button></div></div>'+
          '<div class="detail"><img class="dcover" alt=""><aside class="card" aria-label="Selected book"><div class="entry"><p class="ti"></p><p class="au"></p><p class="note"></p></div></aside></div></div>'+
          '</div></section>';
      },
      mount:function(el,b){window.initShelf(el,b.books||[])}},

    pagehead:{label:'Page title banner',
      fields:[{key:'kicker',label:'Small line above',type:'text'},{key:'title',label:'Title',type:'text'},{key:'text',label:'Text under the title',type:'textarea'},COLOR('bg','Background colour (optional)'),COLOR('ink','Text colour (optional)')],
      make:function(){return {type:'pagehead',kicker:'',title:'Page title',text:'',bg:'',ink:''}},
      render:function(b){
        return '<section class="pagehead"'+id(b)+' style="'+col(b.bg,b.ink)+'"><div class="wrap"><div class="ph-text">'+(b.kicker?'<p class="kicker">'+esc(b.kicker)+'</p>':'')+'<h1>'+esc(b.title)+'</h1>'+(b.text?'<p class="ph-lede">'+esc(b.text)+'</p>':'')+'</div></div></section>';
      }},

    text:{label:'Heading and text',
      fields:[ANCHOR,{key:'kicker',label:'Small line above',type:'text'},{key:'heading',label:'Heading',type:'text'},{key:'body',label:'Text (blank line between paragraphs; start lines with "- " for a list)',type:'textarea'},{key:'aside',label:'Small closing line',type:'text'}],
      make:function(){return {type:'text',anchor:'',kicker:'',heading:'New section',body:'Write something here.',aside:''}},
      render:function(b){return '<section class="band"'+id(b)+'><div class="wrap welcome"><div>'+head(b)+'</div><div class="prose">'+rich(b.body)+(b.aside?'<p class="who">'+linkify(b.aside)+'</p>':'')+'</div></div></section>'}},

    tiles:{label:'Colour link tiles',
      fields:[ANCHOR,{key:'kicker',label:'Small line above',type:'text'},{key:'heading',label:'Heading',type:'text'},{key:'look',label:'Look',type:'select',options:[['','Full colour with a stained-glass leaf'],['soft','Soft tint with a plain leaf']]},
        {key:'items',label:'Tiles',type:'list',itemLabel:'title',noun:'tile',fields:[{key:'title',label:'Title',type:'text'},{key:'text',label:'Text',type:'textarea'},{key:'linkLabel',label:'Link text',type:'text'},{key:'url',label:'Link address',type:'text'},COLOR('bg','Tile colour'),COLOR('ink','Text colour (bold look only)')],
         make:function(){return {title:'New tile',text:'',linkLabel:'Learn more',url:'#',bg:'#5E8F6B',ink:'#0E1C11'}}}],
      make:function(){return {type:'tiles',anchor:'',kicker:'',heading:'Links',items:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+'<div class="tiles'+(b.look==='soft'?' quiet':' bold')+'">'+(b.items||[]).map(function(t,i,all){
          /* rows of up to four, balanced so no tile is left alone: 5 tiles = 2 + 3, 7 = 3 + 4 */
          var span=rowSpan(i,all.length,4);
          return '<a class="tile" href="'+esc(t.url||'#')+'" style="'+col(t.bg,t.ink)+'--span:'+span+'"><div>'+(b.look==='soft'?LEAF:glassLeaf())+'<h3>'+esc(t.title)+'</h3>'+(t.text?'<p>'+esc(t.text)+'</p>':'')+'</div>'+(t.linkLabel?'<span class="go">'+esc(t.linkLabel)+' <span aria-hidden="true">&rarr;</span></span>':'')+'</a>';
        }).join('')+'</div></div></section>';
      }},

    cards:{label:'Notice cards',
      fields:[ANCHOR,{key:'kicker',label:'Small line above',type:'text'},{key:'heading',label:'Heading',type:'text'},
        {key:'items',label:'Cards',type:'list',itemLabel:'title',noun:'card',fields:[{key:'art',label:'Little drawing',type:'select',options:[['','None'],['van','Food van'],['nofine','No fines'],['star','Star'],['signpost','Signpost']]},{key:'photo',label:'Or your own picture',type:'image'},{key:'tag',label:'Tag (when, or what kind)',type:'text'},{key:'title',label:'Title',type:'text'},{key:'text',label:'One short line (keep it under ten words)',type:'textarea'},{key:'more',label:'Extra details (shown underneath, in smaller text)',type:'textarea'},{key:'linkLabel',label:'Link text',type:'text'},{key:'url',label:'Link address',type:'text'}],
         make:function(){return {art:'',tag:'',title:'New notice',text:'',linkLabel:'',url:''}}}],
      make:function(){return {type:'cards',anchor:'',kicker:'',heading:'News',items:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+'<div class="notes">'+(b.items||[]).map(function(c,i,all){
          var pic=c.photo?'<span class="art"><img src="'+esc(c.photo)+'" alt=""></span>':artHtml(c.art);
          return '<article class="note-card'+(pic?' has-art':'')+'" style="--span:'+rowSpan(i,all.length,3)+'">'+pic+'<div class="nc-head">'+(c.tag?'<span class="when">'+esc(c.tag)+'</span>':'')+'<h3>'+esc(c.title)+'</h3></div><div class="nc-body">'+(c.text?'<p>'+esc(c.text)+'</p>':'')+(c.more?'<details class="nc-more"><summary>Read more</summary><p class="nc-extra">'+esc(c.more)+'</p></details>':'')+(c.linkLabel?'<p><a href="'+esc(c.url||'#')+'">'+esc(c.linkLabel)+'</a></p>':'')+'</div></article>';
        }).join('')+'</div></div></section>';
      }},

    visit:{label:'Hours and contact',
      fields:[ANCHOR,{key:'kicker',label:'Small line above',type:'text'},{key:'heading',label:'Heading',type:'text'},{key:'hoursTitle',label:'Hours title',type:'text'},
        {key:'hours',label:'Hours',type:'list',itemLabel:'day',noun:'row',fields:[{key:'day',label:'Day(s)',type:'text'},{key:'time',label:'Hours',type:'text'}],make:function(){return {day:'',time:''}}},
        {key:'address',label:'Street address',type:'textarea'},{key:'phone',label:'Phone',type:'text'},{key:'email',label:'Email',type:'text'},{key:'mailing',label:'Mailing address',type:'text'},
        {key:'closuresTitle',label:'Closures title',type:'text'},{key:'closures',label:'Closures',type:'list',itemLabel:'text',noun:'closure',fields:[{key:'text',label:'Closure',type:'text'}],make:function(){return {text:''}}}],
      make:function(){return {type:'visit',anchor:'visit',kicker:'Visit',heading:'Hours & contact',hoursTitle:'Hours',hours:[],address:'',phone:'',email:'',mailing:'',closuresTitle:'Upcoming closures',closures:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+'<div class="visit"><div><h3>'+esc(b.hoursTitle)+'</h3><dl class="hours">'+(b.hours||[]).map(function(r){return '<dt>'+esc(r.day)+'</dt><dd>'+esc(r.time)+'</dd>'}).join('')+'</dl></div>'+
          '<div><h3>Find us</h3><address>'+esc(b.address).replace(/\n/g,'<br>')+(b.phone?'<br><a href="tel:'+esc(b.phone.replace(/[^\d+]/g,''))+'">'+esc(b.phone)+'</a>':'')+(b.email?'<br><a href="mailto:'+esc(b.email)+'">'+esc(b.email)+'</a>':'')+'</address>'+(b.mailing?'<p class="small">Mailing: '+esc(b.mailing)+'</p>':'')+'</div>'+
          ((b.closures||[]).length?'<div><h3>'+esc(b.closuresTitle)+'</h3><ul>'+b.closures.map(function(c){return '<li>'+esc(c.text)+'</li>'}).join('')+'</ul></div>':'')+'</div></div></section>';
      }},

    calendar:{label:'Program calendar',
      fields:[ANCHOR,{key:'heading',label:'Heading (optional)',type:'text'}],
      note:'Programs are added and edited under \u201cPrograms\u201d in the sidebar.',
      make:function(){return {type:'calendar',anchor:'calendar',heading:''}},
      render:function(b){return '<section class="band cal"'+id(b)+'><div class="wrap">'+(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')+'<div class="cal-body"></div></div></section>'},
      mount:mountCalendar},


    cta:{label:'Call to action with buttons',
      fields:[ANCHOR,{key:'heading',label:'Heading',type:'text'},{key:'text',label:'Text',type:'textarea'},
        {key:'buttons',label:'Buttons',type:'list',itemLabel:'label',noun:'button',fields:[{key:'label',label:'Button text',type:'text'},{key:'url',label:'Goes to',type:'text'}],make:function(){return {label:'Learn more',url:'#'}}},
        COLOR('bg','Background colour'),COLOR('ink','Text colour')],
      make:function(){return {type:'cta',anchor:'',heading:'Get involved',text:'',buttons:[],bg:'#102A4C',ink:'#F7EEDF'}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap"><div class="cta-box" style="'+col(b.bg||'#102A4C',b.ink||'#F7EEDF')+'">'+glassLeaf()+'<div><h2>'+esc(b.heading)+'</h2>'+paras(b.text)+
          ((b.buttons||[]).length?'<p class="cta-btns">'+b.buttons.map(function(x,i){return '<a class="btn'+(i?' alt':'')+'" href="'+esc(x.url||'#')+'">'+esc(x.label)+'</a>'}).join('')+'</p>':'')+'</div></div></div></section>';
      }},

    people:{label:'List of people',
      fields:[ANCHOR,{key:'heading',label:'Heading',type:'text'},{key:'text',label:'Text under the heading (optional)',type:'textarea'},
        {key:'items',label:'People',type:'list',itemLabel:'name',noun:'person',fields:[{key:'name',label:'Name',type:'text'},{key:'role',label:'Role (optional)',type:'text'}],make:function(){return {name:'',role:''}}}],
      make:function(){return {type:'people',anchor:'',heading:'Our board',text:'',items:[]}},
      render:function(b){
        var cols=['#102A4C','#BF430C','#7A1B2E','#2E6646'];
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+(b.text?'<div class="people-text">'+paras(b.text)+'</div>':'')+'<ul class="people">'+(b.items||[]).map(function(p,i){
          var ini=String(p.name||'').trim().split(/\s+/).map(function(w){return w.charAt(0)}).slice(0,2).join('').toUpperCase();
          return '<li class="person"><span class="ini" style="--c:'+cols[i%cols.length]+'" aria-hidden="true">'+esc(ini)+'</span><span><strong>'+esc(p.name)+'</strong>'+(p.role?'<span class="role">'+esc(p.role)+'</span>':'')+'</span></li>';
        }).join('')+'</ul></div></section>';
      }},

    folds:{label:'Expandable sections',
      fields:[ANCHOR,{key:'heading',label:'Heading',type:'text'},{key:'text',label:'Text under the heading (optional)',type:'textarea'},
        {key:'items',label:'Sections',type:'list',itemLabel:'title',noun:'section',fields:[{key:'title',label:'Title',type:'text'},{key:'body',label:'Text (blank line between paragraphs; start lines with "- " for a list)',type:'textarea'}],make:function(){return {title:'New section',body:''}}}],
      make:function(){return {type:'folds',anchor:'',heading:'More information',text:'',items:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+(b.text?'<div class="people-text">'+paras(b.text)+'</div>':'')+'<div class="folds">'+(b.items||[]).map(function(f){
          return '<details class="fold"><summary>'+esc(f.title)+'</summary><div class="prose">'+rich(f.body)+'</div></details>';
        }).join('')+'</div></div></section>';
      }},

    gallery:{label:'Photo gallery',
      fields:[ANCHOR,{key:'heading',label:'Heading (optional)',type:'text'},
        {key:'items',label:'Photos',type:'list',itemLabel:'alt',noun:'photo',fields:[{key:'src',label:'Photo',type:'image'},{key:'alt',label:'Describe the photo (for people who can\u2019t see it)',type:'text'},{key:'caption',label:'Caption (optional)',type:'text'}],make:function(){return {src:'',alt:'',caption:''}}}],
      make:function(){return {type:'gallery',anchor:'',heading:'',items:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+'<div class="gallery">'+(b.items||[]).filter(function(p){return p.src}).map(function(p){
          return '<figure><img src="'+esc(p.src)+'" alt="'+esc(p.alt)+'" loading="lazy">'+(p.caption?'<figcaption>'+esc(p.caption)+'</figcaption>':'')+'</figure>';
        }).join('')+'</div></div></section>';
      }},

    quote:{label:'Quote or statement',
      fields:[ANCHOR,{key:'heading',label:'Who is speaking',type:'text'},{key:'text',label:'Their words (blank line between paragraphs)',type:'textarea'},COLOR('bg','Background colour'),COLOR('ink','Text colour')],
      make:function(){return {type:'quote',anchor:'',heading:'',text:'',bg:'#7A1B2E',ink:'#FBE3E6'}},
      render:function(b){
        var ps=String(b.text||'').split(/\n\s*\n/).filter(Boolean);
        return '<section class="band"'+id(b)+'><div class="wrap"><figure class="quote" style="'+col(b.bg||'#7A1B2E',b.ink||'#FBE3E6')+'">'+glassLeaf()+'<blockquote>'+ps.map(function(p,i){return '<p'+(i?'':' class="lead"')+'>'+esc(p)+'</p>'}).join('')+'</blockquote>'+(b.heading?'<figcaption>'+esc(b.heading)+'</figcaption>':'')+'</figure></div></section>';
      }},

    names:{label:'Lists of names (members, donors)',
      fields:[ANCHOR,{key:'heading',label:'Heading',type:'text'},{key:'text',label:'Text under the heading (optional)',type:'textarea'},
        {key:'groups',label:'Groups',type:'list',itemLabel:'title',noun:'group',fields:[{key:'title',label:'Group name',type:'text'},{key:'names',label:'Names, one per line',type:'textarea'}],make:function(){return {title:'New group',names:''}}}],
      make:function(){return {type:'names',anchor:'',heading:'Thank you',text:'',groups:[]}},
      render:function(b){
        return '<section class="band"'+id(b)+'><div class="wrap">'+head(b)+(b.text?'<div class="people-text">'+paras(b.text)+'</div>':'')+'<div class="folds">'+(b.groups||[]).map(function(g){
          var list=String(g.names||'').split('\n').map(function(n){return n.trim()}).filter(Boolean);
          return '<details class="fold"><summary><span>'+esc(g.title)+' <span class="count">('+list.length+')</span></span></summary><ul class="names">'+list.map(function(n){return '<li>'+esc(n)+'</li>'}).join('')+'</ul></details>';
        }).join('')+'</div></div></section>';
      }},

    spotlight:{label:'Photo with a short story',
      fields:[ANCHOR,{key:'heading',label:'Heading',type:'text'},{key:'text',label:'Text (blank line between paragraphs)',type:'textarea'},{key:'src',label:'Photo',type:'image'},{key:'alt',label:'Describe the photo (for people who can\u2019t see it)',type:'text'},
        {key:'zoom',label:'Zoom into the photo (100 = whole picture)',type:'text'},{key:'x',label:'Slide left to right (0 to 100)',type:'text'},{key:'y',label:'Slide top to bottom (0 to 100)',type:'text'},COLOR('bg','Background colour'),COLOR('ink','Text colour')],
      make:function(){return {type:'spotlight',anchor:'',heading:'A closer look',text:'',src:'',alt:'',zoom:'100',x:'50',y:'50',bg:'#102A4C',ink:'#F7EEDF'}},
      render:function(b){
        var z=parseFloat(b.zoom)||100,x=parseFloat(b.x),y=parseFloat(b.y);if(!isFinite(x))x=50;if(!isFinite(y))y=50;
        var photo=b.src?'<div class="spot-photo" role="img" aria-label="'+esc(b.alt)+'" style="background-image:url(&quot;'+esc(String(b.src).replace(/["\\]/g,''))+'&quot;);background-size:'+Math.max(z,100)+'% auto;background-position:'+x+'% '+y+'%"></div>':'';
        return '<section class="band"'+id(b)+'><div class="wrap"><div class="spot'+(photo?'':' no-photo')+'" style="'+col(b.bg||'#102A4C',b.ink||'#F7EEDF')+'">'+photo+'<div class="spot-text"><h2>'+esc(b.heading)+'</h2>'+paras(b.text)+'</div></div></div></section>';
      }},

    banner:{label:'Colour banner with a button',
      fields:[{key:'text',label:'Text',type:'textarea'},{key:'linkLabel',label:'Button text',type:'text'},{key:'url',label:'Button address',type:'text'},COLOR('bg','Background colour'),COLOR('ink','Text colour')],
      make:function(){return {type:'banner',text:'Something worth knowing.',linkLabel:'Learn more',url:'#',bg:'#24456E',ink:'#F3ECD6'}},
      render:function(b){return '<section class="band"'+id(b)+'><div class="wrap"><div class="banner" style="'+col(b.bg,b.ink)+'"><p>'+esc(b.text)+'</p>'+(b.linkLabel?'<a class="btn" href="'+esc(b.url||'#')+'">'+esc(b.linkLabel)+' <span aria-hidden="true">&rarr;</span></a>':'')+'</div></div></section>'}},

    image:{label:'Picture',
      fields:[{key:'src',label:'Picture',type:'image'},{key:'crop',label:'How much to show',type:'select',options:[['','The whole picture'],['strip','Only the strip along the bottom (e.g. a row of logos on a flyer)']]},{key:'alt',label:'Describe the picture (for screen readers)',type:'text'},{key:'caption',label:'Caption',type:'text'}],
      make:function(){return {type:'image',src:'',alt:'',caption:''}},
      render:function(b){return '<section class="band"'+id(b)+'><div class="wrap"><figure class="pic'+(b.crop==='strip'?' strip':'')+'">'+(b.src?'<img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">':'<div class="pic-empty">No picture chosen yet</div>')+(b.caption?'<figcaption>'+esc(b.caption)+'</figcaption>':'')+'</figure></div></section>'}}
  };

  /* the lamp in the menu: off is the normal daytime site, on switches every page to night colours; the choice is remembered */
  function lamp(app){
    var btn=app.querySelector('.lamp');if(!btn)return;
    function show(){
      var lit=document.documentElement.dataset.theme==='dark';
      btn.setAttribute('aria-pressed',lit?'true':'false');
      btn.setAttribute('aria-label',lit?'Turn off dark mode':'Turn on dark mode');
    }
    btn.addEventListener('click',function(){
      var flip=function(){
        var lit=document.documentElement.dataset.theme==='dark';
        if(lit)delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme='dark';
        try{localStorage.setItem('lamp',lit?'off':'on')}catch(e){}
        show();
      };
      var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(document.startViewTransition&&!calm){var f=document.startViewTransition(flip);f.ready.catch(function(){});f.finished.catch(function(){})}else flip();
    });
    show();
  }

  window.renderPage=function(app,site,slug){
    var page=(site.pages||[]).filter(function(p){return p.slug===slug})[0];
    var here=window.Store.pageUrl(slug);
    var nav='<a class="skip" href="#main">Skip to main content</a><p class="mock">Design mockup. This is not the official '+esc(site.name)+' website.</p><div class="stripe" aria-hidden="true"></div><header class="wrap"><nav class="nav" aria-label="Main"><a class="mark" href="index.html">'+(site.logo?'<img src="'+esc(site.logo)+'" alt="'+esc(site.name)+'">':esc(site.name))+'</a><div class="links" id="site-menu">'+
      ((site.nav||[]).some(function(n){return n.url==='index.html'})?[]:[{label:'Home',url:'index.html'}]).concat(site.nav||[]).map(function(n,i,all){return '<a href="'+esc(n.url)+'"'+(n.url===here?' aria-current="page"':'')+'>'+esc(n.label)+'</a>'}).join('')+'</div>'+
      '<div class="lamp-wrap"><button type="button" class="lamp" aria-pressed="false" aria-label="Turn on dark mode"><svg viewBox="0 0 120 190" aria-hidden="true"><path class="lamp-base" d="M28 188 Q28 171 60 171 Q92 171 92 188 Z"/><circle class="lamp-knob" cx="60" cy="17" r="5"/><path class="lamp-shade" d="M8 86 Q7 23 60 20 Q113 23 112 86 Z"/><ellipse class="lamp-under" cx="60" cy="86" rx="52" ry="7"/><rect class="lamp-stem" x="55.5" y="86" width="9" height="88"/></svg></button></div><button type="button" class="menu-btn" aria-expanded="false" aria-controls="site-menu">Menu</button></nav></header>';
    var foot='<footer class="wrap foot"><span>'+esc(site.name)+(site.tagline?' &middot; '+esc(site.tagline):'')+'</span>'+(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'<nav aria-label="Footer"><a href="admin.html">Staff sign-in</a></nav>':'')+'</footer>';
    if(!page){app.innerHTML=nav+'<main id="main" tabindex="-1"><section class="band"><div class="wrap"><h1>Page not found</h1><p><a href="index.html">Back to the homepage</a></p></div></section></main>'+foot;return}
    document.title=(slug==='home'?'':page.title+' \u00b7 ')+site.name;
    app.innerHTML=nav+'<main id="main" tabindex="-1">'+page.blocks.map(function(b,i){var d=window.BLOCKS[b.type];return d?'<div data-block="'+i+'">'+d.render(b,site)+'</div>':''}).join('')+'</main>'+foot;
    page.blocks.forEach(function(b,i){var d=window.BLOCKS[b.type];if(d&&d.mount)d.mount(app.querySelector('[data-block="'+i+'"]'),b,site)});
    lamp(app);
    /* notices: the fuller details sit open on big screens and behind "Read more" on phones */
    var wide=window.matchMedia('(min-width:761px)');
    var setMore=function(){[].forEach.call(app.querySelectorAll('.nc-more'),function(d){d.open=wide.matches})};
    setMore();if(wide.addEventListener)wide.addEventListener('change',setMore);
    /* phones: the menu opens and closes from one button */
    var mb=app.querySelector('.menu-btn'),nv=app.querySelector('.nav');
    if(mb)mb.addEventListener('click',function(){
      var open=nv.classList.toggle('open');
      mb.setAttribute('aria-expanded',open?'true':'false');mb.textContent=open?'Close':'Menu';
    });
  };
})();
