import json
import time
import uuid


LOCK_KEY = "scraper_run_lock"
CANCEL_KEY = "scraper_cancel_requested"
DEFAULT_LEASE_SECONDS = 6 * 60 * 60


def acquire_run_lock(connection, run_id, lease_seconds=DEFAULT_LEASE_SECONDS):
    token = uuid.uuid4().hex
    now = int(time.time())
    expires_at = now + lease_seconds
    cursor = connection.cursor()
    try:
        cursor.execute(
            "SELECT state_value FROM Website_Scraping_State WHERE state_key = %s FOR UPDATE",
            (LOCK_KEY,),
        )
        row = cursor.fetchone()
        if row:
            try:
                current = json.loads(row["state_value"])
            except (TypeError, ValueError, KeyError):
                current = {}
            if int(current.get("expires_at", 0)) > now:
                connection.rollback()
                return None
            previous_run_id = current.get("run_id")
            if previous_run_id:
                cursor.execute(
                    "UPDATE Website_Scraping_Runs SET status = 'stale', finished_at = CURRENT_TIMESTAMP WHERE id = %s AND status = 'running'",
                    (previous_run_id,),
                )
            cursor.execute(
                """
                UPDATE Website_Scraping_State
                SET state_value = %s, updated_at = CURRENT_TIMESTAMP
                WHERE state_key = %s
                """,
                (json.dumps({"run_id": run_id, "token": token, "expires_at": expires_at}), LOCK_KEY),
            )
        else:
            cursor.execute(
                "INSERT INTO Website_Scraping_State (state_key, state_value) VALUES (%s, %s)",
                (LOCK_KEY, json.dumps({"run_id": run_id, "token": token, "expires_at": expires_at})),
            )
        connection.commit()
        return token
    finally:
        cursor.close()


def release_run_lock(connection, token):
    if not token:
        return False
    cursor = connection.cursor()
    try:
        cursor.execute(
            "SELECT state_value FROM Website_Scraping_State WHERE state_key = %s FOR UPDATE",
            (LOCK_KEY,),
        )
        row = cursor.fetchone()
        if not row:
            connection.rollback()
            return False
        try:
            current = json.loads(row["state_value"])
        except (TypeError, ValueError, KeyError):
            current = {}
        if current.get("token") != token:
            connection.rollback()
            return False
        cursor.execute("DELETE FROM Website_Scraping_State WHERE state_key = %s", (LOCK_KEY,))
        connection.commit()
        return True
    finally:
        cursor.close()


def request_cancel(connection):
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO Website_Scraping_State (state_key, state_value) VALUES (%s, %s) ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)",
            (CANCEL_KEY, "1"),
        )
        connection.commit()
    finally:
        cursor.close()


def is_cancel_requested(connection):
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT state_value FROM Website_Scraping_State WHERE state_key = %s", (CANCEL_KEY,))
        return cursor.fetchone() is not None
    finally:
        cursor.close()


def clear_cancel(connection):
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM Website_Scraping_State WHERE state_key = %s", (CANCEL_KEY,))
        connection.commit()
    finally:
        cursor.close()