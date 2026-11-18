const plan=[
{title:"1. Gün",type:"Kuvvet A",note:"Kontrollü tekrarlar. Her sette tükenişe gitme; 2-3 tekrar yedekte kalsın.",tasks:[["Şınav","3 set × 6 tekrar","90 sn dinlen"],["Mekik","3 set × 6 tekrar","90 sn dinlen"],["Barfiks hazırlık","3 set × 5-10 sn rahat asılı kalma*","90 sn dinlen"]]},
{title:"2. Gün",type:"Kolay koşu",note:"Konuşabilecek kadar rahat tempoda. Gerekirse koşu-yürüyüş şeklinde tamamla.",tasks:[["Koşu / koş-yürü","20 dakika rahat tempo","Süre boyunca rahat nefes"]]},
{title:"3. Gün",type:"Kuvvet B",note:"Teknik öncelikli, acele etme.",tasks:[["Şınav","3 set × 6 tekrar","90 sn dinlen"],["Mekik","3 set × 6 tekrar","90 sn dinlen"],["Barfiks hazırlık","3 set × 5-10 sn rahat asılı kalma*","90 sn dinlen"]]},
{title:"4. Gün",type:"Toparlanma",note:"Bugün zorlayıcı set yok. Rahat yürüyüş ve hafif hareketlilik yeterli.",tasks:[["Rahat yürüyüş","15-25 dakika","Konuşma temposu"],["Hafif hareketlilik","5 dakika","Ağrısız, zorlamadan"]]},
{title:"5. Gün",type:"Koşu çalışması",note:"Isınma ve soğuma ekle. Hızlı bölümler kontrollü; sprint değil.",tasks:[["Isınma","5 dakika rahat yürüyüş/koşu",""],["Kontrollü tempo","6 tur: 1 dk canlı + 2 dk çok rahat","Her turda kontrolü koru"],["Soğuma","5 dakika rahat yürüyüş",""]]},
{title:"6. Gün",type:"Kuvvet A",note:"1. günkü hareketleri uygula. Form bozulursa seti bitir.",tasks:[["Şınav","3 set × 6 tekrar","90 sn dinlen"],["Mekik","3 set × 6 tekrar","90 sn dinlen"],["Barfiks hazırlık","3 set × 5-10 sn rahat asılı kalma*","90 sn dinlen"]]},
{title:"7. Gün",type:"Kolay koşu",note:"Rahat ve kısa tut. Yorgunsan yürüyüşle değiştir.",tasks:[["Koşu / koş-yürü","15-20 dakika rahat tempo","Konuşabilecek tempo"]]}
];
let day=Number(localStorage.getItem("day")||0), checks={}; let remain=90, interval=null;
const $=id=>document.getElementById(id);
function render(){let d=plan[day%7];$("dayTitle").textContent=d.title;$("dayType").textContent=d.type;$("dayNote").textContent=d.note;
$("tasks").innerHTML=d.tasks.map((t,i)=>`<label class="task"><input type="checkbox" data-i="${i}" ${checks[day+"-"+i]?"checked":""}><span><strong>${t[0]}</strong><small>${t[1]} ${t[2]?" · "+t[2]:""}</small></span></label>`).join("");
let done=d.tasks.filter((_,i)=>checks[day+"-"+i]).length;$("progressBar").style.width=(done/d.tasks.length*100)+"%";$("progressText").textContent=`${done}/${d.tasks.length} bölüm tamamlandı`;
document.querySelectorAll("#tasks input").forEach(el=>el.addEventListener("change",e=>{checks[day+"-"+e.target.dataset.i]=e.target.checked;localStorage.setItem("checks",JSON.stringify(checks));render()}));
localStorage.setItem("day",day)}
$("prevDay").onclick=()=>{day=Math.max(0,day-1);render()};$("nextDay").onclick=()=>{day++;render()};
function showTimer(){$("timer").textContent=String(Math.floor(remain/60)).padStart(2,"0")+":"+String(remain%60).padStart(2,"0")}
$("startTimer").onclick=()=>{if(interval)return;interval=setInterval(()=>{if(remain>0){remain--;showTimer()}else{clearInterval(interval);interval=null;$("timerLabel").textContent="Dinlenme bitti — sonraki sete geçebilirsin."}},1000)};
$("pauseTimer").onclick=()=>{clearInterval(interval);interval=null};$("resetTimer").onclick=()=>{clearInterval(interval);interval=null;remain=90;$("timerLabel").textContent="Set arası dinlenme";showTimer()};
function loadHistory(){let logs=JSON.parse(localStorage.getItem("logs")||"[]");$("history").innerHTML=logs.slice().reverse().map(x=>`<div class="entry"><b>${x.date}</b> · Şınav ${x.p} · Mekik ${x.s} · Barfiks ${x.b} · 3000 m ${x.r||"—"}<br>${x.note||""}</div>`).join("")}
$("saveLog").onclick=()=>{let logs=JSON.parse(localStorage.getItem("logs")||"[]");let date=new Date().toLocaleDateString("tr-TR");logs.push({date,p:$("logPush").value||0,s:$("logSit").value||0,b:$("logPull").value||0,r:$("logRun").value,note:$("logNote").value});localStorage.setItem("logs",JSON.stringify(logs));$("saveStatus").textContent="Kayıt bu cihazda saklandı.";loadHistory()};
checks=JSON.parse(localStorage.getItem("checks")||"{}");render();showTimer();loadHistory();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
let deferred;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("install").hidden=false});$("install").onclick=async()=>{if(deferred){deferred.prompt();deferred=null;$("install").hidden=true}};
