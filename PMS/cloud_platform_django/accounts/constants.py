# schedules/constants.py

SCHEDULE_CHOICES = [
    ("daily", "Daily"),
    ("weekly", "Weekly"),
    ("biweekly", "Biweekly"),
    ("start-of-month", "Start of Month"),
    ("end-of-month", "End of Month"),
]

# Allowed schedules per job type
JOB_TYPE_ALLOWED_SCHEDULES = {
    "summary_report": ["daily", "weekly", "start-of-month", "end-of-month"],
    "invoice_report": ["end-of-month"],
}

DAYS_OF_WEEK = [
    ("0", "Monday"),
    ("1", "Tuesday"),
    ("2", "Wednesday"),
    ("3", "Thursday"),
    ("4", "Friday"),
    ("5", "Saturday"),
    ("6", "Sunday"),
]