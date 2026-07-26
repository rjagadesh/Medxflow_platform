#!/usr/bin/env python3

import subprocess
import os
import logging
import sys
import time
import requests
import pika
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime
import json

# ====================
# CONFIGURATION
# ====================

# Email Settings
tomail = ['Guruprasanth@droidal.com','kabilan.b@droidal.com']
ccmail = []
email_sender = 'Sales_app@droidal.com'
email_password = 'zfchdpngxdnkhzgv'
smtp_server = 'smtp.office365.com'
smtp_port = 587

# ====================
# EMAIL FUNCTION
# ====================

def send_email(attachment_path, MailId, MailPwd, To_Mail, Cc_Mail, subject, filename, body_html, servername, port):
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = MailId
    msg['To'] = ", ".join(To_Mail)
    msg['Cc'] = ", ".join(Cc_Mail)

    # Body as HTML
    msg.attach(MIMEText(body_html, 'html'))

    # Attach file
    if attachment_path:
        if not filename:
            head, tail = os.path.split(attachment_path)
        else:
            tail = filename
        with open(attachment_path, 'rb') as attachment:
            part = MIMEApplication(attachment.read(), Name=tail)
            part['Content-Disposition'] = f'attachment; filename="{tail}"'
            msg.attach(part)

    with smtplib.SMTP(servername, port) as server:
        server.starttls()
        server.login(MailId, MailPwd)
        server.send_message(msg)

def send_status_email(subject, body_html, attachment=None):
    try:
        send_email(
            attachment_path=attachment or '',
            MailId=email_sender,
            MailPwd=email_password,
            To_Mail=tomail,
            Cc_Mail=ccmail,
            subject=subject,
            filename='',
            body_html=body_html,
            servername=smtp_server,
            port=smtp_port
        )
        print(f"[Email] Sent successfully: {subject}")
    except Exception as e:
        print(f"[Email] Failed to send: {e}")

# ====================
# ARGUMENT PARSING
# ====================

if len(sys.argv) < 9:
    print("Usage: python server_push.py <queue_name> <taskid> <ip> <username> <password> <height> <width> <scaling>")
    sys.exit(1)

client_queue = sys.argv[1]
taskid = sys.argv[2]
machineip = sys.argv[3]
machineuname = sys.argv[4]
machinepwd = sys.argv[5]
machineheight = sys.argv[6]
machinewidth = sys.argv[7]
scaling = sys.argv[8]
agentid = sys.argv[9]

# Send email status notification
email_subject = f"Triggering Task: {taskid}"
email_body = f"""
<b>Queue:</b> {client_queue}<br>
<b>Task ID:</b> {taskid}<br>
<b>Machine IP:</b> {machineip}<br>
<b>Username:</b> {machineuname}<br>
<b>Height:</b> {machineheight}<br>
<b>Width:</b> {machinewidth}<br>
<b>Scaling:</b> {scaling}<br>
<b>agentid:</b> {agentid}<br>
"""
send_status_email(email_subject, email_body)

# ====================
# TASK MESSAGE & RABBITMQ PUSH
# ====================

task_data = {
    "task_id": taskid,
    "machineip": machineip,
    "machineuname": machineuname,
    "machinepwd": machinepwd,
    "machineheight": machineheight,
    "machinewidth": machinewidth,
    "scaling": scaling,
    "agentid": agentid
}
message = json.dumps(task_data)

credentials = pika.PlainCredentials('cloud-droidal', 'clouD-D#roidal')
params = pika.ConnectionParameters(
    host='localhost',
    port=5672,
    virtual_host='/',
    credentials=credentials
)

try:
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.queue_declare(queue=client_queue, durable=True)

    channel.basic_publish(
        exchange='',
        routing_key=client_queue,
        body=message,
        properties=pika.BasicProperties(delivery_mode=2)
    )

    print(f"[Server] Sent to {client_queue}: {message}")
    connection.close()

except Exception as e:
    print(f"[RabbitMQ] Error sending message: {e}")
    send_status_email(f"Failed to Trigger Task: {taskid}", f"<b>Error:</b> {e}")
