import json, re, hashlib, urllib.parse, urllib.request
from pathlib import Path
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'radar-config.json').read_text(encoding='utf-8'))
NOW=datetime.now(timezone.utc)
CUTOFF=NOW-timedelta(days=int(CFG.get('lookbackDays',10)))
UA='Mozilla/5.0 MajlisRadar/1.0'

OPPORTUNITY_WORDS=('appel à projets','appel a projets','opportunité','opportunite','financement','subvention','aide','bourse','recrute','recrutement','mission','freelance','programme','candidature','investissement','fonds','grant','funding','accelerator','incubateur')
NEW_WORDS=('lance','lancement','nouveau','nouvelle','annonce','mise à jour','sortie','release','ouvre','ouverture','dévoile','innovation')

def clean_title(s):
    s=re.sub(r'\s+',' ',s or '').strip()
    # Google News often appends source as " - Source"; keep title readable.
    return s

def kind_for(title):
    low=title.lower()
    if any(w in low for w in OPPORTUNITY_WORDS): return 'opportunity'
    if any(w in low for w in NEW_WORDS): return 'new'
    return 'news'

def score_for(title,published):
    low=title.lower(); score=0
    if any(w in low for w in OPPORTUNITY_WORDS): score+=5
    if any(w in low for w in NEW_WORDS): score+=2
    age=max(0,(NOW-published).total_seconds()/86400)
    score+=max(0,4-age*.35)
    return round(score,2)

def fetch_topic(topic):
    q=urllib.parse.quote(topic['query'])
    url=f'https://news.google.com/rss/search?q={q}&hl=fr&gl=FR&ceid=FR:fr'
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=20) as r:
        xml=r.read()
    root=ET.fromstring(xml)
    out=[]
    for item in root.findall('.//item')[:20]:
        title=clean_title(item.findtext('title'))
        link=(item.findtext('link') or '').strip()
        pub=item.findtext('pubDate') or ''
        try: dt=parsedate_to_datetime(pub).astimezone(timezone.utc)
        except Exception: dt=NOW
        if dt<CUTOFF: continue
        source_el=item.find('source')
        source=(source_el.text.strip() if source_el is not None and source_el.text else '')
        if not title or not link: continue
        out.append({
            'id':hashlib.sha1((title+link).encode()).hexdigest()[:14],
            'topic':topic['id'],'topicLabel':topic['label'],'title':title,'url':link,
            'source':source,'published':dt.isoformat(),'kind':kind_for(title),
            'score':score_for(title,dt)
        })
    return out

def main():
    items=[]; errors=[]
    for topic in CFG['topics']:
        try: items.extend(fetch_topic(topic))
        except Exception as e: errors.append(f"{topic['label']}: {e}")
    seen=set(); dedup=[]
    for x in sorted(items,key=lambda z:(z['score'],z['published']),reverse=True):
        key=re.sub(r'\W+',' ',x['title'].lower())[:110]
        if key in seen: continue
        seen.add(key); dedup.append(x)
    result={
        'generatedAt':NOW.isoformat(),
        'topics':[{'id':t['id'],'label':t['label']} for t in CFG['topics']],
        'items':dedup[:int(CFG.get('maxItems',30))],
        'status':'ok' if dedup else 'empty',
        'errors':errors[:6]
    }
    (ROOT/'radar.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f"Radar: {len(result['items'])} items, {len(errors)} errors")

if __name__=='__main__': main()
