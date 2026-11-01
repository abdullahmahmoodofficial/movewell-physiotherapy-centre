(function(){'use strict';var WA='923001234567';
var hb=document.getElementById('hamburger'),nav=document.getElementById('nav');
if(hb&&nav){hb.addEventListener('click',function(){nav.classList.toggle('open');});}
/* Scroll reveal with stagger (via --d) */
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:.12});document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});}
else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible');});}
/* Animated counters */
document.querySelectorAll('[data-count]').forEach(function(el){var t=parseFloat(el.getAttribute('data-count')),dec=parseInt(el.getAttribute('data-decimals')||'0',10),suf=el.getAttribute('data-suffix')||'',st=null;function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/1800,1);var v=t*p;el.textContent=(dec?v.toFixed(dec):Math.round(v).toLocaleString('en-PK'))+suf;if(p<1)requestAnimationFrame(step);}function start(){requestAnimationFrame(step);}if('IntersectionObserver' in window){var o2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){start();o2.disconnect();}});});o2.observe(el);}else{start();}});
/* FAQ accordion */
document.querySelectorAll('.faq-item button').forEach(function(b){b.addEventListener('click',function(){b.parentElement.classList.toggle('open');});});
/* Testimonial slider: auto-rotate + dots + arrows */
var slides=document.querySelectorAll('.slide');
if(slides.length){var cur=0,dots=document.querySelectorAll('.dots-row button'),timer=null;
 function show(i){cur=(i+slides.length)%slides.length;slides.forEach(function(s,j){s.classList.toggle('on',j===cur);});dots.forEach(function(d,j){d.classList.toggle('on',j===cur);});}
 function auto(){clearInterval(timer);timer=setInterval(function(){show(cur+1);},6000);}
 var pv=document.getElementById('prevBtn'),nx=document.getElementById('nextBtn');
 if(pv)pv.addEventListener('click',function(){show(cur-1);auto();});
 if(nx)nx.addEventListener('click',function(){show(cur+1);auto();});
 dots.forEach(function(d,j){d.addEventListener('click',function(){show(j);auto();});});
 var sl=document.getElementById('slider');
 if(sl){sl.addEventListener('mouseenter',function(){clearInterval(timer);});sl.addEventListener('mouseleave',auto);}
 show(0);auto();}
/* 3D tilt-on-hover (fine pointers only; disabled under reduced motion) */
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced&&window.matchMedia('(pointer: fine)').matches){
 document.querySelectorAll('.card,.gallery-grid figure,.step').forEach(function(card){
  card.addEventListener('mousemove',function(e){var r=card.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.classList.add('tilted');card.style.transform='perspective(900px) rotateY('+(x*8)+'deg) rotateX('+(-y*8)+'deg) translateY(-4px)';});
  card.addEventListener('mouseleave',function(){card.classList.remove('tilted');card.style.transform='';});
 });
 /* Hero parallax layers */
 var heroPanel=document.getElementById('heroVisual');
 if(heroPanel){heroPanel.addEventListener('mousemove',function(e){var r=heroPanel.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;heroPanel.querySelectorAll('[data-depth]').forEach(function(layer){var d=parseFloat(layer.getAttribute('data-depth'));layer.style.transform='translate('+(x*d)+'px,'+(y*d)+'px)';});});
 heroPanel.addEventListener('mouseleave',function(){heroPanel.querySelectorAll('[data-depth]').forEach(function(layer){layer.style.transform='';});});}
}
/* Mobility Self-Check (homepage widget) */
var mcBtn=document.getElementById('mcBtn');
if(mcBtn){var mcPain=document.getElementById('mcPain'),mcPainVal=document.getElementById('mcPainVal');
 mcPain.addEventListener('input',function(){mcPainVal.textContent=mcPain.value;});
 var MC={
  'back-neck':{t:'back-neck-pain-therapy',n:'Back & Neck Pain Therapy',d:'hands-on treatment for back and neck pain, stiffness and posture problems'},
  'shoulder-arm':{t:'initial-assessment',n:'Initial Assessment & Treatment Plan',d:'a full assessment so we can find exactly what is limiting your shoulder or arm'},
  'knee-leg':{t:'initial-assessment',n:'Initial Assessment & Treatment Plan',d:'a full assessment of your knee, hip or leg before we build your recovery plan'},
  'sports':{t:'sports-injury-rehabilitation',n:'Sports Injury Rehabilitation',d:'staged rehab designed to return you to your sport safely'},
  'surgery':{t:'post-surgery-rehabilitation',n:'Post-Surgery Rehabilitation',d:'milestone-based recovery that follows your surgeon\u2019s protocol'},
  'balance':{t:'stroke-neuro-rehabilitation',n:'Stroke & Neuro Rehabilitation',d:'balance, walking and strength retraining — home visits are available'} };
 mcBtn.addEventListener('click',function(){
  var area=document.getElementById('mcArea').value,pain=parseInt(mcPain.value,10),weeks=document.getElementById('mcWeeks').value;
  var rec=MC[area]||MC['back-neck'];
  var urgency=pain>=7?'Your difficulty level is high, so we recommend booking this week rather than waiting.':(weeks==='long'||weeks==='months'?'Because this has been going on for a while, a structured plan will work better than occasional treatment.':'Caught early, this usually responds quickly to the right plan.');
  document.getElementById('mcText').innerHTML='<b>Recommended: '+rec.n+'.</b> Based on your answers, start with '+rec.d+'. '+urgency;
  document.getElementById('mcLink').href='appointment.html?t='+rec.t;
  document.getElementById('mcResult').classList.add('show');
 });}
/* Contact form: validate, then WhatsApp pre-filled */
var cSend=document.getElementById('cSend');
if(cSend){cSend.addEventListener('click',function(){
 var n=document.getElementById('cName'),p=document.getElementById('cPhone'),m=document.getElementById('cMsg'),er=document.getElementById('cErr');
 var bad=!n.value.trim()||p.value.replace(/\D/g,'').length<10||!m.value.trim();
 er.textContent=bad?'Please add your name, a valid phone number (at least 10 digits) and a message.':'';
 er.style.display=bad?'block':'none';
 if(bad)return;
 var msg='Assalam-o-Alaikum! I have a question for MoveWell Physiotherapy Centre.%0AName: '+encodeURIComponent(n.value)+'%0APhone: '+encodeURIComponent(p.value)+'%0AMessage: '+encodeURIComponent(m.value);
 document.getElementById('cOk').textContent='Opening WhatsApp with your message\u2026';
 window.open('https://wa.me/'+WA+'?text='+msg,'_blank');});}
})();
