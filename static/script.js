let chart;


// ⭐ 共用 UI 更新（🔥核心）
function updateUI(data) {
  const positiveRate =
    data.total > 0
      ? ((data.positive / data.total) * 100).toFixed(1)
      : 0;

  document.getElementById("resultText").innerHTML = `

<div class="stat-box">
  <div class="stat-value">${data.total}</div>
  <div class="stat-label">總評論數</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.positive}</div>
  <div class="stat-label">正面評論</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.negative}</div>
  <div class="stat-label">負面評論</div>
</div>

<div class="stat-box">
  <div class="stat-value">${positiveRate}%</div>
  <div class="stat-label">好評率</div>
</div>

`;

  // ⭐ 圖表
  if (chart) chart.destroy();

  const total = data.positive + data.negative + data.neutral;

  chart = new Chart(document.getElementById("chart"), {
    type: 'pie',
    data: {
      labels: ["正面", "負面", "中立"],
      datasets: [{
        data: [data.positive, data.negative, data.neutral],
        backgroundColor: [
          "#4ade80",
          "#fb7185",
          "#cbd5e1"
        ]
      }]
    },
    options: {
      responsive: true,
      animation: { animateScale: true },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#fff",
            padding: 20,
            font: {
              size: 14
            }, elements: {
              arc: {
                borderWidth: 3,
                borderColor: "#ffffff"
              }
            },

          }
        },

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


  // ⭐ Reviews
  const rvList = document.getElementById("reviews");
  rvList.innerHTML = "";
  data.reviews.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
${r.text}

<span class="${r.label.includes("正面")
        ? "positive-tag"
        : "negative-tag"
      }">
  <i class="${r.label.includes("正面")
        ? "fa-solid fa-thumbs-up"
        : "fa-solid fa-thumbs-down"
      }"></i>

  ${r.label}
</span>
`;
    rvList.appendChild(li);
  });
  // ⭐ Positive Reviews

  const positiveReviews =
    data.reviews.filter(r =>
      r.label.includes("正面")
    );

  const topPositive =
    document.getElementById("topPositive");

  if (topPositive) {

    topPositive.innerHTML =
      positiveReviews
        .slice(0, 5)
        .map(r =>
          `<p>${r.text}</p>`
        )
        .join("");

  }// ⭐ Negative Reviews

  const negativeReviews =
    data.reviews.filter(r =>
      r.label.includes("負面")
    );

  const topNegative =
    document.getElementById("topNegative");

  if (topNegative) {

    topNegative.innerHTML =
      negativeReviews
        .slice(0, 5)
        .map(r =>
          `<p>${r.text}</p>`
        )
        .join("");

  }


  // ⭐ 推薦指數

  let grade = "D";

  if (positiveRate >= 90) {
    grade = "A+";
  }
  else if (positiveRate >= 80) {
    grade = "A";
  }
  else if (positiveRate >= 70) {
    grade = "B";
  }
  else if (positiveRate >= 60) {
    grade = "C";
  }
  else {
    grade = "D";
  }
  const recommendBox =
    document.getElementById("recommendation");

  if (recommendBox) {
    recommendBox.innerHTML = `
    <div class="recommend-box">

      <i class="fa-solid fa-award recommend-icon"></i>

      <h1>${grade}</h1>

      <h3>好評率 ${positiveRate}%</h3>

    </div>
    `;
  } const positiveReview =
    data.reviews.find(
      r => r.label.includes("正面")
    );

  const negativeReview =
    data.reviews.find(
      r => r.label.includes("負面")
    );
  // ⭐ AI分析摘要

  let summary = "";

  if (positiveRate >= 90) {
    summary =
      "觀眾評價極佳，整體口碑非常正面，屬於高度推薦電影。";
  }
  else if (positiveRate >= 80) {
    summary =
      "整體評價優秀，多數觀眾給予正面回饋。";
  }
  else if (positiveRate >= 70) {
    summary =
      "觀眾評價良好，但仍有部分負面意見。";
  }
  else if (positiveRate >= 60) {
    summary =
      "觀眾意見較為分歧，建議參考評論內容後再決定。";
  }
  else {
    summary =
      "整體評價偏低，負面評論比例較高。";
  }

  const summaryBox =
    document.getElementById("movieSummary");

  if (summaryBox) {
    summaryBox.innerHTML = `
<div class="summary-box">

  <p>
    本次分析 ${data.total} 則評論，
    正面評論 ${data.positive} 則，
    負面評論 ${data.negative} 則。
  </p>

  <p>${summary}</p>

  <hr>

  <h4>
  <i class="fa-solid fa-trophy"></i>
  Best Review
</h4>

  <p>
    ${positiveReview?.text || "N/A"}
  </p>

  <h4>
  <i class="fa-solid fa-circle-exclamation"></i>
  Worst Review
</h4>
  <p>
    ${negativeReview?.text || "N/A"}
  </p>

</div>
`;
  }
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

  document.getElementById("resultText").innerHTML = `
<div class="loading-box">
  <div class="loader"></div>
  <span>Loading...</span>
</div>
`;

  const res = await fetch("/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword })
  });
  const data = await res.json();

  console.log("crawl結果：", data);
  const trailerArea =
    document.getElementById("trailerArea");

  if (data.trailer_key) {
    trailerArea.innerHTML = `
    <div class="trailer-wrapper">
      <iframe
        src="https://www.youtube.com/embed/${data.trailer_key}"
        title="Movie Trailer"
        allowfullscreen>
      </iframe>
    </div>
  `;
  } else {
    trailerArea.innerHTML = "";
  }

  if (data.poster) {
    document.getElementById("movieInfo").innerHTML = `

<div class="movie-card">

  <div class="movie-poster">
    <img
      src="${data.poster}"
      alt="${data.title}"
    >
  </div>

  <div class="movie-info">

    <h2>${data.title}</h2>

    <p>
<i class="fa-solid fa-star"></i>
TMDB評分：${data.rating}
</p>

<p>
<i class="fa-solid fa-users"></i>
投票數：${data.vote_count}
</p>

<p>
<i class="fa-solid fa-fire"></i>
熱度：${Math.round(data.popularity)}
</p>

<p>
<i class="fa-solid fa-globe"></i>
語言：${data.original_language}
</p>

<p>
<i class="fa-solid fa-calendar"></i>
上映日期：${data.release_date}
</p>

<p>
<i class="fa-solid fa-comments"></i>
評論數：${data.total}
</p>

  </div>

</div>

<div class="movie-overview">

  <h3>
  <i class="fa-solid fa-book-open"></i>
  劇情介紹
</h3>

  <p>
    ${data.overview || "暫無劇情介紹"}
  </p>

</div>

`;
  }
  if (!data.reviews || data.reviews.length === 0) {
    document.getElementById("resultText").innerHTML =
      "找不到相關評論";
    return;
  }

  // ⭐ ⭐ ⭐ 直接用 crawl 回傳更新全部 UI
  updateUI(data);
}