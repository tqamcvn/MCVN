(()=>{
 const badge=document.getElementById('feedback-unread');if(!badge)return;
 let busy=false;
 async function refresh(){if(busy||document.hidden)return;busy=true;try{
 const {data}=await sb.auth.getSession();if(!data.session){badge.hidden=true;badge.style.display='none';return;}
 const result=await sb.from('feedback_notifications').select('id',{count:'exact',head:true}).is('read_at',null);
 if(result.error)return;const count=result.count||0;badge.hidden=!count;badge.style.display=count?'inline-flex':'none';badge.title=count+' thông báo Feedback chưa đọc';
 }catch{ /* Retry on the next refresh if offline. */ }finally{busy=false;}}
 refresh();setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===document.getElementById('tool-frame')?.contentWindow&&e.data?.type==='feedback-notifications-changed')refresh();});
})();
