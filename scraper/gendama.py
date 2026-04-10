"""
げん玉 スクレイパー
対象: https://www.gendama.jp/offer/ (ログイン不要の公開ページ)
"""

from datetime import datetime, timezone
from bs4 import BeautifulSoup
from .base import BaseScraper, RawOffer
from .hapitas import _normalize_reward, _guess_category


class GendamaScraper(BaseScraper):
    SITE_ID = "gendama"
    SITE_NAME = "げん玉"
    SITE_COLOR = "#F5A623"

    BASE_URL = "https://www.gendama.jp"
    LIST_URL = "https://www.gendama.jp/forest/"

    def scrape(self) -> list[RawOffer]:
        offers = []
        page = 1

        while True:
            url = f"{self.LIST_URL}?page={page}" if page > 1 else self.LIST_URL
            self.logger.info(f"取得中: page={page} {url}")

            resp = self._get(url)
            soup = BeautifulSoup(resp.text, "html.parser")

            cards = soup.select(".offer-item, .item, li.offer, .ad-item, article")

            if not cards:
                cards = soup.select("a[href*='/offer/']")

            if not cards:
                self.logger.info(f"page={page} で案件が見つからず終了")
                break

            for card in cards:
                offer = self._parse_card(card)
                if offer:
                    offers.append(offer)

            next_btn = soup.select_one("a.next, .pagination .next, a[rel='next']")
            if not next_btn:
                break

            page += 1
            if page > 50:
                break

        return offers

    def _parse_card(self, card) -> RawOffer | None:
        try:
            now = datetime.now(timezone.utc).isoformat()

            name_el = card.select_one(".offer-name, .name, h3, h4, .title")
            name = name_el.get_text(strip=True) if name_el else card.get_text(strip=True)
            if not name:
                return None

            reward_el = card.select_one(".point, .pt, .gem, .reward")
            reward_text = reward_el.get_text(strip=True) if reward_el else ""
            value, rtype, normalized = _normalize_reward(reward_text)

            href = card.get("href", "") if card.name == "a" else ""
            link_el = card.select_one("a")
            if not href and link_el:
                href = link_el.get("href", "")
            offer_url = href if href.startswith("http") else self.BASE_URL + href

            return RawOffer(
                site_id=self.SITE_ID,
                site_name=self.SITE_NAME,
                site_color=self.SITE_COLOR,
                offer_name=name,
                advertiser_name=name,
                reward_value=value,
                reward_type=rtype,
                reward_text=reward_text,
                reward_normalized=normalized,
                offer_url=offer_url,
                category=_guess_category(name),
                device_type="all",
                observed_at=now,
            )
        except Exception as e:
            self.logger.warning(f"カード解析エラー: {e}")
            return None
