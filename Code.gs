// Paste into Extensions > Apps Script of your Google Sheet.
// 1) Change PASSCODE below. 2) Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
// Without the passcode, requests are refused. After editing this file, use Deploy > Manage deployments > Edit > New version.
const PASSCODE = 'change-this-passcode';
const WP = ['id','name','pay','rate','transport','method'];
const ES = ['id','workplaceId','workplace','date','start','end','breakMin','note'];

function sheet(n){const ss=SpreadsheetApp.getActive();return ss.getSheetByName(n)||ss.insertSheet(n)}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function doGet(){return out({error:'unauthorized'})}

function doPost(e){
  let d;try{d=JSON.parse(e.postData.contents)}catch(x){return out({error:'bad request'})}
  if(!d.key||d.key!==PASSCODE)return out({error:'unauthorized'});
  if(d.action==='load')return out(load());
  if(d.action==='save'){save(d);return out({ok:1})}
  return out({error:'bad request'});
}

function load(){
  const wps=rows('Workplaces').map(r=>({id:r[0],name:r[1],pay:r[2],rate:+r[3],tr:+r[4],method:r[5]}));
  const es=rows('Entries').map(r=>({id:r[0],wp:r[1],d:String(r[3]),s:String(r[4]),e:String(r[5]),b:+r[6],bs:'',n:r[7]}));
  const m=sheet('Meta').getRange('A1').getValue();
  const rt=sheet('Meta').getRange('B1').getValue();
  return {wps,es,paid:m?JSON.parse(m):{},rates:rt?JSON.parse(rt):{}};
}
function save(d){
  const nm=Object.fromEntries(d.wps.map(w=>[w.id,w.name]));
  write('Workplaces',WP,d.wps.map(w=>[w.id,w.name,w.pay,w.rate,w.tr,w.method]));
  write('Entries',ES,d.es.map(x=>[x.id,x.wp,nm[x.wp]||'',x.d,x.s,x.e,x.b,x.n]));
  sheet('Meta').getRange('A1').setValue(JSON.stringify(d.paid||{}));
  sheet('Meta').getRange('B1').setValue(JSON.stringify(d.rates||{}));
  monthTabs(d);
}
function rows(n){const s=sheet(n),l=s.getLastRow();return l<2?[]:s.getRange(2,1,l-1,s.getLastColumn()).getValues()}
function write(n,head,data){
  const s=sheet(n);s.clear();
  const all=[head].concat(data);
  s.getRange(1,1,all.length,head.length).setNumberFormat('@').setValues(all);
  s.setFrozenRows(1);
}

// One tab per month (e.g. "2026-09") with daily rows, per-workplace totals and the month's earnings.
function monthTabs(d){
  const wp=Object.fromEntries(d.wps.map(w=>[w.id,w])), r2=v=>Math.round(v*100)/100, r0=v=>Math.round(v);
  const mins=x=>{let m=(+x.e.slice(0,2)*60+ +x.e.slice(3,5))-(+x.s.slice(0,2)*60+ +x.s.slice(3,5));if(m<0)m+=1440;return Math.max(0,m-(+x.b||0))};
  const by={};d.es.filter(x=>x.e&&x.d).forEach(x=>{const k=x.d.slice(0,7);(by[k]=by[k]||[]).push(x)});
  const ss=SpreadsheetApp.getActive();
  ss.getSheets().forEach(s=>{if(/^\d{4}-\d{2}$/.test(s.getName())&&!by[s.getName()])ss.deleteSheet(s)});
  Object.keys(by).sort().forEach(k=>{
    const l=by[k].sort((a,b)=>(a.d+a.s).localeCompare(b.d+b.s)),seen={},sum={},rows=[];
    l.forEach(x=>{
      const w=Object.assign({name:'(deleted)',pay:'hourly',rate:0,tr:0},wp[x.wp],((d.rates||{})[k]||{})[x.wp]),h=mins(x)/60,pay=w.pay==='monthly'?0:+w.rate*h,key=x.wp+x.d,first=!seen[key];seen[key]=1;
      const tr=first?(+w.tr||0):0,s=sum[x.wp]=sum[x.wp]||{n:w.name,h:0,days:0,pay:0,tr:0,sal:w.pay==='monthly'?+w.rate:0};
      s.h+=h;s.pay+=pay;s.tr+=tr;if(first)s.days++;
      rows.push([x.d,w.name,x.s,x.e,+x.b||0,r2(h),r0(pay),tr,r0(pay+tr)]);
    });
    const sm=Object.values(sum).map(s=>[s.n,r2(s.h),s.days,s.sal,r0(s.pay),s.tr,r0(s.sal+s.pay+s.tr),s.h?r0((s.sal+s.pay+s.tr)/s.h):0]);
    const T=Object.values(sum).reduce((a,s)=>({h:a.h+s.h,t:a.t+s.sal+s.pay+s.tr}),{h:0,t:0});
    const s=ss.getSheetByName(k)||ss.insertSheet(k);s.clear();
    s.getRange(1,1).setValue('Month '+k+' - daily records').setFontWeight('bold');
    const head=['Date','Workplace','Start','End','Break (min)','Hours','Hourly pay','Transport','Day total'];
    s.getRange(2,1,1,9).setValues([head]).setFontWeight('bold');
    if(rows.length)s.getRange(3,1,rows.length,9).setValues(rows);
    const r=rows.length+5;
    s.getRange(r,1,1,8).setValues([['Workplace','Hours','Days','Monthly salary','Hourly pay','Transport','Total','Per hour']]).setFontWeight('bold');
    s.getRange(r+1,1,sm.length,8).setValues(sm);
    s.getRange(r+sm.length+1,1,1,3).setValues([['MONTH TOTAL',r2(T.h),'']]).setFontWeight('bold');
    s.getRange(r+sm.length+1,7).setValue(r0(T.t)).setFontWeight('bold');
    s.getRange(r+sm.length+2,1,1,2).setValues([['Average per hour',T.h?r0(T.t/T.h):0]]);
    const dy={};rows.forEach(x=>{const o=dy[x[0]]=dy[x[0]]||[x[0],0,0,0,0];o[1]+=x[5];o[2]+=x[6];o[3]+=x[7];o[4]+=x[8]});
    const dl=Object.values(dy).map(o=>[o[0],r2(o[1]),o[2],o[3],o[4]]),q=r+sm.length+5;
    s.getRange(q,1).setValue('Daily totals (all workplaces)').setFontWeight('bold');
    s.getRange(q+1,1,1,5).setValues([['Date','Hours','Hourly pay','Transport','Day total']]).setFontWeight('bold');
    if(dl.length)s.getRange(q+2,1,dl.length,5).setValues(dl);
    s.setFrozenRows(2);
  });
}
