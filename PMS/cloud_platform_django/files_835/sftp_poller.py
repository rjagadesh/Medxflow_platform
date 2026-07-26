import os
import stat
import fcntl
import paramiko
from datetime import datetime, timezone, timedelta

# ========================
# CONFIGURATION
# ========================

HOSTNAME = "34.201.171.255"
PORT = 22
USERNAME = "ubuntu"
PEM_KEY_PATH = "/home/ubuntu/inbound/pmsehr835.pem"

REMOTE_DIR = "/home/ubuntu/835/project/media"
LOCAL_DIR = "/home/ubuntu/inbound/files835"

CHECK_INTERVAL_MINUTES = 5

STATE_FILE = "/home/ubuntu/inbound/sftp_last_run.txt"
LOCK_FILE = "/home/ubuntu/inbound/sftp.lock"

# ========================
# STATE HELPERS
# ========================

def get_last_run():
    if not os.path.exists(STATE_FILE):
        return None

    with open(STATE_FILE, "r") as f:
        ts = f.read().strip()
        if not ts:
            return None
        return datetime.fromisoformat(ts).astimezone(timezone.utc)


def save_last_run():
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w") as f:
        f.write(datetime.now(timezone.utc).isoformat())


def should_check(last_run):
    if last_run is None:
        return True

    return (
        datetime.now(timezone.utc)
        - last_run
        >= timedelta(minutes=CHECK_INTERVAL_MINUTES)
    )

# ========================
# LOCKING
# ========================

def acquire_lock():
    os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)
    lock = open(LOCK_FILE, "w")
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    return lock

# ========================
# SFTP LOGIC
# ========================

def connect_sftp():
    private_key = paramiko.RSAKey.from_private_key_file(PEM_KEY_PATH)

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.RejectPolicy())

    client.connect(
        hostname=HOSTNAME,
        port=PORT,
        username=USERNAME,
        pkey=private_key,
        look_for_keys=False,
        allow_agent=False,
        timeout=30,
    )

    client.get_transport().set_keepalive(30)
    print("Connected")
    return client, client.open_sftp()


def process_sftp_files():
    os.makedirs(LOCAL_DIR, exist_ok=True)

    client, sftp = connect_sftp()

    try:
        local_files = set(os.listdir(LOCAL_DIR))

        for attr in sftp.listdir_attr(REMOTE_DIR):
            print(str(attr))
            if not stat.S_ISREG(attr.st_mode):
                continue

            filename = attr.filename

            # Skip if already downloaded
            print(filename)
            if filename in local_files:
                continue

            remote_file = f"{REMOTE_DIR}/{filename}"
            local_file = os.path.join(LOCAL_DIR, filename)
            tmp_file = local_file + ".part"

            print(f"Downloading {filename}")

            sftp.get(remote_file, tmp_file)
            os.rename(tmp_file, local_file)

    finally:
        sftp.close()
        client.close()

# ========================
# CRON ENTRY POINT
# ========================

def main():
    try:
        lock = acquire_lock()
    except BlockingIOError:
        return

    try:
        last_run = get_last_run()
        if not should_check(last_run):
            return

        process_sftp_files()
        save_last_run()

    except Exception as e:
        print(f"SFTP poll failed: {e}")
        raise

    finally:
        lock.close()

if __name__ == "__main__":
    main()
