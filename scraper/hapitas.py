"""
ハピタス スクレイパー
対象API: https://hapitas.jp/api_item-categorized-ranking?limit=60&page=1
ログイン不要の公開API
"""

from datetime import datetime, timezone
from .base import BaseScraper, RawOffer
import re


def _normalize_reward(text: str) -> tuple[float, str, float]:
    text = str(text).strip().replace(",", "").replace("，", "").replace("\xa0", "")
    m = re.search(r"([\d.]+)\s*pt", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        return v, "pt", v
    m = re.search(r"([\d.]+)\s*円", text)
    if m:
        v = float(m.group(1))
        return v, "yen", v
    m = re.search(r"([\d.]+)\s*マイル", text)
    if m:
        v = float(m.group(1))
        return v, "mile", v * 2
    m = re.search(r"([\d.]+)\s*%", text)
    if m:
        v = float(m.group(1))
        return v, "percent", 0
    try:
        v = float(text)
        if v > 0:
            return v, "pt", v
    except ValueError:
        pass
    return 0, "pt", 0


def _guess_category(name: str) -> str:
    name_lower = name.lower()
    if any(k in name_lower for k in ["カード", "card", "visa", "mastercard", "jcb", "amex"]):
        return "credit_card"
    if any(k in name_lower for k in ["証券", "fx", "投資", "株", "sbi", "松井", "マネックス"]):
        return "securities"
    if any(k in name_lower for k in ["sim", "格安", "通信", "mineo", "iij", "povo", "ahamo", "linemo"]):
        return "telecom"
    if any(k in name_lower for k in ["銀行", "bank", "口座", "預金"]):
        return "bank"
    if any(k in name_lower for k in ["保険", "insurance"]):
        return "insurance"
    if any(k in name_lower for k in ["動画", "music", "netflix", "hulu", "u-next", "dazn", "spotify"]):
        return "video"
    if any(k in name_lower for k in ["旅行", "hotel", "ホテル", "じゃらん", "楽天トラベル"]):
        return "travel"
    if any(k in name_lower for k in ["ふるさと", "寄附", "寄付"]):
        return "furusato"
    return "other"


class HapitasScraper(BaseScraper):
    SITE_ID = "hapitas"
    SITE_NAME = "ハピタス"
    SITE_COLOR = "#E85D26"
    BASE_URL = "https://hapitas.jp"
    API_URL = "https://hapitas.jp/api_item-categorized-ranking"

    def scrape(self) -> list[RawOffer]:
        offers = []
        seen = set()
        page = 1

        while True:
            url = f"{self.API_URL}?limit=60&page={page}"
            self.logger.info(f"取得中: {url}")

            try:
                resp = self._get(url, headers={"Accept": "application/json"})
                data = resp.json()
                self.logger.info(f"  レスポンスキー: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            except Exception as e:
                self.logger.error(f"APIエラー: {e}")
                break

            # レスポンス構造を解析
            items = []
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict):
                # よくあるキーを試す
                for key in ["items", "data", "offers", "results", "list", "records"]:
                    if key in data and isinstance(data[key], list):
                        items = data[key]
                        self.logger.info(f"  キー '{key}' で{len(items)}件発見")
                        break
                if not items:
                    # 最初のリスト型の値を使う
                    for v in data.values():
                        if isinstance(v, list) and len(v) > 0:
                            items = v
                            break

            if not items:
                self.logger.info(f"  page={page} で案件なし、終了")
                self.logger.info(f"  レスポンス全体: {str(data)[:500]}")
                break

            self.logger.info(f"  {len(items)}件取得")

            now = datetime.now(timezone.utc).isoformat()
            for item in items:
                try:
                    if not isinstance(item, dict):
                        continue

                    # 案件名
                    name = (
                        item.get("name") or item.get("title") or
                        item.get("service_name") or item.get("item_name") or
                        item.get("ad_name") or ""
                    )
                    if not name or len(str(name)) < 2:
                        continue

                    # 還元値（数値 or テキスト）
                    reward_raw = (
                        item.get("point") or item.get("reward") or
                        item.get("pt") or item.get("cashback") or
                        item.get("rate") or 0
                    )
                    reward_text = str(reward_raw)
                    value, rtype, normalized = _normalize_reward(reward_text)

                    # 還元テキストが別フィールドにある場合
                    if value == 0:
                        for k in ["point_text", "reward_text", "pt_text", "point_str"]:
                            if k in item and item[k]:
                                value, rtype, normalized = _normalize_reward(str(item[k]))
                                reward_text = str(item[k])
                                if value > 0:
                                    break

                    # URL
                    offer_url = (
                        item.get("url") or item.get("link") or
                        item.get("detail_url") or item.get("href") or ""
                    )
                    if offer_url and not offer_url.startswith("http"):
                        offer_url = self.BASE_URL + offer_url

                    name_str = str(name)
                    if name_str in seen:
                        continue
                    seen.add(name_str)

                    offers.append(RawOffer(
                        site_id=self.SITE_ID,
                        site_name=self.SITE_NAME,
                        site_color=self.SITE_COLOR,
                        offer_name=name_str[:80],
                        advertiser_name=name_str[:80],
                        reward_value=value,
                        reward_type=rtype,
                        reward_text=reward_text[:50],
                        reward_normalized=normalized,
                        offer_url=offer_url or self.BASE_URL,
                        category=_guess_category(name_str),
                        device_type="all",
                        observed_at=now,
                    ))
                except Exception as e:
                    self.logger.warning(f"アイテム解析エラー: {e}")
                    continue

            # 次ページ確認
            if isinstance(data, dict):
                has_next = data.get("has_next") or data.get("hasNext") or data.get("next_page")
                if not has_next and len(items) < 60:
                    break
            elif len(items) < 60:
                break

            page += 1
            if page > 10:
                break

        return offers

