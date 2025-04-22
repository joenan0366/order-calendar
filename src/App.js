import { useState } from "react";
import "./index.css"; // Tailwindが使えるように

const USERS = {
  user1: "pass123",
  user2: "zundamon",
};

const menus = ["1st menuA", "2nd menuB", "Best"];
const today = new Date();

const getNext7Days = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    days.push({
      date: date.toISOString().split("T")[0],
      quantities: menus.reduce((acc, menu) => {
        acc[menu] = 0;
        return acc;
      }, {}),
    });
  }
  return days;
};

const formatJapaneseDate = (dateString) => {
  const date = new Date(dateString);
  const options = { month: "2-digit", day: "2-digit" };
  const dayStr = date.toLocaleDateString("ja-JP", options);
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${dayStr.replace("/", "月")}日(${dayOfWeek})`;
};

function App() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [orderData, setOrderData] = useState(getNext7Days());

  const handleLogin = () => {
    if (USERS[userId] === password) {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("IDまたはパスワードが間違っています");
    }
  };

  const handleChange = (date, menu, value) => {
    const newData = orderData.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          quantities: {
            ...day.quantities,
            [menu]: parseInt(value),
          },
        };
      }
      return day;
    });
    setOrderData(newData);
  };

  const handleSubmit = async () => {
    const sendData = {
      user: userId,       // ログインしたユーザー名
      orders: orderData,  // 注文データ（全日付分）
    };
  
    try {
      const response = await fetch("https://script.google.com/macros/s/【ここにGASのURL】/exec", {
        method: "POST",
        body: JSON.stringify(sendData),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        alert("スプレッドシートに送信しました！");
      } else {
        alert("送信に失敗しました。");
      }
    } catch (error) {
      alert("ネットワークエラーが発生しました。");
      console.error(error);
    }
  };
  

  // ▼ ログイン画面（ログイン前）
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

  // ▼ 注文画面（ログイン後）
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ようこそ、{userId} さん</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderData.map((day, idx) => (
          <div key={idx} className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">{formatJapaneseDate(day.date)}</h2>
            {menus.map((menu) => (
              <div key={menu} className="flex items-center justify-between mb-1">
                <span>{menu}</span>
                <select
                  value={day.quantities[menu]}
                  onChange={(e) => handleChange(day.date, menu, e.target.value)}
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
      <div className="mt-6 text-center">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          注文を送信する
        </button>
      </div>
    </div>
  );
}

export default App;
