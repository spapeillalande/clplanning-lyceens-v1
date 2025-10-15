"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
const ACTIVITIES = [
  { key: "Sommeil", color: "#64748b" },
  { key: "Cours", color: "#2563eb" },
  { key: "Trajet", color: "#a855f7" },
  { key: "Repas", color: "#f59e0b" },
  { key: "Extrascolaire", color: "#10b981" },
  { key: "Temps libre", color: "#06b6d4" },
  { key: "Autre", color: "#ef4444" },
] as const;
type WeekKey = "A" | "B"; type DayKey = "Lun"|"Mar"|"Mer"|"Jeu"|"Ven"|"Sam"|"Dim";
type ActivityKey = (typeof ACTIVITIES)[number]["key"];
const DAYS: DayKey[] = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const START_MIN=6*60, END_MIN=23*60, STEP=15;
const ROWS = Array.from({length:(END_MIN-START_MIN)/STEP+1},(_,i)=> START_MIN+i*STEP);
const minutesToLabel = (m:number)=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const findColor = (k?:ActivityKey|null)=> k? ACTIVITIES.find(a=>a.key===k)?.color: undefined;
const KW = { cours:["cours","class","lesson","ecole","lycee","collège","college","math","français","anglais","histoire","svt","physique","chimie","philo"],
trajet:["trajet","bus","car","metro","métro","rer","train","transport","velo","vélo","marche"],
repas:["repas","dejeuner","déjeuner","diner","dîner","lunch","breakfast","petit-dej","petit déjeuner","goûter","gouter"],
sommeil:["sommeil","sleep","nuit","coucher","dodo"],
extras:["sport","club","musique","danse","theatre","théâtre","piano","foot","tennis","judo","natation","scout","asso","atelier"],};

const Button = ({children,onClick,className="",title}:{children:any;onClick:()=>void;className?:string;title?:string})=>(
  <button type="button" title={title} onClick={onClick}
    className={`px-3 py-1.5 rounded border transition bg-white text-slate-800 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 ${className}`}>{children}</button>
);
const Card = ({children,className=""}:{children:any;className?:string})=>(
  <div className={`border rounded-xl shadow-sm p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${className}`}>{children}</div>
);
const CardTitle = ({children}:{children:any})=><h2 className="text-lg font-semibold mb-2">{children}</h2>;

export default function Planning(){
  const [student,setStudent]=useState(""); const [coach,setCoach]=useState(""); const [school,setSchool]=useState("");
  const defaultMonday=(()=>{const d=new Date(); const day=d.getDay(); const diff=(day+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-diff); return d.toISOString().slice(0,10)})();
  const [mondayISO,setMondayISO]=useState(defaultMonday);
  const [week,setWeek]=useState<WeekKey>("A"); const [sameWeek,setSameWeek]=useState(true); const [selectedActivity,setSelectedActivity]=useState<ActivityKey>("Cours");
  const [theme,setTheme]=useState<"light"|"dark">("light");
  const [planning,setPlanning]=useState<Record<WeekKey, Partial<Record<DayKey, Record<number, ActivityKey|null>>>> >({A:{},B:{}});
  const STORAGE_KEY="planning-hebdo-v5";
  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY); if(raw){const s=JSON.parse(raw); s?.planning && setPlanning(s.planning); s?.sameWeek!==undefined && setSameWeek(s.sameWeek); s?.theme && setTheme(s.theme); s?.student && setStudent(s.student); s?.coach && setCoach(s.coach); s?.school && setSchool(s.school); s?.mondayISO && setMondayISO(s.mondayISO);}}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY, JSON.stringify({planning,sameWeek,theme,student,coach,school,mondayISO}))}catch{}},[planning,sameWeek,theme,student,coach,school,mondayISO]);
  const printPage=()=>window.print();
  const exportPDF=()=>{const el=document.getElementById("planning-export"); if(!el)return; const opt={margin:0.5, filename:`planning-${student||"eleve"}-${week}.pdf`, image:{type:"jpeg",quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:"in",format:"a4",orientation:"landscape"}}; // @ts-ignore
    html2pdf().set(opt).from(el).save();};
  const getMondayDate=()=>{const d=new Date(mondayISO); d.setHours(0,0,0,0); return d;};
  const dateFor=(wk:WeekKey,day:DayKey,minute:number)=>{const monday=getMondayDate(); const di=DAYS.indexOf(day); const base=new Date(monday); base.setDate(monday.getDate()+di+(wk==="B"?7:0)); base.setHours(Math.floor(minute/60), minute%60,0,0); return base;};
  const toICSDate=(d:Date)=> d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const exportICS=()=>{let ics="BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n"; const calName= school?`Planning ${student||"Élève"} – ${school}`:`Planning ${student||"Élève"}`; ics+=`X-WR-CALNAME:${calName}\nPRODID:-//CLPlanningLyceens//FR\n`;
    (["A","B"] as WeekKey[]).forEach((w)=>{ for(const day of DAYS){ const slots=planning[w]?.[day]||{}; let cur:ActivityKey|null=null; let start:number|null=null;
      for(const minute of ROWS.concat([END_MIN])){ const a=(minute===END_MIN)?null:(slots[minute]||null); if(a!==cur){ if(cur && start!==null){ const dStart=dateFor(w,day,start); const dEnd=dateFor(w,day,minute); const uid=`${dStart.getTime()}-${cur.replace(/\s+/g,"")}@clplanning-lyceens-v1`; const descr=[w==="A"?"Semaine A":"Semaine B", student?`Élève: ${student}`:"", coach?`Formateur: ${coach}`:"", school?`Établissement: ${school}`:""].filter(Boolean).join(" | ");
        ics+="BEGIN:VEVENT\n"; ics+=`UID:${uid}\n`; ics+=`SUMMARY:${cur}\n`; ics+=`DESCRIPTION:${descr}\n`; ics+=`DTSTART:${toICSDate(dStart)}\n`; ics+=`DTEND:${toICSDate(dEnd)}\n`; ics+="END:VEVENT\n"; } cur=a; start=a? minute:null; } } } });
    ics+="END:VCALENDAR"; const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`planning-${student||"eleve"}-A+B.ics`; a.click(); URL.revokeObjectURL(url);
  };
  const painting=useRef(false); const dragMode=useRef<"set"|"clear">("set");
  const applyToSlot=(w:WeekKey,d:DayKey,minute:number,mode:"set"|"clear")=>{
    setPlanning(prev=>{const weekData={...(prev[w]||{})}; const dayData={...(weekData[d]||{})}; dayData[minute]= mode==="set"? selectedActivity: null; weekData[d]=dayData; const next={...prev,[w]:weekData}; if(sameWeek && w==="A") next.B=JSON.parse(JSON.stringify(weekData)); return next;});
  };
  const onMouseDownCell=(d:DayKey,m:number)=>{painting.current=true; const cur=planning[week]?.[d]?.[m]??null; dragMode.current= cur===selectedActivity? "clear":"set"; applyToSlot(week,d,m,dragMode.current);};
  const onMouseEnterCell=(d:DayKey,m:number)=>{if(painting.current) applyToSlot(week,d,m,dragMode.current);};
  useEffect(()=>{const stop=()=>painting.current=false; window.addEventListener("mouseup",stop); return()=>window.removeEventListener("mouseup",stop)},[]);
  const clearDay=(w:WeekKey,d:DayKey)=> setPlanning(p=>({...p,[w]:{...(p[w]||{}),[d]:{}}}));
  const clearWeek=(w:WeekKey)=> setPlanning(p=>({...p,[w]:{}}));
  const totalsForWeek=(w:WeekKey)=>{const counts:Record<ActivityKey,number>={Sommeil:0,Cours:0,Trajet:0,Repas:0,Extrascolaire:0,"Temps libre":0,Autre:0}; for(const d of DAYS){ const slots=planning[w]?.[d]||{}; for(const m in slots){ const act=(slots as any)[m] as ActivityKey|null; if(act) counts[act]+=STEP; }} return counts;};
  const percentFrom=(counts:Record<ActivityKey,number>)=>{const total=Object.values(counts).reduce((a,b)=>a+b,0); const p=(k:ActivityKey)=> total? Math.round((counts[k]/total)*100):0; return {total,p};};
  const avgSleepHFor=(w:WeekKey)=>{let sum=0; for(const d of DAYS){const slots=planning[w]?.[d]||{}; for(const m in slots) if((slots as any)[m]==="Sommeil") sum+=STEP;} return (sum/DAYS.length)/60;};
  const busiestDayFor=(w:WeekKey)=>{let max=-1,label:DayKey="Lun"; for(const d of DAYS){ const slots=planning[w]?.[d]||{}; let load=0; for(const m in slots){const a=(slots as any)[m]; if(a && a!=="Sommeil" && a!=="Temps libre") load+=STEP;} if(load>max){max=load; label=d as DayKey;}} return {day:label, mins:max};};
  type Slot={week:WeekKey; day:DayKey; start:number; end:number; duration:number};
  const suggestedFor=(w:WeekKey)=>{const res:Slot[]=[]; for(const d of DAYS){ const slots=planning[w]?.[d]||{}; let start:number|null=null; for(const m of ROWS.concat([END_MIN])){ const a=(m===END_MIN)?null:((slots as any)[m]||null); const isGood= a==="Temps libre" || a===null; if(isGood && start===null) start=m; if((!isGood||m===END_MIN)&&start!==null){const end=m; const duration=end-start; if(duration>=45) res.push({week:w,day:d,start,end,duration}); start=null;}}} return res.sort((a,b)=> b.duration-a.duration || a.start-b.start).slice(0,8);};
  const current=planning[week]; const totalsMins=useMemo(()=>totalsForWeek(week),[planning,week]); const percent=useMemo(()=>percentFrom(totalsMins),[totalsMins]);
  const exportReport2PDF=()=>{const el=document.getElementById("report2-export"); if(!el)return; const opt={margin:0.5, filename:`rapport-2sem-${student||"eleve"}.pdf`, image:{type:"jpeg",quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:"in",format:"a4",orientation:"portrait"}}; // @ts-ignore
    html2pdf().set(opt).from(el).save();};
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const parseICSDate=(raw:string)=>{try{if(!raw)return null; const s=raw.trim(); if(s.endsWith("Z")) return new Date(s); const y=+s.slice(0,4), m=+s.slice(4,6)-1, d=+s.slice(8,10) || +s.slice(6,8), hh=+(s.slice(9,11)||"0"), mm=+(s.slice(11,13)||"0"); return new Date(y,m,d,hh,mm,0);}catch{return null}};
  const summaryToCategory=(summary:string):ActivityKey|null=>{const s=(summary||"").toLowerCase(); const has=(arr:string[])=>arr.some(k=>s.includes(k)); if(has(KW.sommeil))return "Sommeil"; if(has(KW.repas))return "Repas"; if(has(KW.trajet))return "Trajet"; if(has(KW.cours))return "Cours"; if(has(KW.extras))return "Extrascolaire"; return null;};
  const roundToQuarter=(date:Date)=>{const d=new Date(date); const rounded=Math.round(d.getMinutes()/15)*15; d.setMinutes(rounded,0,0); return d;};
  const importICS= async(file:File)=>{const text=await file.text(); const events=text.split("BEGIN:VEVENT").slice(1).map(b=>"BEGIN:VEVENT"+b); let imported=0; const mondayA=getMondayDate(); const sundayB=new Date(mondayA); sundayB.setDate(sundayB.getDate()+13); sundayB.setHours(23,59,59,999); const newPlanning=structuredClone(planning) as typeof planning;
    for(const ev of events){ const summaryMatch=ev.match(/SUMMARY:(.*)/); const dtStartMatch=ev.match(/DTSTART(?:;[^:]*)?:(.*)/); const dtEndMatch=ev.match(/DTEND(?:;[^:]*)?:(.*)/);
      const summary=summaryMatch?summaryMatch[1].trim():""; const startRaw=dtStartMatch?dtStartMatch[1].trim():""; const endRaw=dtEndMatch?dtEndMatch[1].trim():""; const cat=summaryToCategory(summary); if(!cat) continue; const start=parseICSDate(startRaw); const end=parseICSDate(endRaw); if(!start||!end) continue; if(end<mondayA||start>sundayB) continue; const sRounded=roundToQuarter(start); const eRounded=roundToQuarter(end); if(eRounded<=sRounded) continue;
      const weekBStart=new Date(mondayA); weekBStart.setDate(weekBStart.getDate()+7); const weekAEnd=new Date(weekBStart); weekAEnd.setDate(weekAEnd.getDate()-1); weekAEnd.setHours(23,59,59,999); const wk:WeekKey= sRounded<=weekAEnd? "A":"B";
      const dayIdx=((sRounded.getDay()+6)%7) as number; const dayKey=DAYS[dayIdx]; const startMin=sRounded.getHours()*60+sRounded.getMinutes(); const endMin=eRounded.getHours()*60+eRounded.getMinutes(); const clampedStart=Math.max(startMin, START_MIN); const clampedEnd=Math.min(endMin, END_MIN); if(clampedEnd<=clampedStart) continue;
      const dayMap=newPlanning[wk][dayKey]||{}; for(let m=clampedStart; m<clampedEnd; m+=STEP){ dayMap[m]=cat; } newPlanning[wk][dayKey]=dayMap; imported++; }
    setPlanning(newPlanning); alert(`Import .ics terminé : ${imported} événement(s) intégré(s).`);
  };
  useEffect(()=>{document.documentElement.style.colorScheme=theme;},[theme]);
  return (<div className={`${theme==="dark"?"bg-slate-950 text-slate-100":"bg-slate-50 text-slate-900"} min-h-screen p-4 md:p-8 print:p-0`}>
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center print:hidden">
        <h1 className="text-2xl md:text-3xl font-semibold">CL Planning Lycéens</h1>
        <div className="flex gap-2">
          <Button onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?"☀️ Clair":"🌙 Sombre"}</Button>
          <Button onClick={printPage}>🖨️ Imprimer</Button>
          <Button onClick={exportPDF}>💾 PDF</Button>
          <Button onClick={exportICS}>📅 .ICS A+B</Button>
          <Button onClick={()=>document.getElementById("icsfile")?.click()}>📂 Import .ICS</Button>
          <input id="icsfile" type="file" accept=".ics,text/calendar" style={{display:"none"}} onChange={(e)=>{const f=(e.target as HTMLInputElement).files?.[0]; if(f) importICS(f as any); (e.target as HTMLInputElement).value="";}}/>
          <Button onClick={exportReport2PDF}>📋 Rapport 2 semaines</Button>
        </div>
      </div>
      <Card className="print:hidden">
        <CardTitle>Informations</CardTitle>
        <div className="grid md:grid-cols-4 gap-3">
          <label className="text-sm">Élève
            <input value={student} onChange={e=>setStudent(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" placeholder="Nom de l'élève"/>
          </label>
          <label className="text-sm">Formateur / Accompagnant
            <input value={coach} onChange={e=>setCoach(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" placeholder="Votre nom"/>
          </label>
          <label className="text-sm">Établissement
            <input value={school} onChange={e=>setSchool(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" placeholder="Lycée / Collège"/>
          </label>
          <label className="text-sm">Lundi de référence
            <input type="date" value={mondayISO} onChange={e=>setMondayISO(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"/>
          </label>
        </div>
      </Card>
      <Card className="print:hidden">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2"><span className="text-sm">Semaine :</span>
            <select className="border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" value={week} onChange={(e)=>setWeek(e.target.value as WeekKey)}>
              <option value="A">Semaine A</option><option value="B">Semaine B</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="sameWeek" type="checkbox" checked={sameWeek} onChange={(e)=>{const c=e.target.checked; setSameWeek(c); if(c) setPlanning(p=>({...p,B:JSON.parse(JSON.stringify(p.A))}));}}/>
            <label htmlFor="sameWeek" className="text-sm">Semaine identique A/B</label>
            {!sameWeek && <Button onClick={()=>setPlanning(p=>({...p,B:JSON.parse(JSON.stringify(p.A))}))}>Copier A → B</Button>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Activité :</span>
            <select className="border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" value={selectedActivity} onChange={(e)=>setSelectedActivity(e.target.value as ActivityKey)}>
              {ACTIVITIES.map(a=><option key={a.key} value={a.key}>{a.key}</option>)}
            </select>
            <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{background:findColor(selectedActivity)}}/>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm">Effacer :</span>
            <select className="border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onChange={(e)=>{const v=e.target.value as DayKey|"ALL"|""; if(v==="ALL") setPlanning(p=>({...p,[week]:{}})); else if(v) setPlanning(p=>({...p,[week]:{...(p[week]||{}), [v]:{}}})); (e.target as HTMLSelectElement).value="";}} defaultValue="">
              <option value="" disabled>Choisir…</option>
              <option value="ALL">Toute la semaine</option>
              {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Astuce : clique et <strong>glisse</strong> pour peindre — <strong>clic droit</strong> pour effacer.</p>
      </Card>
      <div id="planning-export">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Vue d’ensemble — {school?`${school} • `:""}{student||"Élève"} — Semaine {week}</CardTitle>
            <div className="text-sm text-slate-600 dark:text-slate-300">Référence : lundi {new Date(mondayISO).toLocaleDateString()}</div>
          </div>
          <div className="overflow-auto border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="min-w-[900px] border-collapse">
              <thead className="sticky top-0"><tr>
                <th className="border text-left text-xs px-2 py-1 w-20 bg-slate-100 dark:bg-slate-800">Heure</th>
                {DAYS.map(d=>(<th key={d} className="border text-center text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800">{d}</th>))}
              </tr></thead>
              <tbody>
                {ROWS.map((m,i)=>(<tr key={m}>
                  <td className="border text-xs text-right pr-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{minutesToLabel(m)}</td>
                  {DAYS.map(day=>{const act= (planning[week]?.[day]||{})[m] ?? null; const color=findColor(act);
                    return (<td key={day+String(m)} onMouseDown={()=>{painting.current=true; const cur=(planning[week]?.[day]||{})[m]??null; dragMode.current= cur===selectedActivity? "clear":"set"; applyToSlot(week,day,m,dragMode.current);}}
                      onMouseEnter={()=>{if(painting.current) applyToSlot(week,day,m,dragMode.current);}}
                      onContextMenu={(e)=>{e.preventDefault(); applyToSlot(week,day,m,"clear");}}
                      className={`border cursor-crosshair transition ${i%2?"bg-white dark:bg-slate-900":"bg-slate-50 dark:bg-slate-950"} hover:ring-2 hover:ring-blue-400`} style={{background:color}} title={act||"Ajouter"} />);
                  })}
                </tr>))}
              </tbody>
            </table>
          </div>
        </Card>
        <TotalsCard title={`Totaux (semaine ${week})`} counts={totalsMins} />
      </div>
      <div id="report2-export"><TwoWeekReport student={student} coach={coach} school={school} mondayISO={mondayISO} planning={planning} helpers={{minutesToLabel}}/></div>
    </div>
  </div>);
}
