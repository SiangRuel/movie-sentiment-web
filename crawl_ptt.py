@app.route("/crawl", methods=["POST"])
def crawl_movie():
    keyword = request.json.get("keyword", "")

    import requests
    from bs4 import BeautifulSoup

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0", "Cookie": "over18=1"})

    url = "https://www.ptt.cc/bbs/movie/index.html"
    res = session.get(url, timeout=5)
    soup = BeautifulSoup(res.text, "html.parser")

    posts = soup.select(".title a")

    comments = []

    for p in posts[:20]:
        title = p.text

        if keyword.lower() in title.lower():
            post_url = "https://www.ptt.cc" + p["href"]

            post_res = session.get(post_url, timeout=5)
            post_soup = BeautifulSoup(post_res.text, "html.parser")

            pushes = post_soup.select(".push")

            for push in pushes:
                content = push.select_one(".push-content")
                if content:
                    text = content.get_text().replace(":", "").strip()
                    if len(text) > 5:
                        comments.append(text)

    # ⭐ 直接分析（關鍵）
    preds = [analyze_sentiment_rule(r) for r in comments]

    pos = preds.count(1)
    neg = preds.count(0)
    neu = preds.count(-1)

    return jsonify(
        {
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "total": len(comments),
            "keywords": get_keywords(comments),
            "reviews": [
                {
                    "text": r,
                    "label": (
                        "🟢 正面" if p == 1 else "🔴 負面" if p == 0 else "⚪ 中立"
                    ),
                }
                for r, p in zip(comments[:50], preds[:50])
            ],
        }
    )
