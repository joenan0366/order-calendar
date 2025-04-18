import { useState } from "react";
import "./App.css"; // 必要に応じてカスタムCSS（今は未使用）

const menus = ["1stmenu A", "2ndmenu B", "Best menu"];
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

function App() {
  const [orderData, setOrderData] = useState(getNext7Days());

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

  const handleSubmit = () => {
    console.log("送信データ：", orderData);
    alert("注文を送信しました！（仮）");
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">注文カレンダー</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderData.map((day, idx) => (
          <div key={idx} className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">
             {formatJapaneseDate(day.date)}
               </h2>

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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          注文を送信
        </button>
      </div>
    </div>
  );
}

const formatJapaneseDate = (dateString) => {
  const date = new Date(dateString);
  const options = { month: '2-digit', day: '2-digit' };
  const dayStr = date.toLocaleDateString('ja-JP', options); // 01/11 など
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${dayStr.replace('/', '月')}日(${dayOfWeek})`;
};

export default App;
