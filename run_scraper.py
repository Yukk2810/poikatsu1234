"""
メインスクリプト
実行: python run_scraper.py

処理フロー:
1. 4サイトのスクレイパーを順次実行
2. 全案件を正規化・同一案件統合
3. 前回データと差分計算
4. public/offers.json に出力（フロントエンドが読む）
"""

import json
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

from scraper import ALL_SCRAPERS
from scraper.normalizer import group_offers, merge_history

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

OUTPUT_PATH = Path("public/offers.json")


def load_prev() -> dict | None:
    if OUTPUT_PATH.exists():
        try:
            return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def main():
    logger.info("=== スクレイプ開始 ===")
    start_time = datetime.now(timezone.utc)

    all_raw_offers = []
    site_results = []

    for ScraperClass in ALL_SCRAPERS:
        scraper = ScraperClass()
        result = scraper.run()

        site_results.append({
            "siteId": result.site_id,
            "success": result.success,
            "offerCount": len(result.offers),
            "error": result.error,
            "durationSec": round(result.duration_sec, 1),
        })

        if result.success:
            all_raw_offers.extend(result.offers)
        else:
            logger.error(f"{result.site_id} 失敗: {result.error}")

    logger.info(f"合計取得: {len(all_raw_offers)}件")

    # 前回データ読み込み
    prev_data = load_prev()

    # 正規化・統合・差分計算
    logger.info("正規化・統合処理中...")
    canonical = group_offers(all_raw_offers)
    canonical = merge_history(canonical, prev_data)

    logger.info(f"統合後: {len(canonical)}案件")

    # JSON出力（取得0件でも出力してフロントのフォールバックに任せる）
    output = {
        "updatedAt": start_time.isoformat(),
        "totalOffers": len(canonical),
        "totalSites": len([r for r in site_results if r["success"]]),
        "siteResults": site_results,
        "offers": canonical,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    logger.info(f"出力完了: {OUTPUT_PATH}")

    # 全サイト失敗の場合のみ終了コード1
    failed = [r for r in site_results if not r["success"]]
    if failed:
        logger.warning(f"失敗サイト: {[r['siteId'] for r in failed]}")
        if len(failed) == len(ALL_SCRAPERS):
            logger.error("全サイト失敗")
            sys.exit(1)

    logger.info("=== 完了 ===")


if __name__ == "__main__":
    main()

