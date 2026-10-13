from datetime import datetime, timezone, timedelta, time
from zoneinfo import ZoneInfo
from app.core.timezone import (
    get_today_boundaries_utc,
    is_follow_up_today,
    is_follow_up_overdue,
    to_utc,
    to_app_tz,
)


def test_today_boundaries_in_kolkata():
    kolkata_tz = ZoneInfo("Asia/Kolkata")
    now_kolkata = datetime.now(kolkata_tz)

    start_utc, end_utc = get_today_boundaries_utc("Asia/Kolkata")

    # When converted back to Kolkata timezone, start_utc must have time 00:00:00
    start_in_kolkata = start_utc.astimezone(kolkata_tz)
    assert start_in_kolkata.time() == time.min
    assert start_in_kolkata.date() == now_kolkata.date()

    # And end_utc must have time 23:59:59.999999
    end_in_kolkata = end_utc.astimezone(kolkata_tz)
    assert end_in_kolkata.time() == time.max
    assert end_in_kolkata.date() == now_kolkata.date()


def test_follow_up_today_evaluation():
    kolkata_tz = ZoneInfo("Asia/Kolkata")
    now_kolkata = datetime.now(kolkata_tz)

    # A datetime at 14:00 today in Kolkata
    today_2pm_kolkata = datetime.combine(
        now_kolkata.date(), time(14, 0), tzinfo=kolkata_tz
    )
    today_2pm_utc = today_2pm_kolkata.astimezone(timezone.utc)
    assert is_follow_up_today(today_2pm_utc) is True

    # A datetime tomorrow at 10:00 in Kolkata
    tomorrow_kolkata = datetime.combine(
        now_kolkata.date() + timedelta(days=1), time(10, 0), tzinfo=kolkata_tz
    )
    assert is_follow_up_today(tomorrow_kolkata) is False

    # A datetime yesterday at 10:00 in Kolkata
    yesterday_kolkata = datetime.combine(
        now_kolkata.date() - timedelta(days=1), time(10, 0), tzinfo=kolkata_tz
    )
    assert is_follow_up_today(yesterday_kolkata) is False


def test_follow_up_overdue_evaluation():
    # Past datetime is overdue
    past_dt = datetime.now(timezone.utc) - timedelta(hours=2)
    assert is_follow_up_overdue(past_dt) is True

    # Future datetime is not overdue
    future_dt = datetime.now(timezone.utc) + timedelta(hours=2)
    assert is_follow_up_overdue(future_dt) is False
