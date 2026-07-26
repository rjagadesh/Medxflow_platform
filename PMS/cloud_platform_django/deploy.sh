#!/bin/bash
cd /home/ubuntu/cloud_platform_django
git pull origin Dev
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
sudo systemctl restart gunicorn