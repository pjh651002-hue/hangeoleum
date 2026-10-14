/* 알아차림: 멈춤 → 바라보기(이름 붙이기) → 묻기 → 선택하기. 기록은 이 기기의 localStorage(hangeol.aware)에만 둡니다. */
(function(){"use strict";
var DOMAINS=HG.DOMAINS,PROMISES=HG.PROMISES,NUMS=HG.NUMS,MIRROR=HG.AWARE_MIRROR;
var KEY="hangeol.aware",mem=null;
var storageOK=(function(){try{var k="hangeol.__aw";localStorage.setItem(k,"1");localStorage.removeItem(k);return true}catch(e){return false}})();
function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function pad(n){return n<10?"0"+n:""+n}
function dayKey(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function stamp(t){var d=new Date(t),now=new Date;if(dayKey(d)===dayKey(now))return"오늘 "+pad(d.getHours())+":"+pad(d.getMinutes());return(d.getMonth()+1)+"월 "+d.getDate()+"일"}
function load(){if(mem)return mem;var v=[];try{if(storageOK){var s=localStorage.getItem(KEY);if(s)v=JSON.parse(s)}}catch(e){v=[]}if(!Array.isArray(v))v=[];mem=v;return mem}
function persist(){try{if(storageOK){localStorage.setItem(KEY,JSON.stringify(mem));return true}}catch(e){}return false}
function byId(id){for(var i=0;i<DOMAINS.length;i++)if(DOMAINS[i].id===id)return DOMAINS[i];return null}
var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var STEPS=["멈추기","바라보기","묻기","선택하기"];
var HEAD={h:"지금, 어느 자리에서 마음이 움직였나요?",l:"멈추고, 이름 붙이고, 묻고, 고릅니다. 1~2분이면 충분합니다."};

/* 자리 고르기 */
$("aw-grid").innerHTML=DOMAINS.map(function(d){return'<li><button type="button" class="aw-card" data-dom="'+d.id+'"><span class="nm">'+esc(d.name)+'</span><span class="wh"><span class="sr-only">이럴 때: </span>'+esc(d.when[0])+"</span>"+(d.note?'<span class="aw-through">'+esc(d.note)+"</span>":"")+"</button></li>"}).join("");
$("aw-grid").querySelectorAll("[data-dom]").forEach(function(b){b.addEventListener("click",function(){start(b.getAttribute("data-dom"),true)})});

/* 오늘 탭 진입 카드 */
var entry=$("aw-entry-chips");
if(entry){entry.innerHTML=DOMAINS.map(function(d){return'<button type="button" class="chip" data-aw-go="'+d.id+'">'+esc(d.name)+"</button>"}).join("");
entry.querySelectorAll("[data-aw-go]").forEach(function(b){b.addEventListener("click",function(){start(b.getAttribute("data-aw-go"),false);if(location.hash!=="#aware")location.hash="aware";else focusStep()})})}

/* 흐름 상태 */
var st=null,timers=[];
function clearTimers(){timers.forEach(function(t){clearTimeout(t)});timers=[]}
function seed(){var n=new Date,s=new Date(n.getFullYear(),0,0);return Math.floor((n-s)/864e5)+load().length}
function start(id,focus){var d=byId(id);if(!d)return;clearTimers();
var a=seed()%d.qs.length;
st={d:d,step:0,feels:[],own:"",ans:"",act:"",ownAct:"",qi:[a,(a+2)%d.qs.length],saved:false,rest:false};
$("aw-pick").hidden=true;$("aw-flow").hidden=false;
$("aw-eyebrow").textContent="알아차림 · "+d.name;
$("h-aware").textContent=d.name+"의 자리에서";
$("aw-lede").textContent=d.essence;
render();
if(focus){window.scrollTo(0,0);focusStep()}}
function back(){clearTimers();st=null;$("aw-flow").hidden=true;$("aw-flow").innerHTML="";$("aw-pick").hidden=false;
$("aw-eyebrow").textContent="알아차림";$("h-aware").textContent=HEAD.h;$("aw-lede").textContent=HEAD.l;
window.scrollTo(0,0);var f=$("aw-grid").querySelector("button");if(f)f.focus({preventScroll:true})}
function focusStep(){var h=$("aw-flow").querySelector("[data-focus]");if(h)h.focus({preventScroll:true})}
function feelText(){var f=st.feels.slice();if(st.own)f.push(st.own);return f}
function actText(){return st.ownAct||st.act}

function summary(i){var d=st.d,v;
if(i===0)v="숨 한 번 쉬었어요";
else if(i===1)v=feelText().join(", ");
else if(i===2)v=st.ans?st.ans:d.keyQ;
return'<li class="aw-done"><span class="k">'+STEPS[i]+'</span><span class="v">'+esc(v)+"</span></li>"}

function render(){var box=$("aw-flow"),d=st.d,h="";
if(st.step>=4){renderEnd();return}
h+='<div class="aw-top"><span class="aw-prog tnum" aria-label="네 단계 가운데 '+(st.step+1)+'번째">'+(st.step+1)+" / 4</span>"+'<button type="button" class="btn quiet" id="aw-repick">다른 자리 고르기</button></div>';
h+='<ol class="aw-steps">';
for(var i=0;i<st.step;i++)h+=summary(i);
h+='<li class="aw-cur">'+stepHTML(st.step)+"</li></ol>";
box.innerHTML=h;
$("aw-repick").addEventListener("click",back);
bind(st.step)}

function stepHTML(s){var d=st.d;
if(s===0)return'<h3 class="aw-sh" tabindex="-1" data-focus>숨 한 번</h3>'+
'<div class="aw-breath'+(reduceMotion?" still":"")+'" aria-hidden="true"><div class="dot" id="aw-dot"></div></div>'+
'<p class="aw-phase" id="aw-phase" aria-live="polite">'+(reduceMotion?"천천히 들이쉬고, 길게 내쉬어 보세요.":"원이 커지는 동안 들이쉬고")+"</p>"+
'<div class="row aw-nav c"><button type="button" class="btn ghost" id="aw-skip">'+(reduceMotion?"숨 한 번 쉬었어요":"건너뛰기")+"</button></div>";
if(s===1)return'<h3 class="aw-sh" tabindex="-1" data-focus id="aw-feel-h">지금 올라온 마음에 이름을 붙여 보세요.</h3>'+
'<p class="note">여러 개를 골라도 괜찮습니다.</p>'+
'<div class="row" role="group" aria-labelledby="aw-feel-h" id="aw-feels">'+d.feels.concat(["잘 모르겠음"]).map(function(f){return'<button type="button" class="chip" aria-pressed="'+(st.feels.indexOf(f)>=0)+'" data-f="'+esc(f)+'">'+esc(f)+"</button>"}).join("")+"</div>"+
'<div class="field"><label class="lbl" for="aw-own">직접 적기</label><input type="text" id="aw-own" maxlength="20" placeholder="떠오르는 말 그대로" value="'+esc(st.own)+'"></div>'+
'<p class="aw-quote">누르거나 없애려 하지 않고, 일어난 대로 바라봅니다.</p>'+
'<div class="row aw-nav"><button type="button" class="btn quiet" id="aw-prev">이전</button><button type="button" class="btn" id="aw-next">다음</button></div>'+
'<p class="status" id="aw-msg" role="status" aria-live="polite"></p>';
if(s===2)return'<h3 class="aw-sh sm" tabindex="-1" data-focus>스스로에게 물어봅니다</h3>'+
'<p class="aw-keyq">'+esc(d.keyQ)+"</p>"+
'<ul class="aw-qs">'+st.qi.map(function(i){return"<li>"+esc(d.qs[i])+"</li>"}).join("")+"</ul>"+
'<div class="field"><label class="lbl" for="aw-ans">짧게 적어 두기 <span class="opt">(적지 않아도 괜찮아요)</span></label><textarea id="aw-ans" maxlength="200" placeholder="떠오른 대로">'+esc(st.ans)+"</textarea></div>"+
'<div class="row aw-nav"><button type="button" class="btn quiet" id="aw-prev">이전</button><button type="button" class="btn" id="aw-next">다음</button></div>';
if(s===3)return'<h3 class="aw-sh" tabindex="-1" data-focus id="aw-act-h">오늘 해 볼 작은 실천 하나</h3>'+
'<div class="aw-acts" role="radiogroup" aria-labelledby="aw-act-h" id="aw-acts">'+d.acts.map(function(a,i){return'<button type="button" class="chip" role="radio" aria-checked="'+(st.act===a&&!st.ownAct)+'" data-a="'+i+'">'+esc(a)+"</button>"}).join("")+"</div>"+
'<div class="field"><label class="lbl" for="aw-ownact">직접 쓰기</label><input type="text" id="aw-ownact" maxlength="60" placeholder="내 자리에 맞는 실천" value="'+esc(st.ownAct)+'"></div>'+
'<div class="aw-pr"><span class="eyebrow">이어지는 생활수행 약속</span><ul>'+d.promises.map(function(i){return'<li><span class="pn tnum">'+NUMS[i]+"</span><span>"+esc(PROMISES[i].t)+"</span></li>"}).join("")+"</ul></div>"+
'<div class="row aw-nav"><button type="button" class="btn quiet" id="aw-prev">이전</button><button type="button" class="btn" id="aw-next">마치기</button></div>'+
'<p class="status" id="aw-msg" role="status" aria-live="polite"></p>';
return""}

function go(n){clearTimers();st.step=n;render();focusStep()}
function bind(s){var p=$("aw-prev");if(p)p.addEventListener("click",function(){go(s-1)});
if(s===0){var ph=$("aw-phase"),dot=$("aw-dot");
$("aw-skip").addEventListener("click",function(){go(1)});
if(!reduceMotion){void dot.offsetWidth;dot.classList.add("run");
timers.push(setTimeout(function(){ph.textContent="원이 작아지는 동안 길게 내쉬고"},4000));
timers.push(setTimeout(function(){ph.textContent="숨 한 번, 쉬었어요.";$("aw-skip").textContent="다음"},10000));
timers.push(setTimeout(function(){if(st&&st.step===0)go(1)},11400))}
return}
if(s===1){$("aw-feels").querySelectorAll("[data-f]").forEach(function(b){b.addEventListener("click",function(){var f=b.getAttribute("data-f"),k=st.feels.indexOf(f);
if(k>=0)st.feels.splice(k,1);else st.feels.push(f);b.setAttribute("aria-pressed",k<0?"true":"false");$("aw-msg").textContent=""})});
$("aw-own").addEventListener("input",function(){st.own=this.value.trim()});
$("aw-next").addEventListener("click",function(){st.own=$("aw-own").value.trim();
if(!feelText().length){$("aw-msg").textContent="하나만 골라도, 한 단어만 적어도 충분합니다.";return}go(2)});return}
if(s===2){$("aw-ans").addEventListener("input",function(){st.ans=this.value.trim()});
$("aw-next").addEventListener("click",function(){st.ans=$("aw-ans").value.trim();go(3)});return}
if(s===3){var bs=$("aw-acts").querySelectorAll("[data-a]");
bs.forEach(function(b){b.addEventListener("click",function(){st.act=st.d.acts[+b.getAttribute("data-a")];st.ownAct="";$("aw-ownact").value="";
bs.forEach(function(x){x.setAttribute("aria-checked",x===b?"true":"false")});$("aw-msg").textContent=""})});
$("aw-ownact").addEventListener("input",function(){st.ownAct=this.value.trim();if(st.ownAct)bs.forEach(function(x){x.setAttribute("aria-checked","false")});else if(st.act)bs.forEach(function(x){x.setAttribute("aria-checked",st.d.acts[+x.getAttribute("data-a")]===st.act?"true":"false")})});
$("aw-next").addEventListener("click",function(){st.ownAct=$("aw-ownact").value.trim();
if(!actText()){$("aw-msg").textContent="하나를 고르거나 직접 적어 주세요.";return}go(4)})}}

function renderEnd(){var d=st.d,box=$("aw-flow");
if(st.rest){box.innerHTML='<div class="aw-end rest"><p class="big" tabindex="-1" data-focus>이제 화면을 내려놓으세요.</p><p class="note">'+(st.saved?"기록은 이 기기에 남겨 두었어요.":"기록은 남기지 않았어요. 알아차린 마음은 그대로 당신 안에 있습니다.")+"</p>"+
'<p class="note">고른 실천: '+esc(actText())+"</p>"+
'<button type="button" class="btn quiet" id="aw-again">다른 자리 보기</button></div>';
$("aw-again").addEventListener("click",back);return}
box.innerHTML='<div class="aw-end"><p class="aw-endh" tabindex="-1" data-focus>알아차린 것만으로 이미 수행입니다.</p>'+
'<dl class="aw-sum"><div><dt>자리</dt><dd>'+esc(d.name)+"</dd></div><div><dt>마음</dt><dd>"+esc(feelText().join(", "))+"</dd></div>"+(st.ans?"<div><dt>답</dt><dd>"+esc(st.ans)+"</dd></div>":"")+"<div><dt>실천</dt><dd>"+esc(actText())+"</dd></div></dl>"+
'<div class="aw-mirror"><span class="eyebrow">거울에 비춰 보기</span><ul>'+MIRROR.map(function(m){return"<li><b>"+esc(m.k)+"</b><span>"+esc(m.t)+"</span></li>"}).join("")+"</ul></div>"+
'<div class="aw-endbtns"><button type="button" class="btn'+(st.saved?" done":"")+'" id="aw-save"'+(st.saved?' aria-pressed="true"':"")+">"+(st.saved?"남겼어요":"기록 남기기")+"</button>"+
'<button type="button" class="btn ghost" id="aw-other">다른 자리 보기</button>'+
'<button type="button" class="btn quiet" id="aw-rest">이제 화면을 내려놓기</button></div>'+
'<p class="status" id="aw-msg" role="status" aria-live="polite"></p></div>';
$("aw-save").addEventListener("click",function(){if(st.saved)return;var ok=saveRec();st.saved=true;
this.textContent="남겼어요";this.classList.add("done");this.setAttribute("aria-pressed","true");
$("aw-msg").textContent=ok?"남겼어요. 오늘 탭의 마음 기록에도 한 줄 적어 두었습니다.":"남겼어요. 다만 이 브라우저는 저장을 막고 있어 창을 닫으면 사라집니다."});
$("aw-other").addEventListener("click",back);
$("aw-rest").addEventListener("click",function(){st.rest=true;renderEnd();focusStep()})}

function saveRec(){var r={t:Date.now(),d:st.d.id,feels:feelText(),act:actText()};if(st.ans)r.ans=st.ans;
load().unshift(r);if(mem.length>300)mem.length=300;var ok=persist();
try{if(HG.addMind)HG.addMind("알아차림·"+st.d.name+": "+r.feels.join(", "),"aware")}catch(e){}
renderLog();return ok}

/* 기록 */
var filter="all";
function weekStart(){var n=new Date,d=new Date(n.getFullYear(),n.getMonth(),n.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()}
function renderLog(){var recs=load(),ws=weekStart(),seen={};
recs.forEach(function(r){if(r.t>=ws)seen[r.d]=1});
var names=DOMAINS.filter(function(d){return seen[d.id]}).map(function(d){return d.name});
$("aw-week-list").innerHTML=names.length?names.map(function(n){return'<span class="aw-place">'+esc(n)+"</span>"}).join(""):'<span class="aw-none">이번 주에는 아직 머문 자리를 남기지 않았어요.</span>';
$("aw-filter").innerHTML=[{id:"all",name:"전체"}].concat(DOMAINS).map(function(d){return'<button type="button" class="chip" role="radio" aria-checked="'+(filter===d.id)+'" data-flt="'+d.id+'">'+esc(d.name)+"</button>"}).join("");
$("aw-filter").querySelectorAll("[data-flt]").forEach(function(b){b.addEventListener("click",function(){filter=b.getAttribute("data-flt");renderLog();var nb=$("aw-filter").querySelector('[data-flt="'+filter+'"]');if(nb)nb.focus()})});
var list=recs.filter(function(r){return filter==="all"||r.d===filter}).slice(0,10);
$("aw-records").innerHTML=list.length?list.map(function(r){var d=byId(r.d);return'<li><time class="tnum" datetime="'+new Date(r.t).toISOString()+'">'+stamp(r.t)+'</time><span class="txt"><span class="tag">'+esc(d?d.name:"")+"</span>"+esc((r.feels||[]).join(", "))+(r.ans?'<span class="aw-ans">“'+esc(r.ans)+"”</span>":"")+(r.act?'<span class="aw-ract">실천 · '+esc(r.act)+"</span>":"")+"</span></li>"}).join(""):
'<li class="empty">'+(recs.length?"이 자리에 남긴 기록은 아직 없어요.":"아직 남긴 알아차림이 없어요. 위에서 지금 있는 자리를 골라 보세요.")+"</li>";
renderClear()}
function renderClear(){var w=$("aw-clear-wrap");if(!load().length){w.innerHTML="";return}
w.innerHTML='<button class="btn quiet" type="button" id="aw-clear">알아차림 기록 모두 지우기</button>';
$("aw-clear").addEventListener("click",function(){w.innerHTML='<div class="confirm" role="group" aria-label="확인"><p>이 기기에 남긴 알아차림 기록을 모두 지울까요? 지운 기록은 되돌릴 수 없습니다. 오늘 탭의 마음 기록은 그대로 남습니다.</p><div class="row"><button class="btn" type="button" data-a="yes">지울게요</button><button class="btn ghost" type="button" data-a="no">그대로 둘게요</button></div></div>';
w.querySelector('[data-a="yes"]').addEventListener("click",function(){mem=[];persist();filter="all";renderLog();var s=document.createElement("p");s.className="status";s.setAttribute("role","status");s.textContent="모두 지웠어요.";$("aw-clear-wrap").appendChild(s)});
w.querySelector('[data-a="no"]').addEventListener("click",function(){renderClear();var b=$("aw-clear");if(b)b.focus()});
w.querySelector('[data-a="no"]').focus()})}
if(!storageOK)$("aw-store-note").textContent="이 브라우저는 저장을 막고 있어요. 알아차림 기록은 창을 닫으면 사라집니다.";
renderLog();

/* 탭 이동 뒤 흐름이 열려 있으면 현재 단계로 초점을 옮김(app.js의 hashchange 다음에 실행됨) */
window.addEventListener("hashchange",function(){if(location.hash==="#aware"&&st)focusStep()});
HG.awareStart=function(id){start(id,false)};
})();
