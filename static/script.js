let chart;

// ⭐ 主分析
async function analyze() {
  document.getElementById("result").innerText = "分析中...";

  const res = await fetch("/analyze");
  const data = await res.json();

  updateUI(data);
}


// ⭐ 共用 UI 更新（🔥核心）
function updateUI(data) {
  document.getElementById("result").innerText =
    `總評論：${data.total} ｜ 正面：${data.positive} ｜ 負面：${data.negative} ｜ 中立：${data.neutral}`;

  // ⭐ 圖表
  if (chart) chart.destroy();

  const total = data.positive + data.negative + data.neutral;

  chart = new Chart(document.getElementById("chart"), {
    type: 'pie',
    data: {
      labels: ["正面", "負面", "中立"],
      datasets: [{
        data: [data.positive, data.negative, data.neutral],
        backgroundColor: ["#48d266", "#fb7185", "#94a3b8"]
      }]
    },
    options: {
      responsive: true,
      animation: { animateScale: true },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let value = context.raw;
              let percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });

  // ⭐ Keywords
  const kwList = document.getElementById("keywords");
  kwList.innerHTML = "";
  data.keywords.forEach(k => {
    const li = document.createElement("li");
    li.innerText = `${k[0]} (${k[1]})`;
    kwList.appendChild(li);
  });

  // ⭐ Reviews
  const rvList = document.getElementById("reviews");
  rvList.innerHTML = "";
  data.reviews.forEach(r => {
    const li = document.createElement("li");
    li.innerText = `${r.text} ${r.label}`;
    rvList.appendChild(li);
  });
}


// ⭐ 使用者輸入分析
async function analyzeText() {
  const text = document.getElementById("userText").value;

  if (!text) {
    document.getElementById("userResult").innerText = "請輸入評論";
    return;
  }

  document.getElementById("userResult").innerText = "分析中...";

  const res = await fetch("/analyze_text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  document.getElementById("userResult").innerText = data.result;
}


// ⭐ 電影比較
async function compare() {
  document.getElementById("compareResult").innerText = "比較中...";

  const res = await fetch("/compare");
  const data = await res.json();

  document.getElementById("compareResult").innerText =
    `🎬 電影A ➜ 正面 ${data.movie1.positive} ｜ 負面 ${data.movie1.negative}
🎬 電影B ➜ 正面 ${data.movie2.positive} ｜ 負面 ${data.movie2.negative}`;
}


// ⭐ AI聊天
async function askAI() {
  const input = document.getElementById("aiInput");
  const text = input.value;
  if (!text) return;

  const box = document.getElementById("aiBox");

  box.innerHTML += `<div class="ai-msg user-msg">👤 ${text}</div>`;
  box.innerHTML += `<div class="ai-msg bot-msg loading">🤖 分析中<span>.</span><span>.</span><span>.</span></div>`;
  box.scrollTop = box.scrollHeight;

  input.value = "";

  const res = await fetch("/analyze_text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();

  document.querySelector(".loading")?.remove();
  typeEffect(`🤖 分析結果：${data.result}`, box);
}


// ⭐ 打字動畫
function typeEffect(text, container) {
  let i = 0;
  const div = document.createElement("div");
  div.className = "ai-msg bot-msg";
  container.appendChild(div);

  function typing() {
    if (i < text.length) {
      div.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, 30);
      container.scrollTop = container.scrollHeight;
    }
  }
  typing();
}


// ⭐ ⭐ ⭐ 關鍵修正（最重要‼️）
async function crawlMovie() {
  const keyword = document.getElementById("movieInput").value;

  if (!keyword) {
    alert("請輸入電影名稱");
    return;
  }

  document.getElementById("result").innerText = "🔄 抓取中...";

  const res = await fetch("/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword })
  });

  const data = await res.json();

  console.log("crawl結果：", data);

  if (!data.reviews || data.reviews.length === 0) {
    document.getElementById("result").innerText = "找不到相關評論";
    return;
  }

  // ⭐ ⭐ ⭐ 直接用 crawl 回傳更新全部 UI
  updateUI(data);
}