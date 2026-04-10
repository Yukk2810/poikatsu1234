"""
スクレイパー基底クラス
- ログイン不要の公開ページのみ対象
- robots.txt を尊重
- アクセス間隔を設けてサーバー負荷を抑制
"""

import time
import random
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}


@dataclass
class RawOffer:
    """取得した案件の生データ"""
    site_id: str
    site_name: str
    site_color: str
    offer_name: str
    advertiser_name: str
    reward_value: float
    reward_type: str        # pt / yen / percent / mile
    reward_text: str        # 表示用テキスト（例: "12,000pt"）
    reward_normalized: float  # 円換算（1pt=1円で統一）
    offer_url: str
    category: str
    device_type: str        # all / pc / mobile
    observed_at: str        # ISO8601


@dataclass
class ScrapeResult:
    """1サイトのスクレイプ結果"""
    site_id: str
    success: bool
    offers: list[RawOffer] = field(default_factory=list)
    error: Optional[str] = None
    duration_sec: float = 0.0


class BaseScraper(ABC):
    """全サイト共通の基底クラス"""

    SITE_ID: str = ""
    SITE_NAME: str = ""
    SITE_COLOR: str = "#000000"
    # アクセス間隔（秒）: どこ得と同様に人間的なペースを保つ
    REQUEST_INTERVAL = (1.5, 3.0)

    def __init__(self):
        self.logger = logging.getLogger(self.SITE_ID)
        self.session = self._build_session()

    def _build_session(self) -> requests.Session:
        session = requests.Session()
        session.headers.update(HEADERS)
        retry = Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _sleep(self):
        """リクエスト間隔をランダムに設けてサーバー負荷を抑制"""
        t = random.uniform(*self.REQUEST_INTERVAL)
        time.sleep(t)

    def _get(self, url: str, **kwargs) -> requests.Response:
        self._sleep()
        resp = self.session.get(url, timeout=15, **kwargs)
        resp.raise_for_status()
        return resp

    def run(self) -> ScrapeResult:
        start = time.time()
        self.logger.info(f"開始: {self.SITE_NAME}")
        try:
            offers = self.scrape()
            duration = time.time() - start
            self.logger.info(f"完了: {len(offers)}件取得 ({duration:.1f}s)")
            return ScrapeResult(
                site_id=self.SITE_ID,
                success=True,
                offers=offers,
                duration_sec=duration,
            )
        except Exception as e:
            duration = time.time() - start
            self.logger.error(f"失敗: {e}")
            return ScrapeResult(
                site_id=self.SITE_ID,
                success=False,
                error=str(e),
                duration_sec=duration,
            )

    @abstractmethod
    def scrape(self) -> list[RawOffer]:
        """各サイト固有のスクレイプ処理"""
        ...
