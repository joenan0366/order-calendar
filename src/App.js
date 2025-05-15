import { useState, useEffect } from "react";
import "./index.css";

const API_BASE = "https://joenan.site";
const menus    = ["A", "B", "Best"];
const today    = new Date();
const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE}/wp-json/order/v1/orders?user=${encodeURIComponent(userId)}`, {
      credentials: 'include'
    });
    const json = await res.json();
    const existing = json.orders || {};
    setOrderData(cur =>
      cur.map(day => ({
        ...day,
        quantities: existing[day.date] || day.quantities
      }))
    );
  } catch (e) {
    console.error(e);
  }
};

// 翌日以降 dayCount 日分のデフォルト行データを作成
const getNextDays = (dayCount = 30) => {
  const days = [];
  for (let i = 1; i <= dayCount; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    days.push({
      date:       d.toISOString().split("T")[0],
      quantities: menus.reduce((acc, m) => { acc[m] = 0; return acc; }, {}),
    });
  }
  return days;
};

// "MM/DD(曜)" 表記
const formatJapaneseDate = (dateString) => {
  const d   = new Date(dateString);
  const mm  = String(d.getMonth()+1).padStart(2, "0");
  const dd  = String(d.getDate()).padStart(2, "0");
  const dow = ["日","月","火","水","木","金","土"][d.getDay()];
  return `${mm}/${dd}(${dow})`;
};

function App() {
  const [userId, setUserId]         = useState("");
  const [password, setPassword]     = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [orderData, setOrderData]   = useState(getNextDays(30));
  const [holidays, setHolidays]     = useState([]);
  const [displayName, setDisplayName] = useState("");

  // ログイン処理
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/wp-json/order/v1/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user: userId, pass: password }),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.status === "ok") {
        setIsLoggedIn(true);
        setLoginError("");
        setDisplayName( json.displayName || userId );
        // 祝日取得
        fetch(`${API_BASE}/wp-json/order/v1/holidays`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            setHolidays((data.holidays || []).map(d => d.replace(/\//g, '-')));
          });
        // 過去注文取得
        fetch(`${API_BASE}/wp-json/order/v1/orders?user=${encodeURIComponent(userId)}`, { credentials: 'include' })
          .then(r => r.json())
          .then(d => {
            const existing = d.orders || {};
            setOrderData(cur =>
              cur.map(day => ({ ...day, quantities: existing[day.date] || day.quantities }))
            );
          });
      } else {
        setLoginError("IDまたはパスワードが違います");
      }
    } catch (err) {
      console.error(err);
      setLoginError("通信エラーが発生しました");
    }
  };

  // 数量変更ハンドラ
  const handleChange = async (date, menu, value) => {
    const qty = parseInt(value, 10);
    // 楽観的UI更新
    setOrderData(prev =>
      prev.map(d =>
        d.date === date ? { ...d, quantities: { ...d.quantities, [menu]: qty } } : d
      )
    );
    // サーバー保存
    await fetch(`${API_BASE}/wp-json/order/v1/update`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user: userId, date, menu, quantity: qty }),
      credentials: 'include'
    });
  };

  // 未ログイン画面
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">ログイン</h1>
        <input
          type="text"
          placeholder="ユーザーID"
          value={userId}
          inputMode="latin"
           // 入力パターン（英字と数字のみ）
          pattern="[A-Za-z0-9]+"
           // スマホで英数字キーボードを出しやすくする
          autoComplete="username"
          onChange={e => setUserId(e.target.value)}
          className="border px-3 py-2 mb-2 rounded w-64"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 mb-4 rounded w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ログイン
        </button>
        {loginError && <p className="text-red-500 mt-3">{loginError}</p>}
      </div>
    );
  }

  // 日曜日を除外し、月曜開始に空セル
  const filtered   = orderData.filter(d => new Date(d.date).getDay() !== 0);
  const firstDow   = new Date(filtered[0].date).getDay();
  const blankCount = (firstDow + 6) % 7;
  const cells      = [...Array(blankCount).fill(null), ...filtered];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ようこそ、{displayName} さん</h1>

      {/* スマホ：2列縦スクロール */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {cells.map((day, i) => (
          day ? (
            <div
              key={i}
              className={`rounded-2xl p-4 transition ${
                holidays.includes(day.date)
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white shadow hover:shadow-lg'
              }`}
            >
              <h2 className="text-lg font-semibold mb-2">
                {formatJapaneseDate(day.date)}
              </h2>
              {menus.map(menu => (
                <div key={menu} className="flex justify-between mb-1 text-sm">
                  <span>{menu}</span>
                  <select
                    disabled={holidays.includes(day.date)}
                    value={day.quantities[menu]}
                    onChange={e => handleChange(day.date, menu, e.target.value)}
                    className="border rounded px-2 py-1 w-12 text-right"
                  >
                    {[...Array(11).keys()].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div key={i} />
          )
        ))}
      </div>

      {/* タブレット以上：6列グリッド */}
      <div className="hidden sm:grid grid-cols-6 gap-4">
        {cells.map((day, i) => (
          day ? (
            <div
              key={i}
              className={`rounded-2xl p-6 transition ${
                holidays.includes(day.date)
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white shadow hover:shadow-lg'
              }`}
            >
              <h2 className="text-lg font-semibold mb-2">
                {formatJapaneseDate(day.date)}
              </h2>
              {menus.map(menu => (
                <div key={menu} className="flex items-center justify-between mb-1">
                  <span>{menu}</span>
                  <select
                    disabled={holidays.includes(day.date)}
                    value={day.quantities[menu]}
                    onChange={e => handleChange(day.date, menu, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {[...Array(11).keys()].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div key={i} />
          )
        ))}
      </div>
    </div>
  );
}

export default App;
