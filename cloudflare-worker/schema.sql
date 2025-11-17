-- 双色球数据表
CREATE TABLE IF NOT EXISTS ssq_lottery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lottery_no TEXT UNIQUE NOT NULL,
    draw_date TEXT NOT NULL,
    red1 TEXT NOT NULL,
    red2 TEXT NOT NULL,
    red3 TEXT NOT NULL,
    red4 TEXT NOT NULL,
    red5 TEXT NOT NULL,
    red6 TEXT NOT NULL,
    blue TEXT NOT NULL,
    sorted_code TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lottery_no ON ssq_lottery(lottery_no);
CREATE INDEX IF NOT EXISTS idx_draw_date ON ssq_lottery(draw_date);
CREATE INDEX IF NOT EXISTS idx_sorted_code ON ssq_lottery(sorted_code);
