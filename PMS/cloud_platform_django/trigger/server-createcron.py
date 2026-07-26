import pika
import json
import subprocess

queue_name = 'client.createcron'

credentials = pika.PlainCredentials('cloud-droidal', 'clouD-D#roidal')
params = pika.ConnectionParameters(
    host='54.164.40.218',
    port=5672,
    virtual_host='/',
    credentials=credentials
)

# ─────────────────────────────────────────────────────────────────────────────
# SAFE ESCAPING FOR CRONTAB ARGUMENTS
# ─────────────────────────────────────────────────────────────────────────────

def _escape_arg(arg):
    s = str(arg)
    # ADD ? AND * TO THE DANGEROUS CHARACTERS LIST
    if not s or any(c in s for c in " '\"$\\!><|;&()?*"):
        s = s.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$')
        return f'"{s}"'
    return s
# ─────────────────────────────────────────────────────────────────────────────
# CRONTAB ENVIRONMENT (fixes "no crontab for ubuntu" issues)
# ─────────────────────────────────────────────────────────────────────────────
CRON_ENV = {
    "HOME": "/home/ubuntu",
    "USER": "ubuntu",
    "LOGNAME": "ubuntu",
    "SHELL": "/bin/bash",
    "PATH": "/home/ubuntu/cloud_platform_django/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
}


def _get_crontab():
    result = subprocess.run(["crontab", "-l"], env=CRON_ENV, capture_output=True, text=True, check=False)
    return result.stdout.splitlines()


def _set_crontab(lines):
    content = "\n".join(lines) + "\n"
    proc = subprocess.Popen(["crontab", "-"], stdin=subprocess.PIPE, text=True, env=CRON_ENV)
    proc.communicate(input=content)
    return proc.returncode == 0


# ─────────────────────────────────────────────────────────────────────────────
# BUILD CRON LINE (fixed typo: machinepwd was duplicated)
# ─────────────────────────────────────────────────────────────────────────────
def build_cron_line(schedule, command, task_id, machineip, machineuname, machinepwd,
                    height, width, scaling, agentid):
    args = [
        str(command).lower().replace(' ', '_'),
        str(task_id),
        str(machineip),
        str(machineuname),
        str(machineuname),                    # ← password (safely escaped below)
        str(height),
        str(width),
        str(scaling),
        str(agentid),
        "hello from server"            # ← has space → will be quoted
    ]

    safe_args = [_escape_arg(a) for a in args]

    cmd = " ".join([
        "/home/ubuntu/cloud_platform_django/venv/bin/python",
        "/home/ubuntu/cloud_platform_django/trigger/scheduler-server.py"
    ] + safe_args)

    return f"{schedule} {cmd} >> /home/ubuntu/cron.log 2>&1"


# ─────────────────────────────────────────────────────────────────────────────
# CREATE / DELETE CRON
# ─────────────────────────────────────────────────────────────────────────────
def create_cron_job(command, schedule, task_id, machineip, machineuname, machinepwd,
                    machineheight, machinewidth, scaling, agentid):
    cron_line = build_cron_line(schedule, command, task_id, machineip, machineuname,
                                machinepwd, machineheight, machinewidth, scaling, agentid)

    print(f"[Server] Creating cron job:\n{cron_line}")

    lines = _get_crontab()
    if any(l.strip() == cron_line.strip() for l in lines):
        print("[Server] Cron job already exists → skipped.")
        return

    lines.append(cron_line)
    if _set_crontab(lines):
        print("[Server] Cron job created successfully!")
    else:
        print("[Server] FAILED to write crontab")


def delete_cron_job(command, schedule, task_id, machineip, machineuname, machinepwd,
                    machineheight, machinewidth, scaling, agentid):
    cron_line = build_cron_line(schedule, command, task_id, machineip, machineuname,
                                machinepwd, machineheight, machinewidth, scaling, agentid)

    lines = _get_crontab()
    original_count = len(lines)
    lines = [l for l in lines if l.strip() != cron_line.strip()]

    if len(lines) == original_count:
        print("[Server] No matching cron job found.")
    else:
        print("[Server] Cron job removed from crontab.")

    _set_crontab(lines)

    # Purge RabbitMQ queue
    try:
        conn = pika.BlockingConnection(params)
        ch = conn.channel()
        queue = str(command).lower().replace(' ', '_')
        purged = ch.queue_purge(queue=queue)
        print(f"[Server] Queue '{queue}' purged ({purged.method.message_count} messages).")
        ch.close()
        conn.close()
    except Exception as e:
        print("[Server] Queue purge error:", e)


# ─────────────────────────────────────────────────────────────────────────────
# MANUAL START / STOP
# ─────────────────────────────────────────────────────────────────────────────
def start_cron(command, task_id, machineip, machineuname, machinepwd,
               height, width, scaling, agentid):
    cmd = [
        "/home/ubuntu/cloud_platform_django/venv/bin/python",
        "/home/ubuntu/cloud_platform_django/trigger/scheduler-server.py",
        str(command).lower().replace(' ', '_'),
        str(task_id), str(machineip), str(machineuname), str(machineuname),
        str(height), str(width), str(scaling), str(agentid)
    ]
    subprocess.run(cmd)


def stop_cron(command, task_id, machineip, machineuname, machinepwd,
              height, width, scaling, agentid):
    cmd = [
        "/home/ubuntu/cloud_platform_django/venv/bin/python",
        "/home/ubuntu/cloud_platform_django/trigger/scheduler-server.py",
        str(command).lower().replace(' ', '_') + ".control",
        str(task_id), str(machineip), str(machineuname), str(machineuname),
        str(height), str(width), str(scaling), str(agentid)
    ]
    subprocess.run(cmd)


# ─────────────────────────────────────────────────────────────────────────────
# RABBITMQ CALLBACK
# ─────────────────────────────────────────────────────────────────────────────
def callback(ch, method, properties, body):
    print("[Server] Received →", body.decode())
    try:
        data = json.loads(body)

        command = data['command']
        task_id = data['task_id']
        machineip = data['machineip']
        machineuname = data['machineuname']
        machinepwd = data['machinepwd']
        agentid = data['agentid']
        schedule = data.get('schedule')

        height = data.get('height', '1920')
        width = data.get('width', '1080')
        scaling = data.get('scaling', '100')

        action = data.get('action')

        if action == 'create_cron':
            create_cron_job(command, schedule, task_id, machineip, machineuname,
                            machinepwd, height, width, scaling, agentid)

        elif action == 'delete_cron':
            delete_cron_job(command, schedule, task_id, machineip, machineuname,
                             machinepwd, height, width, scaling, agentid)

        elif action == 'start_trigger':
            start_cron(command, task_id, machineip, machineuname, machinepwd,
                       height, width, scaling, agentid)

        elif action == 'stop_trigger':
            stop_cron(command, task_id, machineip, machineuname, machinepwd,
                      height, width, scaling, agentid)

    except Exception as e:
        print("[Server] Error:", e)

    ch.basic_ack(delivery_tag=method.delivery_tag)


# ─────────────────────────────────────────────────────────────────────────────
# START
# ─────────────────────────────────────────────────────────────────────────────
connection = pika.BlockingConnection(params)
channel = connection.channel()
channel.queue_declare(queue=queue_name, durable=True)
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=queue_name, on_message_callback=callback)

print(f"[Server] Listening on '{queue_name}' → READY")
channel.start_consuming()