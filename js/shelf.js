/* The book shelf hero: flat spines that take turns facing out to show their covers. */
window.initShelf=function(root,books){
  var q=function(s){return root.querySelector(s)};
  var stage=q('.stage'),row=q('.row'),card=q('.card'),detail=q('.detail');
  if(!row||!books||!books.length)return;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur=0,els=[],timer=null,paused=false,stopped=false;
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function num(v,d){v=parseFloat(v);return isFinite(v)?v:d}

  books.forEach(function(b,i){
    var T=num(b.T,4),H=num(b.H,23),D=Math.round(H*num(b.ar,.65)*10)/10;
    var slot=el('div','slot'+(b.lean==='yes'?' lean':''));
    slot.style.cssText='--i:'+i+';--t:'+T+'em;--h:'+H+'em;--d:'+D+'em;--fs:'+num(b.fs,1.5)+'em';
    slot.style.setProperty('--bg-b',b.bg||'#24456E');
    slot.style.setProperty('--ink-b',b.ink||'#F3ECD6');
    if(b.ac)slot.style.setProperty('--ac',b.ac);
    if(b.cover)slot.style.setProperty('--img','url("'+String(b.cover).replace(/["\\]/g,'')+'")');
    var book=el('div','book '+(b.face==='cond'?'cond':'serif')+(b.pat?' p-'+b.pat:''));
    book.setAttribute('role','button');book.tabIndex=0;
    book.setAttribute('aria-pressed','false');
    book.setAttribute('aria-label',b.t+' by '+b.first+' '+b.last);
    book.appendChild(el('span','st',b.t));
    var parts=String(b.call||'').split(' '),lbl=el('span','lbl');
    lbl.appendChild(document.createTextNode(parts[0]||''));lbl.appendChild(el('br'));lbl.appendChild(document.createTextNode(parts.slice(1).join(' ')));
    book.appendChild(lbl);
    if(b.cover)book.appendChild(el('span','cv'));
    slot.appendChild(book);row.appendChild(slot);
    els.push(book);
    book.addEventListener('click',function(){toggle(i)});
    book.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(i)}});
  });

  function fillCard(i,animate){
    var b=books[i];
    q('.ti').textContent=b.t;
    q('.au').textContent=b.first+' '+b.last+(b.y?' \u00b7 '+b.y:'');
    q('.note').textContent=b.note||'';
    card.style.setProperty('--sel',b.bg||'');
    var dc=q('.dcover');
    if(b.cover){dc.hidden=false;dc.src=b.cover;dc.alt='Cover of '+b.t}else{dc.hidden=true}
    if(animate&&!reduced){card.classList.remove('swap');void card.offsetWidth;card.classList.add('swap')}
  }
  function putBack(){els.forEach(function(e){e.setAttribute('aria-pressed','false')})}
  function select(i,animate){
    putBack();cur=i;els[i].setAttribute('aria-pressed','true');fillCard(i,animate!==false);
    /* on phones the shelf is wider than the screen: bring the chosen book to the middle (sideways only) */
    if(stage.scrollWidth>stage.clientWidth+2){
      var slot=els[i].parentNode,left=slot.offsetLeft-(stage.clientWidth-slot.offsetWidth)/2;
      if(stage.scrollTo)stage.scrollTo({left:Math.max(0,left),behavior:reduced?'auto':'smooth'});else stage.scrollLeft=Math.max(0,left);
    }
  }
  function toggle(i){if(els[i].getAttribute('aria-pressed')==='true'){putBack()}else{select(i)}}
  function step(n){select((cur+n+books.length)%books.length)}
  function schedule(){
    clearTimeout(timer);
    if(reduced||paused||stopped)return;
    timer=setTimeout(function(){step(1);schedule()},3600);
  }
  function pause(){paused=true;clearTimeout(timer)}
  function resume(){paused=false;schedule()}
  [stage,detail].forEach(function(z){
    z.addEventListener('pointerenter',pause);z.addEventListener('pointerleave',resume);
    z.addEventListener('focusin',pause);z.addEventListener('focusout',resume);
  });
  /* the shelf turns its own pages until someone picks a book themselves (click, tap or keyboard); after that it stays put */
  function stop(){stopped=true;clearTimeout(timer)}
  stage.addEventListener('click',stop);
  stage.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '||e.key==='Tab')stop()});
  detail.parentNode.addEventListener('click',function(e){if(e.target.closest('.prev,.next'))stop()});
  q('.prev').addEventListener('click',function(){step(-1)});
  q('.next').addEventListener('click',function(){step(1)});

  fillCard(0,false);
  if(reduced){select(0,false)}
  else{setTimeout(function(){select(0,false);schedule()},1900)}
};
