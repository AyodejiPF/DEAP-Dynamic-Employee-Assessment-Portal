#!/usr/bin/env python3
"""
StaffiQ / DEAP lightweight Firebase Hosting deploy tool.
Talks to the Firebase Hosting REST API using a service account key, so it needs
no global Firebase CLI. Commands: verify, diff, preview, deploy.
"""
import os, sys, json, gzip, hashlib, io
import requests
import google.auth.transport.requests
from google.oauth2 import service_account

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(REPO, os.environ.get("DEPLOY_BASE", ""))
API = "https://firebasehosting.googleapis.com/v1beta1"
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


def load_firebase_json():
    with open(os.path.join(BASE, "firebase.json")) as f:
        return json.load(f)


def hosting_conf():
    h = load_firebase_json()["hosting"]
    return h["site"], os.path.join(BASE, h.get("public", "dist")), h


def key_path():
    p = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.path.join(REPO, ".secrets", "serviceAccount.json")
    if not os.path.exists(p):
        sys.exit(f"Service account key not found at {p}")
    return p


def token():
    creds = service_account.Credentials.from_service_account_file(key_path(), scopes=SCOPES)
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def headers():
    return {"Authorization": f"Bearer {token()}"}


def gz(data):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9, mtime=0) as g:
        g.write(data)
    return buf.getvalue()


def walk_public(public_dir):
    out = {}
    for root, _dirs, files in os.walk(public_dir):
        for name in files:
            full = os.path.join(root, name)
            rel = "/" + os.path.relpath(full, public_dir).replace(os.sep, "/")
            if any(seg.startswith(".") for seg in rel.strip("/").split("/")):
                continue
            with open(full, "rb") as fh:
                comp = gz(fh.read())
            out[rel] = (hashlib.sha256(comp).hexdigest(), comp)
    return out


def build_config(hosting):
    cfg = {}
    rewrites = []
    for r in hosting.get("rewrites", []):
        if "function" in r:
            rewrites.append({"glob": r["source"], "function": r["function"]})
        elif "run" in r:
            rewrites.append({"glob": r["source"], "run": r["run"]})
        elif "destination" in r:
            rewrites.append({"glob": r["source"], "path": r["destination"]})
    if rewrites:
        cfg["rewrites"] = rewrites
    hdrs = []
    for h in hosting.get("headers", []):
        hdrs.append({"glob": h["source"], "headers": {x["key"]: x["value"] for x in h["headers"]}})
    if hdrs:
        cfg["headers"] = hdrs
    for k in ("cleanUrls", "trailingSlashBehavior", "appAssociation"):
        if k in hosting:
            cfg[k] = hosting[k]
    if "trailingSlash" in hosting and "trailingSlashBehavior" not in cfg:
        cfg["trailingSlashBehavior"] = "ADD" if hosting["trailingSlash"] else "REMOVE"
    return cfg


def latest_version(site, h):
    r = requests.get(f"{API}/sites/{site}/releases?pageSize=1", headers=h, timeout=30)
    r.raise_for_status()
    rel = r.json().get("releases", [])
    return rel[0] if rel else None


def live_files(version_name, h):
    files, page = {}, None
    while True:
        url = f"{API}/{version_name}/files?pageSize=1000" + (f"&pageToken={page}" if page else "")
        r = requests.get(url, headers=h, timeout=30)
        r.raise_for_status()
        data = r.json()
        for f in data.get("files", []):
            files[f["path"]] = f["hash"]
        page = data.get("nextPageToken")
        if not page:
            break
    return files


def _publish_version(site, pub, hosting, h):
    cfg = build_config(hosting)
    print(f"Config translated: {len(cfg.get('rewrites', []))} rewrites, {len(cfg.get('headers', []))} header rules")
    r = requests.post(f"{API}/sites/{site}/versions", headers=h, json={"config": cfg}, timeout=30)
    r.raise_for_status()
    version = r.json()["name"]
    print(f"Created version: {version}")
    local = walk_public(pub)
    files_map = {p: hv for p, (hv, _b) in local.items()}
    print(f"Populating {len(files_map)} files ...")
    r = requests.post(f"{API}/{version}:populateFiles", headers=h, json={"files": files_map}, timeout=60)
    r.raise_for_status()
    required = r.json().get("uploadRequiredHashes", []) or []
    upload_url = r.json().get("uploadUrl")
    print(f"  files needing upload: {len(required)}")
    by_hash = {hv: b for _p, (hv, b) in local.items()}
    up_h = {"Authorization": h["Authorization"], "Content-Type": "application/octet-stream"}
    import concurrent.futures
    def _upload(hv):
        ur = requests.post(f"{upload_url}/{hv}", headers=up_h, data=by_hash[hv], timeout=120)
        return hv, ur.status_code, ur.text[:150]
    errs = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for hv, code, txt in ex.map(_upload, required):
            if code not in (200, 201, 204):
                errs.append((hv, code, txt))
    if errs:
        sys.exit(f"Upload failed ({len(errs)}): {errs[:3]}")
    print(f"  uploaded {len(required)} files")
    r = requests.patch(f"{API}/{version}?update_mask=status", headers=h, json={"status": "FINALIZED"}, timeout=30)
    r.raise_for_status()
    print("Version finalized")
    return version


def cmd_verify():
    site, _pub, _h = hosting_conf()
    h = headers()
    rel = latest_version(site, h)
    if not rel:
        print(f"No live release on site {site}")
        return
    v = rel["version"]
    print(f"Site            : {site}")
    print(f"Live version    : {v.get('name')}")
    print(f"Released at      : {rel.get('releaseTime')}")
    print(f"Rewrites in live : {len(v.get('config', {}).get('rewrites', []))}")


def cmd_diff():
    site, pub, _h = hosting_conf()
    h = headers()
    rel = latest_version(site, h)
    live = live_files(rel["version"]["name"], h) if rel else {}
    local = {p: hv for p, (hv, _b) in walk_public(pub).items()}
    added = sorted(set(local) - set(live))
    removed = sorted(set(live) - set(local))
    changed = sorted(p for p in set(local) & set(live) if local[p] != live[p])
    same = len(set(local) & set(live)) - len(changed)
    print(f"Local build dir : {pub}")
    print(f"Local files     : {len(local)}   Live files: {len(live)}")
    print(f"Unchanged       : {same}")
    print(f"Changed ({len(changed)}) : " + (", ".join(changed) if changed else "none"))
    print(f"New ({len(added)})     : " + (", ".join(added) if added else "none"))
    print(f"Removed ({len(removed)}) : " + (", ".join(removed) if removed else "none"))


def cmd_deploy():
    site, pub, hosting = hosting_conf()
    h = headers()
    prev = latest_version(site, h)
    if prev:
        print(f"Rollback point (current live): {prev['version']['name']}")
    version = _publish_version(site, pub, hosting, h)
    print("Releasing to LIVE ...")
    r = requests.post(f"{API}/sites/{site}/releases?versionName={version}", headers=h, timeout=30)
    r.raise_for_status()
    print(f"DONE. {version} is now live at https://{site}.web.app and staffiq.ng")


def cmd_preview():
    site, pub, hosting = hosting_conf()
    h = headers()
    channel = sys.argv[2] if len(sys.argv) > 2 else "cowork-check"
    cr = requests.post(f"{API}/sites/{site}/channels?channelId={channel}", headers=h, json={}, timeout=30)
    if cr.status_code not in (200, 201, 409):
        print(f"channel create note: {cr.status_code} {cr.text[:150]}")
    version = _publish_version(site, pub, hosting, h)
    print(f"Releasing to PREVIEW channel '{channel}' ...")
    r = requests.post(f"{API}/sites/{site}/channels/{channel}/releases?versionName={version}", headers=h, timeout=30)
    r.raise_for_status()
    gc = requests.get(f"{API}/sites/{site}/channels/{channel}", headers=h, timeout=30)
    url = gc.json().get("url") if gc.ok else "(unknown)"
    print(f"DONE preview. URL: {url}")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "verify"
    {"verify": cmd_verify, "diff": cmd_diff, "deploy": cmd_deploy, "preview": cmd_preview}.get(cmd, cmd_verify)()


if __name__ == "__main__":
    main()
