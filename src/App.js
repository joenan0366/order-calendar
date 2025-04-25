import { useState, useEffect } from "react";
import "./index.css";

const USERS = { user1: "pass123", user2: "zundamon" };
const menus = ["1st menuA", "2nd menuB", "Best"];
const today = new Date();

// … getNextDays, formatJapaneseDate はそのまま …

function App() {
  const [userId, setUserId]         = useState("");
  const [password, setPassword]     = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [orderData, setOrderData]   = useState(getNextDays(30));
  const [holidays, setHolidays]     = useState([]); // ① 祝日リスト

  // ログイン
  const handleLogin = async () => {
    try {
      const res  = await fetch("/wp-json/order/v1/login", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ user: userId, pass: password })
      });
      const json = await res.json();
      if (json.status === "ok") {
        setIsLoggedIn(true);
        setLoginError("");
        // ② 祝日取得
        fetch("/wp-json/order/v1/holidays")
          .then(r => r.json())
          .then(data => setHolidays(data.holidays))
          .catch(console.error);
      } else {
        setLoginError("IDまたはパスワードが違います");
      }
    } catch (err) {
      console.error(err);
      setLoginError("通信エラーが発生しました");
    }
  };

  // 数量変更時に即サーバー／ローカル更新
  const handleChange = async (date, menu, value) => {
    const qty = parseInt(value, 10);
    setOrderData(prev =>
      prev.map(d =>
        d.date === date
          ? { ...d, quantities: { ...d.quantities, [menu]: qty } }
          : d
      )
    );
    try {
      await fetch("/wp-json/order/v1/update", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ user: userId, date, menu, quantity: qty })
      });
    } catch (err) {
      console.error("自動保存エラー:", err);
    }
  };

  if (!isLoggedIn) {
    return (
      /* ログイン画面はそのまま */
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ようこそ、{userId} さん</h1>
      {/* ③ ６列グリッド */}
      <div className="grid grid-cols-6 gap-4">
        {orderData.map(day => {
          // ④ 祝日判定（含まれていれば休日）
          const isHoliday = holidays.includes(day.date);
          return (
            <div
              key={day.date}
              className={
                `rounded-2xl p-6 transition ` +
                (isHoliday
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-white shadow hover:shadow-lg")
              }
            >
              <h2 className="text-lg font-semibold mb-2">
                {formatJapaneseDate(day.date)}
              </h2>
              {menus.map(menu => (
                <div key={menu} className="flex items-center justify-between mb-1">
                  <span>{menu}</span>
                  <select
                    disabled={isHoliday}
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
          );
        })}
      </div>
    </div>
  );
}

export default App;
