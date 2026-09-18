"""Standalone bot; credentials come only from environment secrets."""
import json
import os
import re
from datetime import datetime, timedelta, timezone

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

SHEET = '1rWlf7Zv1X2Cc8-bB7wDr8TcR5RZaxOK4WIgxEvymzLc'
GID = 891613457
TAB = '5. Recap Coaching/Refreshing'
TZ = timezone(timedelta(hours=7))
HEADERS = ['Year', 'Week', 'Session Type', 'Project', 'Topic', 'Date', 'Timeline', 'Detail', 'PIC incharge', 'Status', 'Recap', 'Agent list (tên IH system)', 'Document', '#Participant', 'Next steps', 'Final Result']

# Action không phải buổi coaching/refreshing -> KHÔNG ghi vào tab này (bỏ qua im lặng, không báo lỗi).
NON_RECAP = [r'monitor', r'g[ửu]i\s*kb|tài liệu|tai lieu|\bkb\b', r'escalate', r'follow[\s-]?up', r'^work với bo/tl$']

class SkipRecord(Exception):
    """Record cố ý không đưa vào tab Recap (vd Monitor case, Gửi KB, Escalate, Follow-up)."""

def candidates(event):
    p = event.get('payload') or {}
    kind = event['kind']
    if event.get('op') == 'delete' or p.get('demo'):
        return []
    items = []
    def add(d, key, email, name, session):
        if d.get('demo') or (kind == 'log' and 'recap' not in d):
            return
        recap = d.get('recap', d.get('action' if kind == 'coaching' else 'detail', ''))
        next_steps = d.get('nextSteps') or d.get('commitment') or ''
        document = d.get('document') or d.get('evidence') or ''
        if not any(str(v or '').strip() for v in [recap, next_steps, document]):
            return
        if '[MINH HỌA]' in str(recap).upper():
            return
        items.append(dict(key=key, email=email, name=d.get('agentName') or d.get('csName') or name,
                          at=d.get('createdAt') or d.get('loggedAt') or d.get('at'),
                          qa=d.get('reviewer') or d.get('qa') or d.get('by') or event.get('qa_label'),
                          session=d.get('sessionType') or session, recap=recap or '',
                          next_steps=next_steps, document=document, event_id=int(event['id'])))
    if kind == 'log':
        add(p, 'log:'+str(p['id']), p.get('agent'), p.get('agentName'), p.get('method') or p.get('action') or p.get('topic'))
    elif kind == 'journey':
        for r in p.get('rounds', []):
            add(r, f"journey:{p['id']}:{r['id']}", p.get('csEmail'), p.get('csName'), r.get('actionType'))
    elif kind == 'coaching':
        add(p, 'coaching:'+str(p['id']), p.get('agent'), p.get('agentName'), 'Coaching')
        for i, r in enumerate(p.get('reviews', [])):
            add(r, f"coaching:{p['id']}:review:{r.get('id', i)}", p.get('agent'), p.get('agentName'), 'Coaching')
    return items

def row_values(item, names):
    if not item.get('at') or 'T' not in item['at']:
        raise ValueError('missing exact recording timestamp')
    dt = datetime.fromisoformat(item['at'].replace('Z', '+00:00'))
    if dt.tzinfo is None:
        raise ValueError('missing timestamp timezone')
    dt = dt.astimezone(TZ)
    jan = dt.replace(month=1, day=1)
    week = ((dt.date()-jan.date()).days + jan.weekday()) // 7 + 1
    name = item.get('name') or names.get(item.get('email'))
    if not name or not item.get('qa'):
        raise ValueError('missing CS/QA name')
    session = str(item.get('session') or '').lower()
    if any(re.search(pattern, session) for pattern in NON_RECAP):
        raise SkipRecord()
    choices = [(r'warning|warining', 'Warning Letter'), (r'kick[ -]?off', 'Kick off'),
               (r'catch[ -]?up', 'Catchup'), (r'refresh|test lại kiến thức', 'Refreshing'),
               (r'training', 'Training'), (r'coach|recheck|shadowing|case practice', 'Coaching')]
    session = next((label for pattern, label in choices if re.search(pattern, session)), None)
    if not session:
        raise ValueError('unmapped Session Type')
    return [dt.year, week, session, 'Normal', '1:1', dt.strftime('%d-%m-%Y'), dt.strftime('%H:%M:%S'), name, item['qa'], 'Complete', item['recap'], name, item['document'], 1, item['next_steps'], '']

def response_json(response):
    # Do not leak response bodies, credentials or staff notes into CI logs.
    if not response.ok:
        raise RuntimeError('API request failed, HTTP '+str(response.status_code))
    return response.json()

def run():
    dry = os.environ.get('DRY_RUN', 'true').lower() != 'false'
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_JSON']),
        scopes=['https://www.googleapis.com/auth/spreadsheets'])
    google = AuthorizedSession(credentials)
    base = f'https://sheets.googleapis.com/v4/spreadsheets/{SHEET}'
    data = response_json(google.get(base, params={'ranges': f"'{TAB}'!A:P", 'includeGridData': 'true'}, timeout=90))
    sheet = next((s for s in data['sheets'] if s['properties']['sheetId'] == GID), None)
    if not sheet or sheet['properties']['title'] != TAB:
        raise ValueError('Target tab does not match')
    rows = sheet.get('data', [{}])[0].get('rowData', [])
    header = next((i for i, r in enumerate(rows[:20]) if [str(c.get('formattedValue', '')).strip().lower() for c in r.get('values', [])[:16]] == [h.lower() for h in HEADERS]), None)
    if header is None:
        raise ValueError('Expected 16 headers in A:P; no changes made')
    existing = {}
    last = header
    for i, row in enumerate(rows):
        cells = row.get('values', [])
        if any(c.get('userEnteredValue') or c.get('note') for c in cells):
            last = i
        note = cells[0].get('note', '') if cells else ''
        if note.startswith('CSP_RECAP:'):
            existing[note.split('\n')[0][10:]] = (i, cells)
    names_data = response_json(requests.get('https://teamqamcvn.com/cs-performance/data.json', timeout=90))
    names = {a['email']: a['name'] for a in names_data['agents']}
    source = os.environ.get('SUPABASE_URL', 'https://ytbcydursrpjqnaalhxc.supabase.co').rstrip('/')
    key = os.environ['SUPABASE_SERVICE_KEY']
    latest, cursor = {}, 0
    while True:
        events = response_json(requests.get(source+'/rest/v1/csp_events', params={'select':'*', 'order':'id.asc', 'id':f'gt.{cursor}', 'limit':1000}, headers={'apikey':key,'Authorization':'Bearer '+key}, timeout=90))
        if not events:
            break
        for event in events:
            for item in candidates(event):
                latest[item['key']] = item
        cursor = int(events[-1]['id'])
    updates, skipped = [], []
    for identifier, item in latest.items():
        try:
            values = row_values(item, names)
        except SkipRecord:
            continue  # action không phải recap coaching -> bỏ qua im lặng
        except ValueError as error:
            skipped.append({'event_id':item['event_id'],'reason':str(error)})
            continue
        cells = [{'userEnteredValue': {'numberValue':v} if isinstance(v, (int,float)) else {'stringValue':str(v)}} for v in values[:15]]
        # Update A:O only; preserve Final Result in P and formatting.
        cells[0]['note'] = 'CSP_RECAP:'+identifier+'\n'+str(item['event_id'])
        if identifier in existing:
            index, old = existing[identifier]
            for column in range(1, len(cells)):
                if column < len(old) and 'note' in old[column]:
                    cells[column]['note'] = old[column]['note']
            if all((old[i].get('userEnteredValue', {}) if i<len(old) else {}) == cell['userEnteredValue'] for i,cell in enumerate(cells)):
                continue
        else:
            last += 1
            index = last
        updates.append({'updateCells':{'range':{'sheetId':GID,'startRowIndex':index,'endRowIndex':index+1,'startColumnIndex':0,'endColumnIndex':15},'rows':[{'values':cells}],'fields':'userEnteredValue,note'}})
    requests_batch = []
    count = sheet['properties']['gridProperties']['rowCount']
    if last >= count:
        requests_batch.append({'appendDimension':{'sheetId':GID,'dimension':'ROWS','length':last-count+1}})
    requests_batch.extend(updates)
    print(json.dumps({'dry_run':dry,'rows_to_write':len(updates),'skipped':skipped}))
    if not dry:
        for offset in range(0,len(requests_batch),100):
            response_json(google.post(base+':batchUpdate', json={'requests':requests_batch[offset:offset+100]}, timeout=90))
    if skipped:
        raise RuntimeError('Some records need mapping/time fixes; see event IDs above')

if __name__ == '__main__':
    run()
