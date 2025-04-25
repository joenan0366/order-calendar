import { useState, useEffect } from "react";
import "./index.css";

const USERS = {
  user1: "pass123",
  user2: "zundamon",
};

const menus = ["1st menuA", "2nd menuB", "Best"];
const today = new Date();

// 翌日以降 dayCount 日分を生成
const getNextDays = (dayCount = 30) => {
  const days = [];
  for (let i = 1; i <= dayCount; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      quantities: menus.reduce((acc, m) => {
        acc[m] = 0;
        return acc;
      }, {}),
    });
  }
  return days;
};

const formatJapaneseDate = (dateString) => {
  const d = new Date(dateString);
  const opts = { month: "2-digit", day: "2-digit" };
  const dayStr = d.toLocaleDateString("ja-JP", opts);
  const dow = ["日","月","火","水","木","金","土"][d.getDay()];
  return `${dayStr.replace("/", "月")}日(${dow})`;
};

function App() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [orderData, setOrderData] = useState(getNextDays(30));

  // ログイン
  const handleLogin = async () => {
    try {
      const res = await fetch("/wp-json/order/v1/login", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ user: userId, pass: password, type:"login" }),
      });
      console.log("fetch戻り:", res);
      const json = await res.json();
      console.log("json解析結果:", json);
      if (json.status === "ok") {
        setIsLoggedIn(true);
        setLoginError("");
      } else {
        setLoginError("IDまたはパスワードが違います");
      }
    } catch (err) {
      console.error("catch発火:", err);
      setLoginError("通信エラーが発生しました");
    }
  };
  

  // 数量変更時に即サーバー／ローカル両方更新
  const handleChange = async (date, menu, value) => {
    const qty = parseInt(value, 10);
    // ① UI 更新
    setOrderData((prev) =>
      prev.map((d) =>
        d.date === date
          ? { ...d, quantities: { ...d.quantities, [menu]: qty } }
          : d
      )
    );
    // ② サーバーに差分だけ送信
    try {
      await fetch("/wp-json/order/v1/update", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          user: userId,
          date,
          menu,
          quantity: qty,
        }),
      });
    } catch (err) {
      console.error("自動保存エラー:", err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">ログイン</h1>
        <input
          type="text"
          placeholder="ユーザーID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border px-3 py-2 mb-2 rounded w-64"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ようこそ、{userId} さん</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orderData.map((day) => (
          <div
            key={day.date}
            className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold mb-2">
              {formatJapaneseDate(day.date)}
            </h2>
            {menus.map((menu) => (
              <div
                key={menu}
                className="flex items-center justify-between mb-1"
              >
                <span>{menu}</span>
                <select
                  value={day.quantities[menu]}
                  onChange={(e) =>
                    handleChange(day.date, menu, e.target.value)
                  }
                  className="border rounded px-2 py-1"
                >
                  {[...Array(11).keys()].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
