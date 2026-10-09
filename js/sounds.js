/* Small, quiet click sounds, made in the browser (no audio files). Off switch in the footer; the choice is remembered. */
(function(){
  var ctx=null,noise=null,on=true;
  try{on=localStorage.getItem('sound')!=='off'}catch(e){}
  function ready(){
    if(!on)return false;
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    if(!ctx){
      ctx=new AC();
      noise=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate);
      var d=noise.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    }
    if(ctx.state==='suspended')ctx.resume();
    return true;
  }
  /* a breath of filtered noise: paper sliding */
  function rustle(at,freq,peak,len){
    var src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    src.buffer=noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=.7;
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(peak,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+len);
    src.connect(f);f.connect(g);g.connect(ctx.destination);src.start(at);src.stop(at+len+.02);
  }
  /* a soft low knock: something set down on wood */
  function knock(at,from,to,peak,len){
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(from,at);o.frequency.exponentialRampToValueAtTime(to,at+len);
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(peak,at+.006);g.gain.exponentialRampToValueAtTime(.0001,at+len);
    o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+len+.02);
  }
  var play={
    tick:function(){var t=ctx.currentTime;knock(t,520,360,.035,.05)},
    page:function(){var t=ctx.currentTime;rustle(t,2400,.035,.1)},
    lamp:function(){var t=ctx.currentTime;knock(t,900,500,.05,.025);knock(t+.05,700,380,.04,.03)}
  };
  function sound(name){if(ready()&&play[name])play[name]()}

  function label(btn){btn.textContent=on?'Sound: on':'Sound: off';btn.setAttribute('aria-pressed',on?'true':'false')}
  document.addEventListener('click',function(ev){
    var t=ev.target;if(!t.closest)return;
    var toggle=t.closest('.sound-toggle');
    if(toggle){on=!on;try{localStorage.setItem('sound',on?'on':'off')}catch(e){}label(toggle);sound('tick');return}
    if(t.closest('.book')||t.closest('.pager .prev')||t.closest('.pager .next'))return; /* books are silent */
    if(t.closest('.lamp'))return sound('lamp');
    if(t.closest('.fold summary')||t.closest('.day')||t.closest('.cal-view button'))return sound('page');
    if(t.closest('.tile')||t.closest('.btn')||t.closest('.pill')||t.closest('.cal-nav button')||t.closest('.playpause'))return sound('tick');
    /* menu links go to another page straight away, so hold the page for a moment to let the click be heard */
    var a=t.closest('.links a, a.mark');
    if(a&&on&&!ev.defaultPrevented&&ev.button===0&&!ev.metaKey&&!ev.ctrlKey&&!ev.shiftKey&&!ev.altKey&&!a.target){
      sound('tick');ev.preventDefault();setTimeout(function(){location.href=a.href},90);
    }
  });
  window.initSoundToggle=function(root){var b=root.querySelector('.sound-toggle');if(b)label(b)};
})();
