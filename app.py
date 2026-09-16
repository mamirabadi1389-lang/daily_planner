import os
import sqlite3
import webview

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "planner.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            time TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            description TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    conn.commit()
    conn.close()


class Api:
    # ---------- کارها ----------
    def get_tasks(self):
        conn = get_connection()
        rows = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def add_task(self, task):
        conn = get_connection()
        cur = conn.execute(
            "INSERT INTO tasks (name, time, priority, description) VALUES (?, ?, ?, ?)",
            (
                task.get("name", ""),
                task.get("time", ""),
                task.get("priority", "medium"),
                task.get("desc", ""),
            ),
        )
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return new_id

    def delete_task(self, task_id):
        conn = get_connection()
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()
        return True

    # ---------- تنظیمات (تم) ----------
    def get_theme(self):
        conn = get_connection()
        row = conn.execute("SELECT value FROM settings WHERE key = 'theme'").fetchone()
        conn.close()
        return row["value"] if row else "wood"

    def set_theme(self, theme):
        conn = get_connection()
        conn.execute(
            """
            INSERT INTO settings (key, value) VALUES ('theme', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (theme,),
        )
        conn.commit()
        conn.close()
        return True

    # ---------- خروج ----------
    def exit_app(self):
        webview.windows[0].destroy()


def main():
    init_db()
    index_path = os.path.join(BASE_DIR, "index.html")

    api = Api()
    webview.create_window(
        title="برنامه‌ریز روزانه",
        url=index_path,
        js_api=api,
        width=1000,
        height=800,
        resizable=True,
        background_color="#1d2b21",
    )
    webview.start()


if __name__ == "__main__":
    main()
