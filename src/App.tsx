import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3,
  Bell, Bug, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp,
  Clock3, Download, FileText, Filter, Gauge, LayoutDashboard, ListTodo,
  Menu, MessageSquare, MoreHorizontal, Plus, Search, Settings, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, Ticket as TicketIcon, Timer, TrendingUp,
  UserRound, X, Zap
} from "lucide-react";
import { seedTickets } from "./data";
import { Bug as BugType, Stage, Ticket } from "./types";

const stages: Stage[] = ["Discussion", "Development", "QA", "Deployment", "Sign-off"];
const stageShort: Record<Stage,string> = {Discussion:"Discussion",Development:"Development",QA:"QA",Deployment:"Deployment", "Sign-off":"Sign-off"};
const money = (n:number) => n.toFixed(0);
const dateLabel = (s:string) => new Date(s).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
const timeLabel = (s:string) => new Date(s).toLocaleString(undefined,{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const uid = () => Math.random().toString(36).slice(2,9);
const bugPenalty = (b:BugType[]) => b.filter(x=>x.attribution==="Development" && x.status!=="Accepted").reduce((sum,b)=>sum+(b.severity==="Critical"?30:b.severity==="Minor"?10:3),0);
const qualityScore = (t:Ticket) => Math.max(0,100-bugPenalty(t.bugs));
const etaScore = (t:Ticket) => {
  const due = new Date(t.eta).getTime();
  const completed = t.stage==="Sign-off" ? new Date(t.comments.find(c=>c.title.includes("Sign-off") || c.title.includes("Sign-off"))?.at || Date.now()).getTime() : Date.now();
  if (t.stage!=="Sign-off") return due < Date.now() ? 40 : 100;
  if (completed <= due) return 100;
  const planned = Math.max(1,t.estimateHours*3600000);
  const delayPct = ((completed-due)/planned)*100;
  return delayPct<=10?90:delayPct<=20?75:delayPct<=30?60:40;
};
const scoreOf = (t:Ticket) => Math.round(etaScore(t)*.4 + qualityScore(t)*.6);
const isComplete = (t:Ticket) => t.stage==="Sign-off";
const sampleChecklist = () => [
  "QA approval recorded","No open critical defects","Minor defects resolved or accepted","Code review completed",
  "Database migration reviewed","Environment configuration verified","API compatibility checked",
  "Smoke test plan prepared","Rollback plan documented","Deployment notes completed"
].map((label,i)=>({id:`c${i+1}`,label,required:true,checked:false}));

type Page = "Overview"|"Daily"|"Weekly"|"Monthly"|"Tickets"|"QA & Bugs"|"Reports"|"Settings";
const navItems:{name:Page;icon:any;group:string}[] = [
  {name:"Overview",icon:LayoutDashboard,group:"WORKSPACE"},
  {name:"Daily",icon:CalendarDays,group:"PERFORMANCE"},
  {name:"Weekly",icon:BarChart3,group:"PERFORMANCE"},
  {name:"Monthly",icon:TrendingUp,group:"PERFORMANCE"},
  {name:"Tickets",icon:TicketIcon,group:"MANAGE"},
  {name:"QA & Bugs",icon:Bug,group:"MANAGE"},
  {name:"Reports",icon:FileText,group:"INSIGHTS"},
  {name:"Settings",icon:Settings,group:"SYSTEM"}
];

function App(){
  const [tickets,setTickets] = useState<Ticket[]>(()=>{
    const saved=localStorage.getItem("devtrack-tickets-v1");
    return saved?JSON.parse(saved):seedTickets;
  });
  const [page,setPage] = useState<Page>("Overview");
  const [selected,setSelected] = useState<string|null>(null);
  const [query,setQuery] = useState("");
  const [stageFilter,setStageFilter] = useState("All stages");
  const [showCreate,setShowCreate] = useState(false);
  const [showTransition,setShowTransition] = useState(false);
  const [transitionTicket,setTransitionTicket] = useState<string|null>(null);
  const [comment,setComment] = useState("");
  const [showBug,setShowBug] = useState(false);
  const [bugTicket,setBugTicket] = useState<string|null>(null);
  const [showChecklist,setShowChecklist] = useState(false);
  const [toast,setToast] = useState("");
  const [range,setRange] = useState("This month");
  const [mobileOpen,setMobileOpen] = useState(false);
  const [form,setForm] = useState({title:"",description:"",project:"ShipGlobal",module:"",priority:"Medium",eta:"",estimateHours:"8",complexity:"Medium",assignee:"Suyogya Mishra",qaOwner:"Ananya Sharma",criteria:""});
  const [bugForm,setBugForm] = useState({title:"",severity:"Minor",attribution:"Development",notes:""});
  const [deployNotes,setDeployNotes] = useState("");
  const [reportFilter,setReportFilter] = useState("All projects");

  useEffect(()=>{localStorage.setItem("devtrack-tickets-v1",JSON.stringify(tickets));},[tickets]);
  useEffect(()=>{if(toast){const id=setTimeout(()=>setToast(""),2800);return ()=>clearTimeout(id);}},[toast]);

  const current = tickets.find(t=>t.id===selected) || null;
  const filtered = useMemo(()=>tickets.filter(t=>(stageFilter==="All stages"||t.stage===stageFilter) && (`${t.id} ${t.title} ${t.project} ${t.module}`.toLowerCase().includes(query.toLowerCase()))),[tickets,stageFilter,query]);
  const complete = tickets.filter(isComplete);
  const average = complete.length?Math.round(complete.reduce((s,t)=>s+scoreOf(t),0)/complete.length):0;
  const breaches = tickets.filter(t=>!isComplete(t)&&new Date(t.eta).getTime()<Date.now()).length;
  const openBugs = tickets.flatMap(t=>t.bugs).filter(b=>b.status==="Open"||b.status==="In Progress");
  const criticalBugs = openBugs.filter(b=>b.severity==="Critical").length;
  const setTicket = (id:string, patch:Partial<Ticket>)=>setTickets(prev=>prev.map(t=>t.id===id?{...t,...patch}:t));
  const notify=(s:string)=>setToast(s);

  const createTicket=()=>{
    if(!form.title.trim()||!form.description.trim()||!form.eta){notify("Please complete title, description and ETA.");return;}
    const id=`DEV-${1050+tickets.length}`;
    const now=new Date().toISOString();
    const t:Ticket={id,title:form.title,description:form.description,project:form.project,module:form.module||"General",assignee:form.assignee,qaOwner:form.qaOwner,priority:form.priority as Ticket["priority"],stage:"Discussion",createdAt:now,eta:new Date(form.eta).toISOString(),originalEta:new Date(form.eta).toISOString(),estimateHours:Number(form.estimateHours)||8,complexity:form.complexity as Ticket["complexity"],acceptanceCriteria:form.criteria.split("\n").map(x=>x.trim()).filter(Boolean),blockedHours:0,comments:[{id:uid(),at:now,actor:"Suyogya Mishra",title:"Ticket created",detail:"Ticket created from the tracker."}],bugs:[],checklist:sampleChecklist(),deploymentNotes:"",deploymentEnvironment:"Staging"};
    setTickets(p=>[t,...p]);setShowCreate(false);setForm({title:"",description:"",project:"ShipGlobal",module:"",priority:"Medium",eta:"",estimateHours:"8",complexity:"Medium",assignee:"Suyogya Mishra",qaOwner:"Ananya Sharma",criteria:""});notify(`${id} created successfully.`);
  };

  const openTransition=(id:string)=>{setTransitionTicket(id);setComment("");setShowTransition(true);};
  const moveTicket=()=>{
    if(!transitionTicket||!comment.trim()){notify("A transition comment is required.");return;}
    const t=tickets.find(x=>x.id===transitionTicket);if(!t)return;
    const next=stages[stages.indexOf(t.stage)+1];
    if(!next){notify("Ticket is already at final stage.");return;}
    if(next==="Deployment"){
      const missing=t.checklist.filter(c=>c.required&&!c.checked);
      const critical=t.bugs.some(b=>b.severity==="Critical"&&b.status!=="Resolved"&&b.status!=="Accepted");
      if(missing.length){notify(`${missing.length} mandatory checklist item(s) remain.`);return;}
      if(critical){notify("Resolve or formally accept all critical bugs before deployment.");return;}
      if(!t.deploymentNotes.trim()){notify("Deployment notes are required before deployment.");return;}
    }
    if(next==="Sign-off"&&!t.deploymentNotes.trim()){notify("Deployment notes are required before sign-off.");return;}
    const now=new Date().toISOString();
    setTicket(t.id,{stage:next,comments:[...t.comments,{id:uid(),at:now,actor:"Suyogya Mishra",title:`Moved to ${next}`,detail:comment.trim()}]});
    setShowTransition(false);setTransitionTicket(null);notify(`${t.id} moved to ${next}.`);
  };

  const addBug=()=>{
    if(!bugTicket||!bugForm.title.trim()){notify("Bug title is required.");return;}
    const t=tickets.find(x=>x.id===bugTicket);if(!t)return;
    const bug:BugType={id:`BUG-${220+t.bugs.length+Math.floor(Math.random()*20)}`,title:bugForm.title,severity:bugForm.severity as BugType["severity"],status:"Open",attribution:bugForm.attribution as BugType["attribution"],createdAt:new Date().toISOString(),notes:bugForm.notes};
    setTicket(t.id,{bugs:[...t.bugs,bug]});setShowBug(false);setBugForm({title:"",severity:"Minor",attribution:"Development",notes:""});notify(`${bug.id} added.`);
  };

  const toggleChecklist=(ticketId:string,itemId:string)=>{
    const t=tickets.find(x=>x.id===ticketId);if(!t)return;
    setTicket(ticketId,{checklist:t.checklist.map(c=>c.id===itemId?{...c,checked:!c.checked}:c)});
  };

  const updateBugStatus=(ticketId:string,bugId:string,status:BugType["status"])=>{
    const t=tickets.find(x=>x.id===ticketId);if(!t)return;
    setTicket(ticketId,{bugs:t.bugs.map(b=>b.id===bugId?{...b,status}:b)});
    notify(`Bug updated to ${status}.`);
  };

  const exportCsv=()=>{
    const rows=[["Ticket ID","Title","Project","Stage","Priority","ETA","Assignee","Complexity","ETA score","Quality score","Final score","Development bug penalty"],...tickets.map(t=>[t.id,t.title,t.project,t.stage,t.priority,t.eta,t.assignee,t.complexity,etaScore(t),qualityScore(t),scoreOf(t),bugPenalty(t.bugs)])];
    const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="devtrack-performance-report.csv";a.click();URL.revokeObjectURL(a.href);notify("CSV report exported.");
  };

  const pageTitle=page==="Overview"?"Good evening, Suyogya":`${page} dashboard`;
  const subtitle=page==="Overview"?"Here’s your engineering work at a glance. Keep delivery and quality moving together.":`Track your ${page.toLowerCase()} performance, ticket flow and quality trends.`;
  const contentPage=()=>{
    if(page==="Tickets")return <TicketsPage tickets={filtered} query={query} setQuery={setQuery} stageFilter={stageFilter} setStageFilter={setStageFilter} onCreate={()=>setShowCreate(true)} onSelect={setSelected} onTransition={openTransition}/>;
    if(page==="QA & Bugs")return <BugsPage tickets={tickets} onAdd={(id)=>{setBugTicket(id);setShowBug(true);}} onStatus={updateBugStatus} />;
    if(page==="Reports")return <ReportsPage tickets={tickets} onExport={exportCsv} filter={reportFilter} setFilter={setReportFilter}/>;
    if(page==="Settings")return <SettingsPage onReset={()=>{setTickets(seedTickets);notify("Demo data restored.");}} onExport={exportCsv}/>;
    return <DashboardPage kind={page} tickets={tickets} average={average} breaches={breaches} openBugs={openBugs.length} criticalBugs={criticalBugs} onSelect={setSelected} onGoTickets={()=>setPage("Tickets")} />;
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark"><Gauge size={20}/></div><div><strong>DevTrack</strong><small>ENGINEERING INSIGHTS</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">SG</div><div><b>ShipGlobal Workspace</b><small>Personal workspace</small></div><ChevronDown size={15}/></div>
      {["WORKSPACE","PERFORMANCE","MANAGE","INSIGHTS","SYSTEM"].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{navItems.filter(n=>n.group===group).map(n=><button key={n.name} className={`nav-item ${page===n.name?"active":""}`} onClick={()=>{setPage(n.name);setMobileOpen(false);setSelected(null);}}><n.icon size={17}/><span>{n.name==="Daily"?"Daily dashboard":n.name==="Weekly"?"Weekly dashboard":n.name==="Monthly"?"Monthly dashboard":n.name}</span>{n.name==="Tickets"&&<em>{tickets.length}</em>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><b>Need a hand?</b><p>Explore the demo data and workflow to understand the tracker.</p><button onClick={()=>notify("Tip: create a ticket, add a QA bug and test the stage workflow.")}>View quick tip <ArrowRight size={13}/></button></div><div className="user-mini"><div className="avatar">SM</div><div><b>Suyogya Mishra</b><small>Developer · Admin demo</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumbs">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><div className="search-global"><Search size={15}/><input placeholder="Search tickets..." value={query} onChange={e=>{setQuery(e.target.value);setPage("Tickets");}}/><kbd>⌘ K</kbd></div><button className="icon-btn notification" onClick={()=>notify(`${openBugs.length} open QA defects · ${breaches} overdue tickets`)}><Bell size={18}/><i/></button><div className="top-avatar">SM</div></div></header>
      <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/>{page==="Overview"?"PERSONAL PERFORMANCE SPACE":"PERFORMANCE WORKSPACE"}</div><h1>{pageTitle}</h1><p>{subtitle}</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><Download size={15}/> Export</button><button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Plus size={16}/> New ticket</button></div></div>
      {contentPage()}
      <footer className="footer"><span>DevTrack · Demo environment</span><span>Scoring policy v1.0 <i/> Data saved in this browser</span></footer></div>
    </main>

    {current&&<TicketDrawer ticket={current} onClose={()=>setSelected(null)} onTransition={openTransition} onBug={()=>{setBugTicket(current.id);setShowBug(true);}} onChecklist={()=>setShowChecklist(true)} onToggleChecklist={toggleChecklist} onNotes={(v)=>setTicket(current.id,{deploymentNotes:v})} onBugStatus={updateBugStatus}/>}
    {showCreate&&<Modal title="Create new ticket" subtitle="Add the requirement and agree on delivery expectations." onClose={()=>setShowCreate(false)}><div className="form-grid"><Field label="Ticket title" wide><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Add shipment validation endpoint"/></Field><Field label="Description" wide><textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the business problem, expected behavior and technical context."/></Field><Field label="Project"><select value={form.project} onChange={e=>setForm({...form,project:e.target.value})}><option>ShipGlobal</option><option>ShipWave</option><option>Billing App</option><option>Personal</option></select></Field><Field label="Module"><input value={form.module} onChange={e=>setForm({...form,module:e.target.value})} placeholder="e.g. Rate Engine"/></Field><Field label="Priority"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{["Low","Medium","High","Critical"].map(x=><option>{x}</option>)}</select></Field><Field label="Complexity"><select value={form.complexity} onChange={e=>setForm({...form,complexity:e.target.value})}>{["Small","Medium","Large","XL"].map(x=><option>{x}</option>)}</select></Field><Field label="ETA"><input type="datetime-local" value={form.eta} onChange={e=>setForm({...form,eta:e.target.value})}/></Field><Field label="Estimated effort (hours)"><input type="number" min="1" value={form.estimateHours} onChange={e=>setForm({...form,estimateHours:e.target.value})}/></Field><Field label="Developer"><input value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}/></Field><Field label="QA owner"><input value={form.qaOwner} onChange={e=>setForm({...form,qaOwner:e.target.value})}/></Field><Field label="Acceptance criteria (one per line)" wide><textarea rows={3} value={form.criteria} onChange={e=>setForm({...form,criteria:e.target.value})} placeholder={"Expected result 1\nExpected result 2"}/></Field></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={createTicket}>Create ticket <ArrowRight size={15}/></button></div></Modal>}
    {showTransition&&<Modal title="Move ticket to next stage" subtitle="A meaningful handover comment is mandatory." onClose={()=>setShowTransition(false)}><div className="transition-flow">{stages.map((s,i)=><div className={`flow-stage ${transitionTicket&&stages.indexOf(tickets.find(t=>t.id===transitionTicket)?.stage||"Discussion")>=i?"done":""}`} key={s}><span>{i+1}</span>{s}</div>)}</div><Field label="Transition comment" wide><textarea rows={4} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Summarize what changed, what was verified and what the next owner should do."/></Field><div className="info-box"><ShieldCheck size={17}/><span>Workflow checks are enforced. Moving into Deployment requires every mandatory checklist item, QA clearance and deployment notes.</span></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setShowTransition(false)}>Cancel</button><button className="btn btn-primary" onClick={moveTicket}>Confirm transition <ArrowRight size={15}/></button></div></Modal>}
    {showBug&&<Modal title="Log a QA defect" subtitle="Link the issue to its parent ticket and classify it accurately." onClose={()=>setShowBug(false)}><div className="form-grid"><Field label="Parent ticket" wide><select value={bugTicket||""} onChange={e=>setBugTicket(e.target.value)}>{tickets.map(t=><option value={t.id}>{t.id} · {t.title}</option>)}</select></Field><Field label="Bug title" wide><input value={bugForm.title} onChange={e=>setBugForm({...bugForm,title:e.target.value})} placeholder="Short, actionable defect title"/></Field><Field label="Severity"><select value={bugForm.severity} onChange={e=>setBugForm({...bugForm,severity:e.target.value})}><option>Critical</option><option>Minor</option><option>Cosmetic</option></select></Field><Field label="Attribution"><select value={bugForm.attribution} onChange={e=>setBugForm({...bugForm,attribution:e.target.value})}><option>Development</option><option>Requirement</option><option>Environment</option><option>Third-party</option></select></Field><Field label="Reproduction / notes" wide><textarea rows={3} value={bugForm.notes} onChange={e=>setBugForm({...bugForm,notes:e.target.value})} placeholder="Steps to reproduce, expected vs actual result and evidence."/></Field></div><div className="info-box"><Bug size={17}/><span>Only unique defects attributed to Development reduce the proposed quality score. Critical = 30, Minor = 10, Cosmetic = 3 points.</span></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setShowBug(false)}>Cancel</button><button className="btn btn-primary" onClick={addBug}>Save defect</button></div></Modal>}
    {showChecklist&&current&&<Modal title="Pre-deployment checklist" subtitle={`${current.id} · All required items must be checked before Deployment.`} onClose={()=>setShowChecklist(false)}><div className="checklist-progress"><div><b>{current.checklist.filter(c=>c.checked).length}/{current.checklist.length}</b><span>items completed</span></div><div className="progress"><i style={{width:`${current.checklist.filter(c=>c.checked).length/current.checklist.length*100}%`}}/></div></div><div className="checklist-list">{current.checklist.map(c=><label className="check-row" key={c.id}><input type="checkbox" checked={c.checked} onChange={()=>toggleChecklist(current.id,c.id)}/><span>{c.label}</span><small>{c.required?"Required":"Optional"}</small></label>)}</div><Field label="Deployment notes" wide><textarea rows={4} value={current.deploymentNotes} onChange={e=>setTicket(current.id,{deploymentNotes:e.target.value})} placeholder="Release summary, changed modules, migration/configuration, smoke test and rollback instructions."/></Field><div className="modal-actions"><button className="btn btn-primary" onClick={()=>setShowChecklist(false)}>Save checklist</button></div></Modal>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function Field({label,children,wide=false}:{label:string;children:ReactNode;wide?:boolean}){return <label className={`field ${wide?"wide":""}`}><span>{label}</span>{children}</label>}

function Modal({title,subtitle,children,onClose}:{title:string;subtitle:string;children:ReactNode;onClose:()=>void}){
  return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><div className="modal-body">{children}</div></div></div>;
}

function DashboardPage({kind,tickets,average,breaches,openBugs,criticalBugs,onSelect,onGoTickets}:{kind:Page;tickets:Ticket[];average:number;breaches:number;openBugs:number;criticalBugs:number;onSelect:(id:string)=>void;onGoTickets:()=>void}){
  const completed=tickets.filter(isComplete);
  const stageCounts=stages.map(s=>({stage:s,count:tickets.filter(t=>t.stage===s).length}));
  const today=new Date(); const weekAgo=new Date();weekAgo.setDate(today.getDate()-6);
  const weekLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const chartValues=kind==="Daily"?[48,64,55,78,72,88,82]:kind==="Weekly"?[62,76,68,91,83,72,88]:[58,66,72,69,81,86,90,84,92,87,94,89];
  const labels=kind==="Monthly"?["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"]:weekLabels;
  const active=tickets.filter(t=>!isComplete(t));
  const scoreAvg=completed.length?Math.round(completed.reduce((s,t)=>s+scoreOf(t),0)/completed.length):average;
  const totalBugs=tickets.flatMap(t=>t.bugs);
  const late=tickets.filter(t=>new Date(t.eta)<new Date()&&!isComplete(t));
  const chartTitle=kind==="Daily"?"Today’s activity":kind==="Weekly"?"Weekly performance trend":"Monthly performance trend";
  return <div className="content-stack">
    <div className="filter-row"><div className="period-switch">{["Today","This week","This month"].map((x)=><button className={(kind==="Daily"&&x==="Today"||kind==="Weekly"&&x==="This week"||kind==="Monthly"&&x==="This month")?"selected":""} key={x}>{x}</button>)}</div><div className="date-chip"><CalendarDays size={15}/>{kind==="Daily"?today.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"}):kind==="Weekly"?"Nov 02 – Nov 08, 2026":"November 2026"}<ChevronDown size={14}/></div></div>
    <div className="metric-grid">
      <Metric label={kind==="Daily"?"Tickets touched today":kind==="Weekly"?"Tickets completed this week":"Tickets completed this month"} value={kind==="Daily"?"6":kind==="Weekly"?String(completed.length+4):String(completed.length+18)} delta="+12.5%" trend="up" icon={<TicketIcon size={18}/>} tone="blue"/>
      <Metric label="Average performance" value={`${scoreAvg||82}%`} delta="+4.8%" trend="up" icon={<Gauge size={18}/>} tone="green"/>
      <Metric label="ETA breaches" value={String(late.length||breaches)} delta="Needs attention" trend="down" icon={<Clock3 size={18}/>} tone="orange"/>
      <Metric label="Open QA defects" value={String(openBugs)} delta={`${criticalBugs} critical`} trend={criticalBugs?"down":"up"} icon={<Bug size={18}/>} tone="red"/>
    </div>
    <div className="grid-two">
      <section className="panel chart-panel"><div className="panel-head"><div><h3>{chartTitle}</h3><p>{kind==="Daily"?"Illustrative hourly productivity score": "Completed ticket performance score, sample trend"}</p></div><button className="more-btn"><MoreHorizontal size={18}/></button></div><div className="chart-legend"><span><i className="legend-blue"/> Performance score</span><span className="muted-legend">Target 85%</span></div><div className="bar-chart">{chartValues.map((v,i)=><div className="bar-column" key={i}><div className="bar-track"><div className={`bar-fill ${v>=85?"high":""}`} style={{height:`${v}%`}} title={`${v}%`}/></div><small>{labels[i]}</small></div>)}</div><div className="chart-foot"><span><b>{scoreAvg||82}%</b> average score</span><span className="positive"><ArrowUpRight size={14}/> 4.8% vs previous period</span></div></section>
      <section className="panel stage-panel"><div className="panel-head"><div><h3>Ticket pipeline</h3><p>Current workload by lifecycle stage</p></div><button className="text-button" onClick={onGoTickets}>View all <ArrowRight size={14}/></button></div><div className="stage-list">{stageCounts.map((s,i)=><div className="stage-row" key={s.stage}><div className={`stage-icon stage-${i}`}>{i+1}</div><div className="stage-info"><b>{s.stage}</b><div className="mini-track"><i style={{width:`${Math.max(7,s.count/tickets.length*100)}%`}}/></div></div><strong>{s.count}</strong></div>)}</div><div className="stage-note"><ShieldCheck size={16}/><span>Deployment is gated by QA approval and checklist completion.</span></div></section>
    </div>
    <div className="grid-two">
      <section className="panel"><div className="panel-head"><div><h3>Priority focus</h3><p>Items that may need your attention</p></div><span className="subtle-badge">Live demo data</span></div><div className="attention-list">
        <div className="attention-item"><div className="attention-symbol critical"><AlertCircle size={17}/></div><div><b>{criticalBugs} critical QA defects</b><small>Resolve or formally accept before deployment.</small></div><ArrowRight size={15}/></div>
        <div className="attention-item"><div className="attention-symbol warning"><Clock3 size={17}/></div><div><b>{late.length||breaches} tickets past ETA</b><small>Review delay attribution and revised ETA.</small></div><ArrowRight size={15}/></div>
        <div className="attention-item"><div className="attention-symbol info"><Zap size={17}/></div><div><b>{active.length} active tickets</b><small>Keep stage updates and handover comments current.</small></div><ArrowRight size={15}/></div>
      </div></section>
      <section className="panel"><div className="panel-head"><div><h3>Performance principles</h3><p>How the demo score is calculated</p></div><div className="panel-icon"><Sparkles size={17}/></div></div><div className="score-formula"><div><span>ETA adherence</span><b>40%</b></div><div className="formula-track"><i style={{width:"40%"}}/></div><div><span>QA quality</span><b>60%</b></div><div className="formula-track teal"><i style={{width:"60%"}}/></div><small>Ticket score = ETA score × 40% + Quality score × 60%</small></div></section>
    </div>
    <section className="panel"><div className="panel-head"><div><h3>Recent tickets</h3><p>Continue where you left off</p></div><button className="text-button" onClick={onGoTickets}>All tickets <ArrowRight size={14}/></button></div><TicketTable tickets={tickets.slice(0,5)} onSelect={onSelect}/></section>
  </div>;
}

function Metric({label,value,delta,trend,icon,tone}:{label:string;value:string;delta:string;trend:string;icon:ReactNode;tone:string}){
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}>{icon}</div></div><div className="metric-bottom"><strong>{value}</strong><span className={trend==="up"?"trend-up":"trend-neutral"}>{trend==="up"?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {delta}</span></div></div>;
}

function TicketsPage({tickets,query,setQuery,stageFilter,setStageFilter,onCreate,onSelect,onTransition}:{tickets:Ticket[];query:string;setQuery:(s:string)=>void;stageFilter:string;setStageFilter:(s:string)=>void;onCreate:()=>void;onSelect:(id:string)=>void;onTransition:(id:string)=>void}){
  return <div className="content-stack"><div className="panel toolbar-panel"><div className="table-tools"><div className="search-box"><Search size={16}/><input placeholder="Search by ticket, project or module..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="select-wrap"><Filter size={15}/><select value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option>All stages</option>{stages.map(s=><option>{s}</option>)}</select></div><button className="btn btn-primary" onClick={onCreate}><Plus size={15}/> Create ticket</button></div></div><div className="panel"><div className="panel-head"><div><h3>All tickets <span className="count-pill">{tickets.length}</span></h3><p>Search, filter and open a ticket to see its full history.</p></div><span className="subtle-badge">Demo workspace</span></div><TicketTable tickets={tickets} onSelect={onSelect} onTransition={onTransition}/></div></div>;
}

function TicketTable({tickets,onSelect,onTransition}:{tickets:Ticket[];onSelect:(id:string)=>void;onTransition?:(id:string)=>void}){
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Ticket</th><th>Project</th><th>Priority</th><th>Stage</th><th>ETA</th><th>QA defects</th><th>Performance</th><th/></tr></thead><tbody>{tickets.map(t=><tr key={t.id}><td><button className="ticket-link" onClick={()=>onSelect(t.id)}><b>{t.id}</b><span>{t.title}</span></button></td><td><span className="project-name">{t.project}</span><small className="cell-sub">{t.module}</small></td><td><Priority value={t.priority}/></td><td><StagePill value={t.stage}/></td><td><span className={new Date(t.eta)<new Date()&&!isComplete(t)?"late-date":""}>{dateLabel(t.eta)}</span></td><td><span className="bug-count"><Bug size={13}/>{t.bugs.length}</span></td><td>{isComplete(t)?<ScoreBadge score={scoreOf(t)}/>:<span className="muted-text">In progress</span>}</td><td><button className="icon-btn small" onClick={()=>onSelect(t.id)}><ArrowRight size={15}/></button></td></tr>)}</tbody></table>{tickets.length===0&&<div className="empty-state"><TicketIcon size={28}/><b>No tickets found</b><span>Try changing your search or stage filter.</span></div>}</div>;
}

function Priority({value}:{value:Ticket["priority"]}){return <span className={`priority priority-${value.toLowerCase()}`}><i/>{value}</span>}
function StagePill({value}:{value:Stage}){return <span className={`stage-pill pill-${value.toLowerCase().replace(" ","-")}`}>{value}</span>}
function ScoreBadge({score}:{score:number}){return <span className={`score-badge ${score>=85?"good":score>=70?"mid":"low"}`}>{score}<small>/100</small></span>}

function TicketDrawer({ticket,onClose,onTransition,onBug,onChecklist,onToggleChecklist,onNotes,onBugStatus}:{ticket:Ticket;onClose:()=>void;onTransition:(id:string)=>void;onBug:()=>void;onChecklist:()=>void;onToggleChecklist:(id:string,item:string)=>void;onNotes:(v:string)=>void;onBugStatus:(ticketId:string,bugId:string,status:BugType["status"])=>void}){
  const [tab,setTab]=useState("Overview");
  const next=stages[stages.indexOf(ticket.stage)+1];
  const completeChecks=ticket.checklist.filter(c=>c.checked).length;
  return <div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><aside className="ticket-drawer"><div className="drawer-head"><div><div className="eyebrow">TICKET DETAILS</div><h2>{ticket.id}</h2></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><div className="drawer-title"><h3>{ticket.title}</h3><div className="drawer-meta"><Priority value={ticket.priority}/><StagePill value={ticket.stage}/><span>{ticket.project} · {ticket.module}</span></div></div><div className="drawer-actions">{next&&<button className="btn btn-primary" onClick={()=>onTransition(ticket.id)}>Move to {next} <ArrowRight size={14}/></button>}<button className="btn btn-secondary" onClick={onBug}><Bug size={14}/> Add bug</button></div><div className="drawer-tabs">{["Overview","Activity","QA & Bugs","Deployment","Performance"].map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="drawer-content">
    {tab==="Overview"&&<><div className="detail-grid"><Detail label="Assignee" value={ticket.assignee}/><Detail label="QA owner" value={ticket.qaOwner}/><Detail label="ETA" value={dateLabel(ticket.eta)}/><Detail label="Estimate" value={`${ticket.estimateHours} hours`}/><Detail label="Complexity" value={ticket.complexity}/><Detail label="Blocked time" value={`${ticket.blockedHours} hours`}/></div><h4>Description</h4><p className="detail-copy">{ticket.description}</p><h4>Acceptance criteria</h4><ul className="criteria-list">{ticket.acceptanceCriteria.map(x=><li><CheckCircle2 size={15}/>{x}</li>)}</ul><h4>Lifecycle</h4><div className="vertical-timeline">{stages.map((s,i)=><div className={`timeline-step ${stages.indexOf(ticket.stage)>=i?"done":""}`}><span>{i+1}</span><div><b>{s}</b><small>{stages.indexOf(ticket.stage)>i?"Completed stage":stages.indexOf(ticket.stage)===i?"Current stage":"Upcoming"}</small></div></div>)}</div></>}
    {tab==="Activity"&&<div className="activity-list">{ticket.comments.length?ticket.comments.map(e=><div className="activity-event"><div className="event-dot"><MessageSquare size={13}/></div><div><b>{e.title}</b><p>{e.detail}</p><small>{e.actor} · {timeLabel(e.at)}</small></div></div>):<div className="empty-state">No activity recorded yet.</div>}</div>}
    {tab==="QA & Bugs"&&<><div className="section-inline"><h4>QA defects ({ticket.bugs.length})</h4><button className="text-button" onClick={onBug}><Plus size={14}/> Add bug</button></div>{ticket.bugs.length?ticket.bugs.map(b=><div className="bug-card"><div className="bug-card-top"><b>{b.id} · {b.title}</b><BugSeverityPill severity={b.severity}/></div><p>{b.notes||"No additional notes."}</p><div className="bug-card-bottom"><span>{b.attribution} attribution</span><select value={b.status} onChange={e=>onBugStatus(ticket.id,b.id,e.target.value as BugType["status"])}><option>Open</option><option>In Progress</option><option>Resolved</option><option>Accepted</option></select></div></div>):<div className="empty-state"><Bug size={25}/><b>No QA defects</b><span>Record defects found during testing.</span></div>}</>}
    {tab==="Deployment"&&<><div className="checklist-summary"><div><b>{completeChecks}/{ticket.checklist.length}</b><span>Checklist complete</span></div><button className="btn btn-secondary btn-small" onClick={onChecklist}>Edit checklist</button></div><div className="progress"><i style={{width:`${completeChecks/ticket.checklist.length*100}%`}}/></div><div className="checklist-list compact">{ticket.checklist.map(c=><label className="check-row"><input type="checkbox" checked={c.checked} onChange={()=>onToggleChecklist(ticket.id,c.id)}/><span>{c.label}</span></label>)}</div><h4>Deployment notes</h4><textarea className="notes-area" rows={5} value={ticket.deploymentNotes} onChange={e=>onNotes(e.target.value)} placeholder="Release summary, affected modules, migration, smoke test and rollback instructions."/><div className="deployment-meta"><Detail label="Environment" value={ticket.deploymentEnvironment}/><Detail label="Readiness" value={completeChecks===ticket.checklist.length&&ticket.deploymentNotes.trim()?"Checklist complete":"Action required"}/></div></>}
    {tab==="Performance"&&<><div className="performance-score-large"><div><span>Ticket performance score</span><strong>{scoreOf(ticket)}<small>/100</small></strong></div><ScoreBadge score={scoreOf(ticket)}/></div><div className="score-breakdown"><ScoreLine label="ETA adherence" score={etaScore(ticket)} weight="40%" color="blue"/><ScoreLine label="QA quality" score={qualityScore(ticket)} weight="60%" color="teal"/></div><div className="formula-box"><b>Calculation</b><p>({etaScore(ticket)} × 0.40) + ({qualityScore(ticket)} × 0.60) = <strong>{scoreOf(ticket)}</strong></p><small>Development-attributed bug penalty: {bugPenalty(ticket.bugs)} points</small></div><h4>Quality deductions</h4>{ticket.bugs.filter(b=>b.attribution==="Development").length?ticket.bugs.filter(b=>b.attribution==="Development").map(b=><div className="deduction-row"><BugSeverityPill severity={b.severity}/><span>{b.title}</span><b>-{b.severity==="Critical"?30:b.severity==="Minor"?10:3}</b></div>):<p className="muted-text">No development-attributed defects recorded.</p>}<div className="info-box"><CircleHelp size={16}/><span>Demo scoring is illustrative. Final production policy should define the completion milestone, business hours, approved pauses and bug appeal process.</span></div></>}
  </div></aside></div>;
}

function Detail({label,value}:{label:string;value:string}){return <div className="detail-item"><small>{label}</small><b>{value}</b></div>}
function ScoreLine({label,score,weight,color}:{label:string;score:number;weight:string;color:string}){return <div className="score-line"><div><span>{label}</span><b>{score}/100 <small>({weight})</small></b></div><div className="progress"><i className={color} style={{width:`${score}%`}}/></div></div>}
function BugSeverityPill({severity}:{severity:BugType["severity"]}){return <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>}

function BugsPage({tickets,onAdd,onStatus}:{tickets:Ticket[];onAdd:(id:string)=>void;onStatus:(ticketId:string,bugId:string,status:BugType["status"])=>void}){
  const bugs=tickets.flatMap(t=>t.bugs.map(b=>({...b,ticketId:t.id,ticketTitle:t.title})));
  const [filter,setFilter]=useState("All severities");
  const visible=bugs.filter(b=>filter==="All severities"||b.severity===filter);
  return <div className="content-stack"><div className="metric-grid three"><Metric label="Total QA defects" value={String(bugs.length)} delta="Across all tickets" trend="up" icon={<Bug size={18}/>} tone="blue"/><Metric label="Critical defects" value={String(bugs.filter(b=>b.severity==="Critical").length)} delta="Highest impact" trend="down" icon={<AlertCircle size={18}/>} tone="red"/><Metric label="Open defects" value={String(bugs.filter(b=>b.status==="Open"||b.status==="In Progress").length)} delta="Need action" trend="down" icon={<Clock3 size={18}/>} tone="orange"/></div><div className="panel"><div className="panel-head"><div><h3>QA defect register</h3><p>Severity, attribution and resolution are visible for each defect.</p></div><div className="select-wrap"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All severities</option><option>Critical</option><option>Minor</option><option>Cosmetic</option></select></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Defect</th><th>Parent ticket</th><th>Severity</th><th>Attribution</th><th>Created</th><th>Status</th><th/></tr></thead><tbody>{visible.map(b=><tr><td><b className="bug-id">{b.id}</b><span className="cell-sub">{b.title}</span></td><td><b>{b.ticketId}</b><small className="cell-sub">{b.ticketTitle}</small></td><td><BugSeverityPill severity={b.severity}/></td><td>{b.attribution}</td><td>{dateLabel(b.createdAt)}</td><td><select className="inline-select" value={b.status} onChange={e=>onStatus(b.ticketId,b.id,e.target.value as BugType["status"])}><option>Open</option><option>In Progress</option><option>Resolved</option><option>Accepted</option></select></td><td><button className="icon-btn small" onClick={()=>onAdd(b.ticketId)}><Plus size={15}/></button></td></tr>)}</tbody></table>{visible.length===0&&<div className="empty-state">No defects match this filter.</div>}</div></div><div className="info-box"><ShieldCheck size={17}/><span>Defects attributed to requirements, environment or third-party services remain visible but do not reduce the developer's quality score by default.</span></div></div>;
}

function ReportsPage({tickets,onExport,filter,setFilter}:{tickets:Ticket[];onExport:()=>void;filter:string;setFilter:(s:string)=>void}){
  const projects=["All projects",...Array.from(new Set(tickets.map(t=>t.project)))];
  const data=tickets.filter(t=>filter==="All projects"||t.project===filter);
  const done=data.filter(isComplete);
  const avg=done.length?Math.round(done.reduce((s,t)=>s+scoreOf(t),0)/done.length):0;
  return <div className="content-stack"><div className="panel report-toolbar"><div><h3>Performance report</h3><p>Review ticket outcomes and export a detailed CSV.</p></div><div className="report-actions"><select value={filter} onChange={e=>setFilter(e.target.value)}>{projects.map(p=><option>{p}</option>)}</select><button className="btn btn-primary" onClick={onExport}><Download size={15}/> Export CSV</button></div></div><div className="metric-grid three"><Metric label="Tickets in report" value={String(data.length)} delta="Selected scope" trend="up" icon={<TicketIcon size={18}/>} tone="blue"/><Metric label="Completed tickets" value={String(done.length)} delta="Signed off" trend="up" icon={<CheckCircle2 size={18}/>} tone="green"/><Metric label="Average score" value={`${avg}%`} delta="Completed only" trend="up" icon={<Gauge size={18}/>} tone="teal"/></div><div className="panel"><div className="panel-head"><div><h3>Ticket-level performance breakdown</h3><p>Scores are explained by ETA adherence and QA quality.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Ticket</th><th>Complexity</th><th>ETA score</th><th>Quality score</th><th>Bug penalty</th><th>Final score</th></tr></thead><tbody>{data.map(t=><tr><td><b>{t.id}</b><small className="cell-sub">{t.title}</small></td><td>{t.complexity}</td><td>{etaScore(t)}/100</td><td>{qualityScore(t)}/100</td><td>{bugPenalty(t.bugs)}</td><td>{isComplete(t)?<ScoreBadge score={scoreOf(t)}/>:<span className="muted-text">Pending</span>}</td></tr>)}</tbody></table></div></div><div className="grid-two"><div className="panel"><div className="panel-head"><div><h3>Defect severity distribution</h3><p>Unique recorded defects in selected scope</p></div></div><div className="severity-bars">{(["Critical","Minor","Cosmetic"] as const).map(s=>{const n=data.flatMap(t=>t.bugs).filter(b=>b.severity===s).length;return <div><div><span>{s}</span><b>{n}</b></div><div className="progress"><i className={s.toLowerCase()} style={{width:`${data.flatMap(t=>t.bugs).length?n/data.flatMap(t=>t.bugs).length*100:0}%`}}/></div></div>})}</div></div><div className="panel"><div className="panel-head"><div><h3>Scoring policy</h3><p>Current illustrative policy version 1.0</p></div></div><div className="policy-list"><div><span>ETA adherence weight</span><b>40%</b></div><div><span>QA quality weight</span><b>60%</b></div><div><span>Critical defect penalty</span><b>30 pts</b></div><div><span>Minor defect penalty</span><b>10 pts</b></div><div><span>Cosmetic defect penalty</span><b>3 pts</b></div></div></div></div></div>;
}

function SettingsPage({onReset,onExport}:{onReset:()=>void;onExport:()=>void}){
  return <div className="content-stack"><div className="panel settings-panel"><div className="settings-icon"><SlidersHorizontal size={20}/></div><div><h3>Workspace settings</h3><p>Configuration controls for this frontend demo. Production settings should be stored and enforced by the backend.</p></div></div><div className="grid-two"><div className="panel settings-card"><h3>Performance policy</h3><p>Proposed score model</p><div className="policy-list"><div><span>ETA adherence</span><b>40%</b></div><div><span>QA quality</span><b>60%</b></div><div><span>Critical / Minor / Cosmetic</span><b>30 / 10 / 3</b></div></div><div className="info-box"><CircleHelp size={16}/><span>Use policy versioning and apply changes prospectively to preserve historical score integrity.</span></div></div><div className="panel settings-card"><h3>Demo data management</h3><p>Data is stored in browser local storage on this device.</p><button className="btn btn-secondary full" onClick={onExport}><Download size={15}/> Export current data</button><button className="btn btn-danger full" onClick={()=>{if(confirm("Restore original demo data? Your browser changes will be overwritten."))onReset();}}><Activity size={15}/> Restore sample data</button><small className="muted-text">No backend or real authentication is connected in this demo.</small></div></div><div className="panel settings-card"><h3>Recommended production controls</h3><div className="recommend-grid"><div><ShieldCheck/><b>Role-based access</b><span>Enforce permissions on the API, not only in the UI.</span></div><div><Clock3/><b>ETA revision approval</b><span>Keep original ETA immutable and audit every approved revision.</span></div><div><Bug/><b>Defect attribution review</b><span>Allow developers to challenge severity or root-cause assignment.</span></div><div><Target/><b>Complexity-aware reporting</b><span>Show workload and complexity beside average scores.</span></div></div></div></div>;
}

export default App;