from flask import Flask, render_template, jsonify, request
import json
from collections import Counter
import re
from transformers import pipeline
from dotenv import load_dotenv
import os

app = Flask(__name__)
load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
print("TMDB KEY OK:", TMDB_API_KEY[:5])


classifier = pipeline("sentiment-analysis")


# ⭐ 情感分析（含中立）
def analyze_sentiment_rule(text):
    result = classifier(text[:512])[0]

    label = result["label"].lower()

    if "positive" in label:
        return 1
    else:
        return 0


# ⭐ 關鍵字（支援中文）
def get_keywords(data):

    stop_words = {
        "電影",
        "真的",
        "覺得",
        "就是",
        "這部",
        "一下",
        "可以",
        "看到",
        "不是",
        "什麼",
        "這個",
        "那個",
        "第",
    }

    words = []

    for r in data:

        ws = re.findall(r"[\u4e00-\u9fff]{2,}", r)

        for w in ws:

            if w in stop_words:
                continue

            words.append(w)

    return Counter(words).most_common(10)


@app.route("/")
def home():
    return render_template("index.html")


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


@app.route("/crawl", methods=["POST"])
def crawl_movie():

    import requests

    keyword = request.json.get("keyword", "")

    search_res = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": TMDB_API_KEY, "query": keyword, "language": "zh-TW"},
    )

    movies = search_res.json().get("results", [])

    if not movies:
        return jsonify(
            {
                "total": 0,
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "keywords": [],
                "reviews": [],
            }
        )

    movie = movies[0]
    movie_id = movie["id"]
    first_review_res = requests.get(
        f"https://api.themoviedb.org/3/movie/{movie_id}/reviews",
        params={"api_key": TMDB_API_KEY},
    )

    total_reviews = first_review_res.json().get("total_results", 0)
    video_res = requests.get(
        f"https://api.themoviedb.org/3/movie/{movie_id}/videos",
        params={"api_key": TMDB_API_KEY},
    )

    videos = video_res.json().get("results", [])

    trailer_key = ""

    for v in videos:

        if v.get("site") == "YouTube" and v.get("type") == "Trailer":
            trailer_key = v.get("key")
            break

    comments = []

    for page in range(1, 6):  # 抓前5頁

        review_res = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}/reviews",
            params={
                "api_key": TMDB_API_KEY,
                "page": page,
            },
        )

        results = review_res.json().get("results", [])

        if not results:
            break

        for r in results:

            content = r.get("content", "")

            if content:
                comments.append(content)
    print(f"TMDB總評論: {total_reviews} | " f"實際分析: {len(comments)}")
    preds = [analyze_sentiment_rule(c) for c in comments]

    review_data = [
        {"text": r[:300], "label": ("正面" if p == 1 else "負面")}
        for r, p in zip(comments, preds)
    ]

    return jsonify(
        {
            "title": movie.get("title"),
            "trailer_key": trailer_key,
            "rating": movie.get("vote_average"),
            "vote_count": movie.get("vote_count"),
            "popularity": movie.get("popularity"),
            "original_language": movie.get("original_language"),
            "release_date": movie.get("release_date"),
            "overview": movie.get("overview"),
            "poster": (
                "https://image.tmdb.org/t/p/w500" + movie["poster_path"]
                if movie.get("poster_path")
                else ""
            ),
            "tmdb_total_reviews": total_reviews,
            "analyzed_reviews": len(comments),
            "positive": preds.count(1),
            "negative": preds.count(0),
            "neutral": 0,
            "keywords": get_keywords(comments),
            "reviews": review_data,
        }
    )


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
    app.run(debug=True, use_reloader=True)
