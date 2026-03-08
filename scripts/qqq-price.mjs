#!/usr/bin/env node
const SYMBOL = 'QQQ';
const API_URL = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${SYMBOL}&range=1d&interval=1m`;

try {
  const res = await fetch(API_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OpenClawAgent/1.0)'
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const result = data?.spark?.result?.[0]?.response?.[0];
  if (!result) {
    throw new Error('Quote result missing');
  }
  const meta = result.meta ?? {};
  const price = meta.regularMarketPrice ?? result.indicators?.quote?.[0]?.close?.at(-1);
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? null;
  const change = prevClose != null && price != null ? price - prevClose : null;
  const changePct = prevClose ? (change / prevClose) * 100 : null;
  const timestampArr = result.timestamp ?? [];
  const lastTs = timestampArr.at(-1);
  const marketTime = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : lastTs
    ? new Date(lastTs * 1000).toISOString()
    : new Date().toISOString();

  const direction = (change ?? 0) > 0 ? 'up' : (change ?? 0) < 0 ? 'down' : 'flat';
  const summary = `QQQ @ ${price?.toFixed(2)} (${direction} ${Math.abs(change ?? 0).toFixed(2)}, ${Math.abs(changePct ?? 0).toFixed(2)}%) vs prev close ${prevClose?.toFixed(2) ?? 'n/a'}.`;
  const detail = {
    symbol: SYMBOL,
    price,
    change,
    changePct,
    prevClose,
    marketTime,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance spark API',
  };

  process.stdout.write(`${summary}\n${JSON.stringify(detail)}\n`);
} catch (error) {
  console.error('[qqq-price] failed', error);
  process.exitCode = 1;
}
