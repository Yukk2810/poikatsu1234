"""
Google Apps Script API からデータを取得して public/offers.json に保存する
GitHub Actions から定期実行する
"""

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("fetch_api")

API_BASE = "https://script.google.com/macros/s/AKfycbzqSpMv9hI4ResynZSpgTZFDRVrqIzy-5ykNg6zqb2jSV_pWuDuoyPSxTBu41El9Xcm/exec"
OUTPUT_PATH = Path("public/offers.json")

SITE_COLORS = {
    "Moppy":        "#FF6B9D",
    "Hapitas":      "#E85D26",
    "Gendama":      "#F5A623",
    "Pointtown":    "#4A90D9",
    "ハピタス":      "#E85D26",
    "モッピー":      "#FF6B9D",
    "げん玉":        "#F5A623",
    "ポイントタウン": "#4A90D9",
}

CATEGORY_MAP = {
    "クレカ":        "credit_card",
    "クレジットカード": "credit_card",
    "金融":          "credit_card",
    "証券":          "securities",
    "投資":          "securities",
    "FX":            "securities",
    "fx":            "securities",
    "通信":          "telecom",
    "回線":          "telecom",
    "SIM":           "telecom",
    "EC・サービス":  "telecom",
    "動画":          "video",
    "エンタメ":      "video",
    "旅行":          "travel",
    "ホテル":        "travel",
    "保険":          "insurance",
    "銀行":          "bank",
    "口座":          "bank",
    "ふるさと":      "furusato",
    "不動産":        "other",
    "不動産・住まい": "other",
    "ショッピング":  "shopping",
    "車":            "other",
    "その他":        "other",
}


def fetch_path(path: str) -> list:
    url = f"{API_BASE}?path={path}"
    logger.info(f"取得中: {url}")
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"  → {len(data)}件")
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.warning(f"  → 失敗: {e}")
        return []


def to_canonical(item: dict) -> dict:
    site_name = item.get("site_name", "")
    site_color = SITE_COLORS.get(site_name, "#888888")
    category = CATEGORY_MAP.get(item.get("category", ""), "other")
    diff_value = item.get("diff_value") or 0   # nullを0に変換
    diff_rate = item.get("diff_rate") or 0     # nullを0に変換
    tag = item.get("tag_raw", "")
    reward_value = item.get("reward_value", 0)
    updated_at = item.get("updated_at", datetime.now(timezone.utc).isoformat())

    is_ending = tag == 'まもなく終了'

    return {
        "id": item.get("offer_id", ""),
        "name": item.get("offer_name_raw", ""),
        "advertiserName": item.get("offer_name_raw", ""),
        "category": category,
        "deviceType": "all",
        "bestSiteId": site_name.lower(),
        "bestSiteName": site_name,
        "bestSiteColor": site_color,
        "bestRewardValue": reward_value,
        "bestRewardType": item.get("reward_type", "pt"),
        "bestRewardNormalized": reward_value,
        "siteOffers": [{
            "siteId": site_name.lower(),
            "siteName": site_name,
            "siteColor": site_color,
            "rewardValue": reward_value,
            "rewardType": item.get("reward_type", "pt"),
            "rewardNormalized": reward_value,
            "offerUrl": item.get("url", ""),
            "status": item.get("status", "active"),
            "observedAt": updated_at,
        }],
        "rewardHistory": [],
        "deltaToday": diff_value,
        "deltaTodayPercent": diff_rate,
        "isAllTimeHigh": tag == "超高還元",
        "isNewToday": False,
        "isTrending": tag == "人気急騰" or diff_rate > 5,
        "isEnding": is_ending,
        "tagRaw": tag,
        "recommendScore": item.get("recommend_score", 0),
        "updatedAt": updated_at,
    }


def main():
    logger.info("=== API取得開始 ===")

    today_data = fetch_path("today")
    trending_data = fetch_path("offers")  # 全件取得

    # 重複排除して統合（未取得案件は除外）
    seen = set()
    merged = []
    for item in [*today_data, *trending_data]:
        oid = item.get("offer_id", "")
        name = item.get("offer_name_raw", "")
        # 未取得案件・空データを除外
        if not oid or not name:
            continue
        if "未取得案件" in name:
            continue
        if oid not in seen:
            seen.add(oid)
            merged.append(item)

    logger.info(f"統合後: {len(merged)}件")

    if not merged:
        logger.error("データが0件のため終了")
        sys.exit(1)

    offers = [to_canonical(item) for item in merged]
    sites = list(set(item.get("site_name", "") for item in merged))

    output = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "totalOffers": len(offers),
        "totalSites": len(sites),
        "siteResults": [{"siteId": s, "success": True, "offerCount": 0} for s in sites],
        "offers": offers,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    logger.info(f"出力完了: {OUTPUT_PATH}")
    logger.info("=== 完了 ===")


if __name__ == "__main__":
    main()
