import base64, requests, subprocess
from google.cloud import storage

PROJECT_ID = subprocess.check_output(["gcloud","config","get-value","project"]).decode().strip()
BUCKET = "filipsvoice"
CONSENT_BLOB = "consent.mp3"
REF_BLOB     = "reference.mp3"

LANG = "en-GB"
CONSENT_SCRIPT = ("I am the owner of this voice and I consent to Google using this voice to "
                  "create a synthetic voice model.")

def access_token():
    import subprocess
    return subprocess.check_output(["gcloud","auth","print-access-token"]).decode().strip()

def load_gcs_bytes(bucket, blob_name):
    client = storage.Client(project=PROJECT_ID)
    return client.bucket(bucket).blob(blob_name).download_as_bytes()

consent_b64 = base64.b64encode(load_gcs_bytes(BUCKET, CONSENT_BLOB)).decode()
ref_b64     = base64.b64encode(load_gcs_bytes(BUCKET, REF_BLOB)).decode()

url = "https://texttospeech.googleapis.com/v1beta1/voices:generateVoiceCloningKey"
body = {
  "referenceAudio": {"audioConfig": {"audioEncoding": "MP3"}, "content": ref_b64},
  "voiceTalentConsent": {"audioConfig": {"audioEncoding": "MP3"}, "content": consent_b64},
  "consentScript": CONSENT_SCRIPT,
  "languageCode": LANG
}
headers = {
  "Authorization": f"Bearer {access_token()}",
  "x-goog-user-project": PROJECT_ID,
  "Content-Type": "application/json"
}

resp = requests.post(url, json=body, headers=headers, timeout=60)
resp.raise_for_status()
open("voice_cloning_key.txt","w").write(resp.json()["voiceCloningKey"])
print("Saved voice_cloning_key.txt")
