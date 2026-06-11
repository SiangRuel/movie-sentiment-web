if (
  !sessionStorage.getItem("user")
) {
  window.location.href = "/login";
}
let chart;


// ⭐ 共用 UI 更新（🔥核心）
function updateUI(data) {
  const positiveCount =
    (data.very_positive || 0) +
    (data.positive || 0);

  const positiveRate =
    data.analyzed_reviews > 0
      ? (
        (positiveCount /
          data.analyzed_reviews) *
        100
      ).toFixed(1)
      : 0;

  document.getElementById("resultText").innerHTML = `

<div class="stat-box">
  <div class="stat-value">${data.tmdb_total_reviews}</div>
  <div class="stat-label">TMDB評論數</div>
</div>
<div class="stat-box">
  <div class="stat-value">${data.rating}</div> 
  <div class="stat-label">TMDB評分</div>
</div>
<div class="stat-box">
  <div class="stat-value">${data.very_positive}</div>
  <div class="stat-label">非常正面</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.positive}</div>
  <div class="stat-label">偏正面</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.neutral}</div>
  <div class="stat-label">中立</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.negative}</div>
  <div class="stat-label">偏負面</div>
</div>

<div class="stat-box">
  <div class="stat-value">${data.very_negative}</div>
  <div class="stat-label">非常負面</div>
</div>


`;

  // ⭐ 圖表
  if (chart) chart.destroy();

  const total = data.positive + data.negative + data.neutral;

  chart = new Chart(document.getElementById("chart"), {
    type: 'pie',
    data: {
      labels: [
        "非常正面",
        "偏正面",
        "中立",
        "偏負面",
        "非常負面"
      ],
      datasets: [{
        data: [
          data.very_positive,
          data.positive,
          data.neutral,
          data.negative,
          data.very_negative
        ],
        backgroundColor: [
          "#16a34a", // 非常正面
          "#4ade80", // 偏正面
          "#cbd5e1", // 中立
          "#fb7185", // 偏負面
          "#dc2626"  // 非常負面
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
const rvList =
  document.getElementById("reviews");

rvList.innerHTML = "";

data.reviews.forEach((r, i) => {

  const li =
    document.createElement("li");

  li.innerHTML = `

    <div class="review-label">
      ${r.label}
    </div>

    <div
      id="review-${i}"
      data-original="${encodeURIComponent(r.text)}"
    >
      ${r.text}
    </div>

    <a
      href="#"
      onclick="
        toggleTranslate(
          'review-${i}',
          this
        );
        return false;
      "
    >
      翻譯年糕
    </a>

  `;

  rvList.appendChild(li);

});




// ⭐ Positive Reviews

const topPositive =
  document.getElementById("topPositive");

if (topPositive) {

  topPositive.innerHTML = `
    <div class="review-card">

      ${data.five_star_reviews?.length
        ? data.five_star_reviews
            .map(
              (r, i) => `
      <div class="review-item">

        <div
          class="review-label"
          style="color:#facc15;"
        >
          ${r.label}
        </div>

        <div
          id="pos-${i}"
          class="review-text collapsed"
          data-original="${encodeURIComponent(r.text)}"
        >
          ${r.text}
        </div>

        ${r.text.length > 300
          ? `
          <a
            href="#"
            onclick="
              toggleReview(
                'pos-${i}',
                this
              );
              return false;
            "
          >
            展開
          </a>
          `
          : ""
        }

        &nbsp;

        <a
          href="#"
          onclick="
            toggleTranslate(
              'pos-${i}',
              this
            );
            return false;
          "
        >
          翻譯年糕
        </a>

      </div>
      `
            )
            .join("")
        : "尚無資料"
      }

    </div>
  `;
}

// ⭐ Negative Reviews



const topNegative =
document.getElementById("topNegative");

if (topNegative) {

topNegative.innerHTML = ` <div class="review-card">


  ${data.one_star_reviews?.length
    ? data.one_star_reviews
        .map(
          (r, i) => `
  <div class="review-item">

    <div
      class="review-label"
      style="color:#facc15;"
    >
      ${r.label}
    </div>

    <div
      id="neg-${i}"
      class="review-text collapsed"
      data-original="${encodeURIComponent(r.text)}"
    >
      ${r.text}
    </div>

    ${r.text.length > 300
      ? `
      <a
        href="#"
        onclick="
          toggleReview(
            'neg-${i}',
            this
          );
          return false;
        "
      >
        展開
      </a>
      `
      : ""
    }

    &nbsp;

    <a
      href="#"
      onclick="
        toggleTranslate(
          'neg-${i}',
          this
        );
        return false;
      "
    >
      翻譯年糕
    </a>

  </div>
  `
        )
        .join("")
    : "尚無資料"
  }

</div>


`;
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
  const summaryBox =
    document.getElementById("movieSummary");

  if (summaryBox) {

    let summary =
      data.ai_summary || "";

    summary = summary.replace(
      /^\s*觀眾喜歡/m,
      '<i class="fa-solid fa-thumbs-up"></i>觀眾喜歡'
    );

    summary = summary.replace(
      /^\s*觀眾不喜歡/m,
      '<i class="fa-solid fa-thumbs-down"></i>觀眾不喜歡'
    );

    summary = summary.replace(
      /^\s*整體評價/m,
      '<i class="fa-solid fa-star"></i>整體評價'
    );
    summaryBox.innerHTML = `
<div class="summary-box">
  <div class="summary-content">
    ${summary}
  </div>
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

  const input =
    document.getElementById("movieInput");
  document.getElementById("movieInfo").innerHTML = "";

  document.getElementById("reviews").innerHTML = "";

  document.getElementById("topPositive").innerHTML = "";

  document.getElementById("topNegative").innerHTML = "";

  document.getElementById("recommendation").innerHTML = "";

  document.getElementById("movieSummary").innerHTML = "";

  if (chart) {
    chart.destroy();
  }

  const keyword = input.value;

  if (!keyword) {
    alert("請輸入電影名稱");
    return;
  }

  input.blur();   // ← 讓游標消失

  document.body.insertAdjacentHTML(
    "beforeend",
    `
<div id="globalLoading" class="loading-box">
  <div class="loader"></div>
  <span>Loading...</span>
</div>
`
  );

  const res = await fetch("/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword })
  });
  const data = await res.json();
  document
    .getElementById("globalLoading")
    ?.remove();

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
評分人數：${data.vote_count}
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
TMDB評論數：${data.tmdb_total_reviews}
</p>

  </div>

</div>
<div class="cast-section">

  <h3>
    <i class="fa-solid fa-user-group"></i>
    Top Cast / 主要演員
  </h3>

  <div class="cast-wrapper">

  <button
    class="cast-arrow"
    onclick="scrollCast(-300)"
  >
    <i class="fa-solid fa-chevron-left"></i>
  </button>

  <div
    class="cast-list"
    id="castList"
  >

    ${data.cast
        ?.map(
          actor => `
        <div class="cast-card">

          <img
            src="${actor.profile}"
            alt="${actor.name}"
          >

          <span>
            ${actor.name}
          </span>

        </div>
      `
        )
        .join("")
      }

  </div>

  <button
    class="cast-arrow"
    onclick="scrollCast(300)"
  >
    <i class="fa-solid fa-chevron-right"></i>
  </button>

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
}// ======================
// 回到頂部按鈕
// ======================

const backToTop =
  document.getElementById("backToTop");

window.addEventListener(
  "scroll",
  () => {
    if (window.scrollY > 300) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  }
);

backToTop.addEventListener(
  "click",
  () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
);
function scrollCast(distance) {

  const castList =
    document.getElementById(
      "castList"
    );

  if (!castList) return;

  castList.scrollBy({
    left: distance,
    behavior: "smooth"
  });
}
function quickSearch(movie) {

  const input =
    document.getElementById(
      "movieInput"
    );

  input.value = movie;

  crawlMovie();
}
document
  .getElementById("movieInput")
  .addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        crawlMovie();

      }
    }
  );
// ======================
// Login / Logout
// ======================

const userArea =
  document.getElementById("userArea");

if (userArea) {

  const user =
    sessionStorage.getItem("user");
  if (user) {

    userArea.innerHTML = `
      <span class="user-name">
        <i class="fa-solid fa-user"></i>
        ${user}
      </span>

      <button
        class="logout-btn"
        onclick="logout()">
        Logout
      </button>
    `;

  } else {

    userArea.innerHTML = `
      <button
        class="login-btn"
        onclick="window.location.href='/login'">
        Login
      </button>
    `;

  }

}

function logout() {

  sessionStorage.removeItem(
    "user"
  );

  window.location.href =
    "/login";

}
function toggleReview(id, btn) {

  const el =
    document.getElementById(id);

  if (
    el.classList.contains(
      "collapsed"
    )
  ) {

    el.classList.remove(
      "collapsed"
    );

    el.classList.add(
      "expanded"
    );

    btn.innerText = "收起";

  } else {

    el.classList.remove(
      "expanded"
    );

    el.classList.add(
      "collapsed"
    );

    btn.innerText = "展開";

  }

}

async function toggleTranslate(
  reviewId,
  btn
) {

  const review =
    document.getElementById(reviewId);

  const original =
    decodeURIComponent(
      review.dataset.original
    );

  // 已經翻譯過
  if (review.dataset.translated) {

    if (
      btn.innerText === "顯示原文"
    ) {

      review.innerHTML =
        original;

      btn.innerText =
        "翻譯年糕";

    } else {

      review.innerHTML =
        review.dataset.translated;

      btn.innerText =
        "顯示原文";

    }

    return;
  }

  btn.innerText =
    "翻譯中...";

  const res = await fetch(
    "/translate",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        text: original
      })
    }
  );

  const data =
    await res.json();

  // 存起來
  review.dataset.translated =
    data.translation;

  review.innerHTML =
    data.translation;

  btn.innerText =
    "顯示原文";
}