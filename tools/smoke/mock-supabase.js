(function(){
const ME = window.__MOCK_ME || 'u1';
const now=Date.now(), d=n=>new Date(now-n*864e5).toISOString();
const users={u1:{id:'u1',email:'shmuel@example.com',user_metadata:{full_name:'שמואל רוט'}},
 u2:{id:'u2',email:'neta@example.com',user_metadata:{full_name:'נטע'}},
 u3:{id:'u3',email:'yoav@example.com',user_metadata:{full_name:'יואב'}},
 u4:{id:'u4',email:'savta@example.com',user_metadata:{full_name:'סבתא רחל'}}};
const it=(id,list,text,cat,emoji,status,by,extra)=>Object.assign({id,list_id:list,household_id:'h1',text,category:cat,emoji,status,created_by:by,checked_by:status==='checked'?'u2':null,qty:null,position:parseInt(id.slice(1)),created_at:d(1)},extra||{});
const DB={
 households:[{id:'h1',name:'בית רוט',bit_link:'https://www.bitpay.co.il/app/me/XXXX',main_list_id:'l1'},{id:'h2',name:'ההורים',bit_link:''}],
 household_members:[
  {household_id:'h1',user_id:'u1',role:'owner',display_name:'שמואל',email:'shmuel@example.com'},
  {household_id:'h1',user_id:'u2',role:'editor',display_name:'נטע',email:'neta@example.com'},
  {household_id:'h1',user_id:'u3',role:'requester',display_name:'יואב',email:'yoav@example.com'},
  {household_id:'h1',user_id:'u4',role:'viewer',display_name:'סבתא רחל',email:'savta@example.com'},
  {household_id:'h2',user_id:'u1',role:'editor',display_name:'שמואל',email:'shmuel@example.com'}],
 shopping_lists:[
  {id:'l1',household_id:'h1',name:'קניות שבועיות',status:'open',created_at:d(2)},
  {id:'l2',household_id:'h1',name:'לשבת',status:'open',created_at:d(1)},
  {id:'l3',household_id:'h1',name:'סופר יום חמישי',status:'closed',created_at:d(9),closed_at:d(7),total:486.4,total_by:'u1',total_at:d(7),pay_link:'https://www.bitpay.co.il/app/me/XXXX',split:{u1:162.2,u2:162.1,u3:162.1}},
  {id:'l4',household_id:'h1',name:'שוק',status:'closed',created_at:d(16),closed_at:d(14),total:212,total_by:'u2',total_at:d(14),split:{u1:106,u2:106}},
  {id:'l5',household_id:'h1',name:'פארם',status:'closed',created_at:d(20),closed_at:d(19)}],
 list_items:[
  it('i1','l1','חלב 3%','dairy','🥛','active','u1',{qty:'2'}),
  it('i2','l1','יוגורט','dairy','🥛','checked','u2'),
  it('i3','l1','קוטג׳','dairy','🥛','active','u2'),
  it('i4','l1','עגבניות','produce','🍅','active','u1',{qty:'1 ק״ג'}),
  it('i5','l1','מלפפונים','produce','🥒','checked','u1'),
  it('i6','l1','בננות','produce','🍌','active','u2'),
  it('i7','l1','לחם מלא','bakery','🍞','active','u1'),
  it('i8','l1','חזה עוף','meat','🍗','active','u2',{qty:'1 ק״ג'}),
  it('i9','l1','אורז','grains','🍚','active','u1'),
  it('i10','l1','נייר טואלט','paper','🧻','active','u2'),
  it('i11','l1','סבון כלים','household','🧽','checked','u1'),
  it('i12','l1','במבה','snacks','🥜','pending','u3'),
  it('i13','l1','שוקו','beverages','🍫','pending','u3'),
  it('i20','l2','חלות','holiday','🍞','active','u1',{qty:'2'}),
  it('i21','l2','יין','alcohol','🍷','active','u2'),
  it('i22','l2','נרות','holiday','🕯️','active','u1'),
  it('i30','l3','חלב','dairy','🥛','checked','u1')],
 trip_payments:[{list_id:'l3',household_id:'h1',user_id:'u2',amount:162.1,created_at:d(6)}],
 household_invites:[{code:'ABC123',household_id:'h1',role:'editor',expires_at:new Date(now+5*864e5).toISOString(),created_at:d(2)}],
 list_activity:[
  {household_id:'h1',list_id:'l1',actor:'u2',action:'checked',item_text:'יוגורט',created_at:new Date(now-12*6e4).toISOString()},
  {household_id:'h1',list_id:'l1',actor:'u3',action:'requested',item_text:'שוקו',created_at:new Date(now-50*6e4).toISOString()},
  {household_id:'h1',list_id:'l2',actor:'u1',action:'added',item_text:'נרות',created_at:new Date(now-3*36e5).toISOString()},
  {household_id:'h1',list_id:'l1',actor:'u2',action:'added',item_text:'חזה עוף',created_at:d(1)}],
 item_rejections:[], cart_seen:[]
};
class Q{
 constructor(t){this.t=t;this.f=[];this.op='select';this.one=null;this.ord=null}
 select(){return this} eq(c,v){this.f.push(r=>r[c]===v);return this} neq(c,v){this.f.push(r=>r[c]!==v);return this}
 in(c,v){this.f.push(r=>v.includes(r[c]));return this} gt(c,v){this.f.push(r=>r[c]>v);return this} lt(c,v){this.f.push(r=>r[c]<v);return this}
 not(c,op,v){this.f.push(r=>!(r[c]==null));return this} is(c,v){this.f.push(r=>r[c]==v);return this}
 order(c,o){this.ord=[c,o&&o.ascending===false];return this} limit(){return this}
 maybeSingle(){this.one='m';return this} single(){this.one='s';return this}
 update(p){this.op='update';this.p=p;return this} delete(){this.op='delete';return this}
 insert(p){this.op='insert';this.p=p;return this} upsert(p){this.op='insert';this.p=p;return this}
 run(){
  const tbl=DB[this.t]||(DB[this.t]=[]);
  if(this.op==='insert'){const rows=[].concat(this.p).map(r=>Object.assign({id:'n'+Math.random().toString(36).slice(2),created_at:new Date().toISOString()},r));tbl.push(...rows);return {data:this.one?rows[0]:rows,error:null}}
  let rows=tbl.filter(r=>this.f.every(f=>f(r)));
  if(this.op==='update'){rows.forEach(r=>Object.assign(r,this.p));}
  if(this.op==='delete'){DB[this.t]=tbl.filter(r=>!rows.includes(r));}
  rows=rows.map(r=>{const o=Object.assign({},r); if(this.t==='household_members'){o.households={name:(DB.households.find(h=>h.id===r.household_id)||{}).name}} return o});
  if(this.ord){const [c,desc]=this.ord;rows.sort((a,b)=>(a[c]>b[c]?1:a[c]<b[c]?-1:0)*(desc?-1:1))}
  return {data:this.one?(rows[0]||null):rows,error:null};
 }
 then(res,rej){return Promise.resolve(this.run()).then(res,rej)}
}
const session={user:users[ME],access_token:'x'};
const rpc=async(n,a)=>{
 if(n==='is_admin') return {data:ME==='u1',error:null};
 if(n==='set_main_list'){DB.households.find(h=>h.id===a.p_household).main_list_id=a.p_list_id;return {data:null,error:null}}
 if(n==='create_shopping_list'){const id='l'+Date.now();DB.shopping_lists.push({id,household_id:a.p_household,name:a.p_name,status:'open',created_at:new Date().toISOString()});return {data:id,error:null}}
 if(n==='cart_month_stats') return {data:{month:a.p_month,household:'בית רוט',trips:6,spent:2140.5,spent_prev:2390,lists_new:7,added:118,bought:97,requests:9,
  biggest:{name:'סופר יום חמישי',total:486.4},top_items:[{text:'חלב',n:6},{text:'חלות',n:4},{text:'בננות',n:3},{text:'במבה',n:3},{text:'ביצים',n:2}],
  top_cats:[{cat:'produce',n:31},{cat:'dairy',n:22},{cat:'bakery',n:14},{cat:'snacks',n:9}],busiest_dow:4,
  members:[{user_id:'u2',name:'נטע',added:51,bought:44,trips:3,paid:520,collected:0},{user_id:'u1',name:'שמואל',added:40,bought:38,trips:3,paid:0,collected:2140.5},{user_id:'u3',name:'יואב',added:9,bought:0,trips:0,paid:0,collected:0}],
  me:{days:17,steady:true},ai_text:window.__MOCK_AI||null},error:null};
 return {data:null,error:null};
};
const presence={u2:[{list:'l1'}]};
const ch={on(t,f,cb){if(t==='presence')ch._p=cb;return ch},subscribe(cb){setTimeout(()=>{if(cb)cb('SUBSCRIBED');if(ch._p)ch._p();},20);return ch},track(m){presence[ME]=[m];return Promise.resolve('ok')},presenceState(){return presence}};
window.supabase={createClient(){return {
 from:t=>new Q(t), rpc,
 auth:{onAuthStateChange(cb){setTimeout(()=>cb(window.__MOCK_LOGGEDOUT?'SIGNED_OUT':'SIGNED_IN',window.__MOCK_LOGGEDOUT?null:session),10);return {data:{subscription:{unsubscribe(){}}}}},
  getSession:async()=>({data:{session}}),signOut:async()=>({}),signInWithPassword:async()=>({data:{session},error:null}),updateUser:async()=>({data:{},error:null}),setSession:async()=>({}),signUp:async()=>({}),resetPasswordForEmail:async()=>({}),signInWithOAuth:async()=>({})},
 channel:()=>ch, removeChannel(){}, functions:{invoke:async()=>({data:null,error:null})}
}}};
})();
