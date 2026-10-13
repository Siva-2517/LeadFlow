from datetime import datetime, timezone, time
from zoneinfo import ZoneInfo
from app.core.config import settings


def get_app_timezone() -> ZoneInfo:
    try:
        return ZoneInfo(settings.APP_TIMEZONE)
    except Exception:
        return ZoneInfo("Asia/Kolkata")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Datetimes stored in DB are in UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_app_tz(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    dt_utc = to_utc(dt)
    if dt_utc is None:
        return None
    return dt_utc.astimezone(get_app_timezone())


def get_today_boundaries_utc(tz_name: str | None = None) -> tuple[datetime, datetime]:
    """
    Returns (start_of_today_utc, end_of_today_utc) corresponding to the calendar boundaries
    (00:00:00.000000 to 23:59:59.999999) of the application timezone (default: Asia/Kolkata).
    """
    tz = ZoneInfo(tz_name) if tz_name else get_app_timezone()
    now_local = datetime.now(tz)
    start_local = datetime.combine(now_local.date(), time.min, tzinfo=tz)
    end_local = datetime.combine(now_local.date(), time.max, tzinfo=tz)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def is_follow_up_today(dt: datetime | None, tz_name: str | None = None) -> bool:
    if dt is None:
        return False
    dt_utc = to_utc(dt)
    if dt_utc is None:
        return False
    start_utc, end_utc = get_today_boundaries_utc(tz_name)
    return start_utc <= dt_utc <= end_utc


def is_follow_up_overdue(dt: datetime | None) -> bool:
    if dt is None:
        return False
    dt_utc = to_utc(dt)
    if dt_utc is None:
        return False
    return dt_utc < now_utc()
