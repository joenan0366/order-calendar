import { useState, useEffect } from 'react';
import './index.css';

const API_BASE = 'https://joenan.site';
const menus = ['1st A','2nd B','Best'];
const today = new Date();

const getNextDays = (count=30) => {
  const days=[];
  for(let i=1;i<=count;i++){
    const d=new Date(); d.setDate(today.getDate()+i);
    days.push({ date: d.toISOString().split('T')[0], quantities: Object.fromEntries(menus.map(m=>[m,0])) });
  }
  return days;
};

const formatJapaneseDate = ds=>{
  const d=new Date(ds);
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const dd=String(d.getDate()).padStart(2,'0');
  const dow=['日','月','火','水','木','金','土'][d.getDay()];
  return `${mm}/${dd}(${dow})`;
};

function App(){
  const [userId,setUserId]=useState('');
  const [password,setPassword]=useState('');
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [loginError,setLoginError]=useState('');
  const [orderData,setOrderData]=useState(getNextDays());
  const [holidays,setHolidays]=useState([]);

  const handleLogin=async()=>{
    try{
      const res=await fetch(`${API_BASE}/wp-json/order/v1/login`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user:userId,pass:password})
      });
      const json=await res.json();
      if(json.status==='ok'){
        setIsLoggedIn(true);
        setLoginError('');
        const holRes=await fetch(`${API_BASE}/wp-json/order/v1/holidays`);
        const holJson=await holRes.json();
        setHolidays(holJson.holidays||[]);
      } else {
        setLoginError('IDまたはパスワードが違います');
      }
    }catch(err){
      console.error(err);
      setLoginError('通信エラーが発生しました');
    }
  };

  const handleChange=async(date,menu,value)=>{
    const qty=parseInt(value,10);
    setOrderData(prev=>prev.map(d=>d.date===date?{...d,quantities:{...d.quantities,[menu]:qty}}:d));
    try{
      await fetch(`${API_BASE}/wp-json/order/v1/update`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user:userId,date,menu,quantity:qty})
      });
    }catch(err){ console.error('自動保存エラー:',err); }
  };

  if(!isLoggedIn){
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">ログイン</h1>
        <input type="text" placeholder="ユーザーID" value={userId} onChange={e=>setUserId(e.target.value)} className="border px-3 py-2 mb-2 rounded w-64" />
        <input type="password" placeholder="パスワード" value={password} onChange={e=>setPassword(e.target.value)} className="border px-3 py-2 mb-4 rounded w-64" />
        <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ログイン</button>
        {loginError&&<p className="text-red-500 mt-3">{loginError}</p>}
      </div>
    );
  }

  // 日曜除外 + 月曜先頭揃え
  const filtered=orderData.filter(d=>new Date(d.date).getDay()!==0);
  const firstDow=new Date(filtered[0].date).getDay();
  const blanks=Array((firstDow+6)%7).fill(null);
  const cells=[...blanks,...filtered];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ようこそ、{userId} さん</h1>
      <div className="grid grid-cols-6 gap-4">
        {cells.map((day,i)=>(
          day===null
          ?<div key={`b${i}`} />
          :(() => {
            const isHoliday=holidays.includes(day.date);
            return (
              <div key={day.date} className={`rounded-2xl p-6 transition ${isHoliday?'bg-gray-200 cursor-not-allowed':'bg-white shadow hover:shadow-lg'}`}>
                <h2 className="text-lg font-semibold mb-2">{formatJapaneseDate(day.date)}</h2>
                {menus.map(menu=>(
                  <div key={menu} className="flex items-center justify-between mb-1">
                    <span>{menu}</span>
                    <select disabled={isHoliday} value={day.quantities[menu]} onChange={e=>handleChange(day.date,menu,e.target.value)} className="border rounded px-2 py-1">
                      {[...Array(11).keys()].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}

export default App;