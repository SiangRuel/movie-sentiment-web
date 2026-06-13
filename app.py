from flask import Flask, render_template, jsonify, request, redirect
import json
from transformers import pipeline
from dotenv import load_dotenv
from openai import OpenAI
import os

app = Flask(__name__)
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
print("TMDB KEY OK:", TMDB_API_KEY[:5])


# 不用了
# classifier = pipeline("sentiment-analysis")



def analyze_sentiment_gpt(text):
    

    try:

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
你是專業電影評論分析師。

請判斷評論情緒。

只能回答：

2 = 非常正面
1 = 偏正面
0 = 中立
-1 = 偏負面
-2 = 非常負面

請考慮：

- 反諷
- 諷刺
- 混合評價
- 長篇評論
- 客觀分析

只回答數字。
""",
                },
                {"role": "user", "content": text},
            ],
        )

        result = response.choices[0].message.content.strip()

        try:
            return int(result)
        except:
            return 0

    except Exception as e:

        print("Sentiment Error:", e)

        return 0

def generate_ai_summary(movie_title, reviews):

    if not reviews:
        return "No reviews available."

    sample_reviews = reviews[:20]

    try:

        prompt = f"""
你是一位電影評論分析師。

電影名稱：

{movie_title}

請根據以下電影評論內容進行分析。

請使用繁體中文回答。

回答時請統一使用：

《{movie_title}》

不要自行翻譯電影名稱。
不要使用英文名稱。
不要創造新的中文譯名。

輸出格式：
觀眾喜歡
1.
2.
3.

觀眾不喜歡
1.
2.
3.

整體評價
用100字內總結電影口碑。
評論：

{chr(10).join(sample_reviews)}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except Exception as e:

        print("AI Summary Error:", e)

        return "AI summary unavailable."


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/")
def home():
    return redirect("/login")


@app.route("/dashboard")
def dashboard():
    return render_template("index.html")


# ⭐ 使用者輸入分析（修正中立）
@app.route("/analyze_text", methods=["POST"])
def analyze_text():

    text = request.json.get("text", "")
    result = analyze_sentiment_gpt(text)

    if result == 2:
        label = "⭐⭐⭐⭐⭐ 非常正面"

    elif result == 1:
        label = "⭐⭐⭐⭐ 偏正面"

    elif result == 0:
        label = "⭐⭐⭐ 中立"

    elif result == -1:
        label = "⭐⭐ 偏負面"

    else:
        label = "⭐ 非常負面"

    return jsonify({"result": label})

@app.route("/translate", methods=["POST"])
def translate():

    text = request.json.get("text", "")

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
{
    "role": "system",
    "content": """
請將電影評論翻譯成繁體中文。

要求：
- 保留原本情緒語氣
- 保留電影專有名詞
- 電影名稱使用台灣常見譯名
- 人名不要亂翻
- 影評術語請自然翻譯
- 不要額外解釋
- 只輸出翻譯結果
"""
},
                {
                    "role": "user",
                    "content": text
                }
            ]
        )

        result = response.choices[0].message.content

        return jsonify({"translation": result})

    except Exception as e:
        print("Translate Error:", e)
        return jsonify({"translation": "翻譯失敗"})

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
                "reviews": [],
            }
        )

    movie = movies[0]
    movie_id = movie["id"]
    language_map = {
    "en": "英文",
    "ko": "韓文",
    "ja": "日文",
    "zh": "中文"
    }

    language = movie.get("original_language", "")

    language_name = language_map.get(
        language,
        language
    )
    # =====================

    # 主要演員
    # =====================

    credits_res = requests.get(
        f"https://api.themoviedb.org/3/movie/{movie_id}/credits",
        params={"api_key": TMDB_API_KEY},
    )

    cast = credits_res.json().get("cast", [])

    cast_data = []

    for actor in cast:

        cast_data.append(
            {
                "name": actor.get("name"),
                "profile": (
                    "https://image.tmdb.org/t/p/w185" + actor["profile_path"]
                    if actor.get("profile_path")
                    else ""
                ),
            }
        )
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
    movie_name = movie.get("title") or movie.get("original_title")

    preds = [analyze_sentiment_gpt(c) for c in comments]

    ai_summary = generate_ai_summary(movie_name, comments)

    very_positive = preds.count(2)
    positive = preds.count(1)
    neutral = preds.count(0)
    negative = preds.count(-1)
    very_negative = preds.count(-2)
    five_star_reviews = []
    

    for r, p in zip(comments, preds):

        if p == 2:
            five_star_reviews.append({"text": r, "label": "★★★★★"})

  

    if not five_star_reviews:

        for r, p in zip(comments, preds):

            if p == 1:
                five_star_reviews.append({"text": r, "label": "★★★★☆"})


    one_star_reviews = []
    

    for r, p in zip(comments, preds):

        if p == -2:
            one_star_reviews.append({"text": r, "label": "★☆☆☆☆"})



    if not one_star_reviews:

        for r, p in zip(comments, preds):

            if p == -1:
                one_star_reviews.append({"text": r, "label": "★★☆☆☆"})

 

    review_data = []

    for r, p in zip(comments, preds):

        if p == 2:
            label = "★★★★★"

        elif p == 1:
            label = "★★★★☆"

        elif p == 0:
            label = "★★★☆☆"

        elif p == -1:
            label = "★★☆☆☆"

        else:
            label = "★☆☆☆☆"

        review_data.append({"text": r, "label": label})
    return jsonify(
        {
            "title": movie.get("title"),
            "cast": cast_data,
            "trailer_key": trailer_key,
            "rating": movie.get("vote_average"),
            "vote_count": movie.get("vote_count"),
            "popularity": movie.get("popularity"),
            "original_language": language_name,
            "release_date": movie.get("release_date"),
            "overview": movie.get("overview"),
            "poster": (
                "https://image.tmdb.org/t/p/w500" + movie["poster_path"]
                if movie.get("poster_path")
                else ""
            ),
            "tmdb_total_reviews": total_reviews,
            "analyzed_reviews": len(comments),
            "very_positive": very_positive,
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
            "very_negative": very_negative,
            "five_star_reviews": five_star_reviews,
            "one_star_reviews": one_star_reviews,
            "reviews": review_data,
            "ai_summary": ai_summary,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)
