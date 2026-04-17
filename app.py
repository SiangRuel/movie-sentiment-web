from flask import Flask, render_template, jsonify, request
import json
from collections import Counter
import re

app = Flask(__name__)

with open("reviews.json", encoding="utf-8") as f:
    reviews = json.load(f)

positive_words = [
    "good",
    "great",
    "amazing",
    "love",
    "excellent",
    "好",
    "喜歡",
    "精彩",
    "優秀",
    "棒",
]

negative_words = [
    "bad",
    "terrible",
    "boring",
    "hate",
    "worst",
    "差",
    "爛",
    "無聊",
    "討厭",
    "糟",
    "不好",
    "奇怪",
    "垃圾",
    "爛掉",
    "膩",
    "失利",
    "不看",
    "不敢看",
    "傻眼",
    "看不下去",
    "雷",
    "很爛",
    "崩",
    "失望",
    "糟糕",
    "無言",
    "中猴",
    "不正常",
    "不喜歡",
    "不對",
    "不行",
]


# ⭐ 情感分析（含中立）
def analyze_sentiment_rule(text):
    text = text.lower()
    score = 0

    for w in positive_words:
        if w in text:
            score += 1

    for w in negative_words:
        if w in text:
            score -= 1

    if score > 0:
        return 1
    elif score < 0:
        return 0
    else:
        return -1  # 中立


# ⭐ 關鍵字（支援中文）
def get_keywords(data):
    words = []
    for r in data:
        words += re.findall(r"[\u4e00-\u9fff]+|\b\w+\b", r.lower())
    return Counter(words).most_common(10)


@app.route("/")
def home():
    return render_template("index.html")


# ⭐ 主分析（含中立）
@app.route("/analyze")
def analyze():
    preds = [analyze_sentiment_rule(r) for r in reviews]

    pos = preds.count(1)
    neg = preds.count(0)
    neu = preds.count(-1)
    total = len(preds)

    return jsonify(
        {
            "positive": pos,
            "negative": neg,
            "neutral": neu,  # ⭐ 新增
            "total": total,
            "keywords": get_keywords(reviews),
            "reviews": [
                {
                    "text": r,
                    "label": (
                        "🟢 正面" if p == 1 else "🔴 負面" if p == 0 else "⚪ 中立"
                    ),
                }
                for r, p in zip(reviews[:50], preds[:50])
            ],
        }
    )


# ⭐ 使用者輸入分析（修正中立）
@app.route("/analyze_text", methods=["POST"])
def analyze_text():
    text = request.json.get("text", "")
    result = analyze_sentiment_rule(text)

    if result == 1:
        label = "🟢 正面"
    elif result == 0:
        label = "🔴 負面"
    else:
        label = "⚪ 中立"

    return jsonify({"result": label})


# ⭐ 比較（修正錯誤‼️）
@app.route("/compare")
def compare():
    other_reviews = reviews[::-1]

    def calc(data):
        preds = [analyze_sentiment_rule(r) for r in data]
        return {
            "positive": preds.count(1),
            "negative": preds.count(0),
            "neutral": preds.count(-1),
        }

    return jsonify(
        {
            "movie1": calc(reviews),
            "movie2": calc(other_reviews),
        }
    )


@app.route("/crawl", methods=["POST"])
def crawl_movie():
    keyword = request.json.get("keyword", "")

    import requests
    from bs4 import BeautifulSoup

    url = "https://www.ptt.cc/bbs/movie/index.html"
    headers = {"User-Agent": "Mozilla/5.0", "Cookie": "over18=1"}

    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")

    posts = soup.select(".title a")

    comments = []

    for p in posts[:20]:
        title = p.text

        # ⭐ 關鍵：篩選電影名稱
        if keyword.lower() in title.lower():
            post_url = "https://www.ptt.cc" + p["href"]

            post_res = requests.get(post_url, headers=headers)
            post_soup = BeautifulSoup(post_res.text, "html.parser")

            pushes = post_soup.select(".push")

            for push in pushes:
                content = push.select_one(".push-content")
                if content:
                    text = content.get_text().replace(":", "").strip()
                    if len(text) > 5:
                        comments.append(text)
    print("抓到留言數：", len(comments))
    return jsonify({"reviews": comments, "count": len(comments)})


@app.route("/analyze_text_batch", methods=["POST"])
def analyze_text_batch():
    data = request.json.get("reviews", [])

    preds = [analyze_sentiment_rule(r) for r in data]

    return jsonify(
        {
            "positive": preds.count(1),
            "negative": preds.count(0),
            "neutral": preds.count(-1),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
