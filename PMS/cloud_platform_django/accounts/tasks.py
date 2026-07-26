from celery import shared_task
from django.utils import timezone
from .models import ScheduledJob
from .views import send_summary_report
import calendar

@shared_task
def process_scheduled_jobs():
    def should_run(job, now):
        # time match helper
        print("in should run")
        if not match_time(job, now):
            return False

        # -------- DAILY --------
        if job.schedule == "daily":
            return True

        # -------- WEEKLY --------
        if job.schedule == "weekly":
            return now.weekday() == job.schedule_day

        # -------- BIWEEKLY --------
        if job.schedule == "biweekly":
            week_num = now.isocalendar()[1]
            return (week_num % 2 == 0) and (now.weekday() == job.schedule_day)

        # -------- START OF MONTH --------
        if job.schedule == "start-of-month":
            return now.day == 1

        # -------- END OF MONTH --------
        if job.schedule == "end-of-month":
            last_day = calendar.monthrange(now.year, now.month)[1]
            return now.day == last_day

        return False

    def match_time(job, now):
        print(str(job.id),str(job.schedule_time.hour), str(now.hour), str(job.schedule_time.minute), str(now.minute))
        return (
            now.hour == job.schedule_time.hour and
            now.minute == job.schedule_time.minute
        )

    def run_job(job_id):
        print(job_id)
        job = ScheduledJob.objects.get(id=job_id)

        if job.job_type == "summary_report":
            print(str(job))
            send_summary_report(job.client_id, job.emails)

        elif job.job_type == "invoice":
            send_summary_report(job.client_id, job.emails)
        job.last_run_at = timezone.now()
        job.save()







    now = timezone.now()
    jobs = ScheduledJob.objects.filter(is_active=True)
    # print(str(jobs))
    for job in jobs:
        print(job, now, "hi how are ypou")
        if should_run(job, now):
            print(now)
            print(str(job.id))
            run_job(job.id)


    