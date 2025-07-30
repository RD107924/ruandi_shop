import sqlite3
DATABASE_FILE = 'database.db'
print("正在建立資料庫 'database.db'...")
conn = sqlite3.connect(DATABASE_FILE)
cursor = conn.cursor()
print("-> 正在建立 'products' 資料表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT,
    base_price INTEGER NOT NULL,
    service_fee INTEGER NOT NULL
);
''')
print("   'products' 資料表... 成功")
print("-> 正在建立 'orders' 資料表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paopaohu_id TEXT NOT NULL,
    payment_code TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    items_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')
print("   'orders' 資料表... 成功")
conn.close()
print("資料庫初始化完成！")