"""Default kiosk screen — a self-contained patient check-in HTML document.

Used as the starting point when a tenant opens the kiosk builder. The AI edits
this HTML in response to chat instructions; it stays a single, self-contained
page (inline CSS + minimal JS) so it can be previewed in an iframe and saved.
"""

DEFAULT_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Patient Check-in</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: #f2f6fb; color: #0d2b52; }
  .kiosk { max-width: 640px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  .kiosk__head { background: #1a5dad; color: #fff; padding: 28px 32px; }
  .kiosk__head h1 { margin: 0; font-size: 26px; }
  .kiosk__head p { margin: 6px 0 0; opacity: .85; }
  .kiosk__body { flex: 1; padding: 32px; }
  .step { display: none; }
  .step.active { display: block; }
  .step h2 { font-size: 20px; margin: 0 0 18px; }
  .field { margin-bottom: 18px; }
  .field label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
  .field input, .field select {
    width: 100%; padding: 14px 16px; font-size: 17px; border: 1px solid #cddbea;
    border-radius: 10px; background: #fff; }
  .field input:focus, .field select:focus { outline: none; border-color: #1a5dad; }
  .actions { display: flex; gap: 12px; margin-top: 28px; }
  button { font: inherit; font-weight: 700; border: none; border-radius: 10px;
           padding: 15px 26px; cursor: pointer; font-size: 17px; }
  .btn-primary { background: #1a5dad; color: #fff; margin-left: auto; }
  .btn-primary:hover { background: #123f7e; }
  .btn-ghost { background: #e8eef6; color: #1a5dad; }
  .done { text-align: center; padding: 40px 0; }
  .done .check { width: 72px; height: 72px; border-radius: 50%; background: #17c3b2; color: #fff;
                 font-size: 40px; display: grid; place-items: center; margin: 0 auto 18px; }
</style>
</head>
<body>
  <div class="kiosk">
    <div class="kiosk__head">
      <h1>Welcome</h1>
      <p>Please check in for your appointment.</p>
    </div>
    <div class="kiosk__body">
      <div class="step active" data-step="1">
        <h2>Patient information</h2>
        <div class="field"><label>Full name</label><input type="text" placeholder="Jane Doe" /></div>
        <div class="field"><label>Date of birth</label><input type="date" /></div>
        <div class="field"><label>Phone number</label><input type="tel" placeholder="(555) 123-4567" /></div>
        <div class="actions"><button class="btn-primary" onclick="next()">Next →</button></div>
      </div>
      <div class="step" data-step="2">
        <h2>Insurance</h2>
        <div class="field"><label>Insurance payer</label><input type="text" placeholder="Aetna" /></div>
        <div class="field"><label>Member ID</label><input type="text" placeholder="ABC123456789" /></div>
        <div class="field"><label>Reason for visit</label>
          <select><option>Consultation</option><option>Follow-up</option><option>New patient</option></select>
        </div>
        <div class="actions">
          <button class="btn-ghost" onclick="back()">← Back</button>
          <button class="btn-primary" onclick="submitForm()">Submit ✓</button>
        </div>
      </div>
      <div class="step" data-step="3">
        <div class="done">
          <div class="check">✓</div>
          <h2>You're checked in!</h2>
          <p>Please have a seat — we'll call you shortly.</p>
        </div>
      </div>
    </div>
  </div>
  <script>
    var cur = 1;
    function show(n){ document.querySelectorAll('.step').forEach(function(s){
      s.classList.toggle('active', s.dataset.step == n); }); cur = n; }
    function next(){ show(cur + 1); }
    function back(){ show(cur - 1); }
    function submitForm(){ show(3); }
  </script>
</body>
</html>
"""


# A welcome / home kiosk screen with Check-in and Appointment entry points.
WELCOME_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Welcome</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f2f6fb;color:#0d2b52}
  .k{max-width:720px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding:40px 32px}
  .brand{font-weight:800;font-size:20px;letter-spacing:.02em;color:#1a5dad;margin-bottom:36px}
  h1{font-size:40px;line-height:1.1;margin:0 0 12px}
  h1 span{color:#17c3b2}
  p.sub{font-size:19px;color:#4f6580;margin:0 0 36px}
  .btns{display:flex;flex-direction:column;gap:14px;max-width:420px}
  button{font:inherit;font-weight:700;font-size:19px;border:none;border-radius:12px;padding:18px 24px;cursor:pointer}
  .primary{background:#1a5dad;color:#fff}
  .primary:hover{background:#123f7e}
  .ghost{background:#fff;color:#1a5dad;border:1px solid #cddbea}
  .screen{display:none}.screen.on{display:block}
  .field{margin:0 0 16px;max-width:420px}
  .field label{display:block;font-size:14px;font-weight:600;margin-bottom:6px}
  .field input{width:100%;padding:14px 16px;font-size:17px;border:1px solid #cddbea;border-radius:10px}
  .back{background:none;border:none;color:#4f6580;font-weight:600;cursor:pointer;padding:0;margin-bottom:16px}
</style></head>
<body><div class="k">
  <div class="brand">🏥 Your Clinic</div>
  <div class="screen on" id="home">
    <h1>Welcome to <span>Your Clinic</span></h1>
    <p class="sub">We're here to make your visit simple and smooth. Let's get you checked in.</p>
    <div class="btns">
      <button class="primary" onclick="go('checkin')">Start Check-In →</button>
      <button class="ghost" onclick="go('appt')">I have an appointment</button>
    </div>
  </div>
  <div class="screen" id="checkin">
    <button class="back" onclick="go('home')">← Back</button>
    <h1>Let's check you in</h1>
    <div class="field"><label>Full name</label><input placeholder="Jane Doe" /></div>
    <div class="field"><label>Date of birth</label><input type="date" /></div>
    <div class="field"><label>Phone number</label><input type="tel" placeholder="(555) 123-4567" /></div>
    <div class="btns"><button class="primary" onclick="go('done')">Continue →</button></div>
  </div>
  <div class="screen" id="appt">
    <button class="back" onclick="go('home')">← Back</button>
    <h1>Find your appointment</h1>
    <div class="field"><label>Confirmation code</label><input placeholder="ABC-1234" /></div>
    <div class="field"><label>Last name</label><input placeholder="Doe" /></div>
    <div class="btns"><button class="primary" onclick="go('done')">Look up →</button></div>
  </div>
  <div class="screen" id="done" style="text-align:center;padding-top:60px">
    <div style="width:76px;height:76px;border-radius:50%;background:#17c3b2;color:#fff;font-size:42px;display:grid;place-items:center;margin:0 auto 18px">✓</div>
    <h1>You're all set!</h1>
    <p class="sub">Please have a seat — we'll call you shortly.</p>
    <div class="btns" style="margin:0 auto"><button class="ghost" onclick="go('home')">Done</button></div>
  </div>
</div>
<script>function go(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('on',s.id===id)})}</script>
</body></html>
"""

# Seeded for every tenant the first time they open the kiosk builder.
SAMPLE_KIOSKS = [
    {"name": "Welcome — Home", "html": WELCOME_HTML},
    {"name": "Patient Intake", "html": DEFAULT_HTML},
]
