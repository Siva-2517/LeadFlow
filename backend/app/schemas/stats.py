from pydantic import BaseModel


class StatsSummary(BaseModel):
    total_leads: int
    follow_ups_today: int
    overdue_follow_ups: int
    won_leads: int
