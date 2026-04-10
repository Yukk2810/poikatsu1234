"""
案件正規化・統合・差分計算
- 表記ゆれを吸収して同一案件を1つに統合
- 前回データとの差分（deltaToday）を計算
- フロントエンドが読むJSONを生成
"""

import re
import json
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher
from collections import defaultdict
from .base import RawOffer


# ────────────────────────────────────────────
# テキスト正規化
# ────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """全角→半角、大文字→小文字、記号除去、空白除去"""
    text = unicodedata.normalize("NFKC", text)
    text = text.lower()
    text = re.sub(r"[【】「」『』（）()［］\[\]　\s]", "", text)
    text = re.sub(r"[^\w\u3040-\u30ff\u4e00-\u9fff]", "", text)
    return text.strip()


def similarity(a: str, b: str) -> float:
    na, nb = normalize_text(a), normalize_text(b)
    return SequenceMatcher(None, na, nb).ratio()


# ────────────────────────────────────────────
# 同一案件統合
# ────────────────────────────────────────────

SIMILARITY_THRESHOLD = 0.82


def group_offers(all_offers: list[RawOffer]) -> list[dict]:
    """
    複数サイトの案件を同一案件でグループ化して代表案件を作る
    """
    groups: list[list[RawOffer]] = []

    for offer in all_offers:
        matched = False
        for group in groups:
            rep = group[0]
            if similarity(offer.offer_name, rep.offer_name) >= SIMILARITY_THRESHOLD:
                group.append(offer)
                matched = True
                break
        if not matched:
            groups.append([offer])

    canonical_offers = []
    for group in groups:
        canonical = _build_canonical(group)
        canonical_offers.append(canonical)

    return canonical_offers


def _build_canonical(group: list[RawOffer]) -> dict:
    """グループから代表案件dictを構築"""
    # 最高還元のサイトを代表にする
    best = max(group, key=lambda o: o.reward_normalized)

    # サイト別データ
    site_offers = []
    seen_sites = set()
    for o in sorted(group, key=lambda x: x.reward_normalized, reverse=True):
        if o.site_id in seen_sites:
            continue
        seen_sites.add(o.site_id)
        site_offers.append({
            "siteId": o.site_id,
            "siteName": o.site_name,
            "siteColor": o.site_color,
            "rewardValue": o.reward_value,
            "rewardType": o.reward_type,
            "rewardNormalized": o.reward_normalized,
            "rewardText": o.reward_text,
            "offerUrl": o.offer_url,
            "status": "active",
            "observedAt": o.observed_at,
        })

    # IDは代表案件名から生成
    canonical_id = re.sub(r"[^\w]", "-", normalize_text(best.offer_name))[:60]

    return {
        "id": canonical_id,
        "name": best.offer_name,
        "advertiserName": best.advertiser_name,
        "category": best.category,
        "deviceType": best.device_type,
        "bestSiteId": best.site_id,
        "bestSiteName": best.site_name,
        "bestSiteColor": best.site_color,
        "bestRewardValue": best.reward_value,
        "bestRewardType": best.reward_type,
        "bestRewardNormalized": best.reward_normalized,
        "bestRewardText": best.reward_text,
        "siteOffers": site_offers,
        "rewardHistory": [],   # 後で履歴とマージ
        "deltaToday": 0,
        "deltaTodayPercent": 0,
        "isAllTimeHigh": False,
        "isNewToday": False,
        "isTrending": False,
        "recommendScore": 0,
        "updatedAt": best.observed_at,
    }


# ────────────────────────────────────────────
# 履歴マージ・差分計算
# ────────────────────────────────────────────

def merge_history(new_offers: list[dict], prev_data: dict | None) -> list[dict]:
    """
    前回のJSONデータと新規データをマージして差分を計算する
    prev_data: 前回保存したoffers.jsonの内容
    """
    prev_map: dict[str, dict] = {}
    if prev_data and "offers" in prev_data:
        for o in prev_data["offers"]:
            prev_map[o["id"]] = o

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for offer in new_offers:
        oid = offer["id"]
        prev = prev_map.get(oid)

        # 履歴を引き継ぐ
        history = prev["rewardHistory"] if prev else []

        # 今日のエントリを追加（既存の今日分は上書き）
        today_entry = {
            "date": today,
            "value": offer["bestRewardNormalized"],
            "siteId": offer["bestSiteId"],
        }
        history = [h for h in history if h["date"] != today]
        history.append(today_entry)
        # 直近30日分のみ保持
        history = sorted(history, key=lambda h: h["date"])[-30:]
        offer["rewardHistory"] = history

        # 差分計算（前日比）
        if prev:
            prev_val = prev["bestRewardNormalized"]
            cur_val = offer["bestRewardNormalized"]
            offer["deltaToday"] = round(cur_val - prev_val, 2)
            offer["deltaTodayPercent"] = (
                round((cur_val - prev_val) / prev_val * 100, 1) if prev_val > 0 else 0
            )
            # 過去最高チェック
            all_time_high = max((h["value"] for h in history), default=0)
            offer["isAllTimeHigh"] = (cur_val >= all_time_high and cur_val > 0)
            offer["isNewToday"] = False
        else:
            offer["deltaToday"] = 0
            offer["deltaTodayPercent"] = 0
            offer["isAllTimeHigh"] = False
            offer["isNewToday"] = True  # 初登場案件

        # トレンド判定（直近3日間で上昇トレンド）
        if len(history) >= 3:
            recent = [h["value"] for h in history[-3:]]
            offer["isTrending"] = recent[-1] > recent[0] and recent[-1] > 0
        else:
            offer["isTrending"] = False

        # レコメンドスコア計算
        offer["recommendScore"] = _calc_score(offer)

    # スコア降順でソート
    new_offers.sort(key=lambda o: o["recommendScore"], reverse=True)
    return new_offers


def _calc_score(offer: dict) -> int:
    """
    おすすめスコア（0〜100）
    還元額・上昇額・上昇率・過去最高・新着・サイト数を加味
    """
    score = 0

    # 還元額スコア（最大40点）
    reward = offer["bestRewardNormalized"]
    if reward >= 10000:
        score += 40
    elif reward >= 5000:
        score += 30
    elif reward >= 3000:
        score += 20
    elif reward >= 1000:
        score += 10

    # 上昇額スコア（最大25点）
    delta = offer["deltaToday"]
    if delta >= 3000:
        score += 25
    elif delta >= 1000:
        score += 18
    elif delta >= 500:
        score += 12
    elif delta > 0:
        score += 6

    # 過去最高（15点）
    if offer["isAllTimeHigh"]:
        score += 15

    # トレンド（10点）
    if offer["isTrending"]:
        score += 10

    # 複数サイト掲載（最大10点）
    site_count = len(offer["siteOffers"])
    score += min(site_count * 2, 10)

    return min(score, 100)
