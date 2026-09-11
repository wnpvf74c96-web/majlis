import json, re, hashlib, urllib.parse, urllib.request
from pathlib import Path
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'radar-config.json').read_text(encoding='utf-8'))
NOW=datetime.now(timezone.utc)
CUTOFF=NOW-timedelta(days=int(CFG.get('lookbackDays',10)))
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36 MajlisRadar/1.1'

OPPORTUNITY_WORDS=('appel à projets','appel a projets','opportunité','opportunite','financement','subvention','aide','bourse','recrute','recrutement','mission','freelance','programme','candidature','investissement','fonds','grant','funding','accelerator','incubateur','concours','marché public','marche public')
NEW_WORDS=('lance','lancement','nouveau','nouvelle','annonce','mise à jour','sortie','release','ouvre','ouverture','dévoile','innovation','présente','presente')

def clean_title(s):
    return re.sub(r'\s+',' ',s or '').strip()

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

def open_url(url, timeout=14):
    req=urllib.request.Request(url,headers={
        'User-Agent':UA,
        'Accept':'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language':'fr-FR,fr;q=0.9,en;q=0.7'
    })
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return r.read()

def parse_rss(xml, topic, source_hint=''):
    root=ET.fromstring(xml)
    out=[]
    for item in root.findall('.//item')[:25]:
        title=clean_title(item.findtext('title'))
        link=(item.findtext('link') or '').strip()
        pub=item.findtext('pubDate') or item.findtext('{http://purl.org/dc/elements/1.1/}date') or ''
        try: dt=parsedate_to_datetime(pub).astimezone(timezone.utc)
        except Exception: dt=NOW
        if dt<CUTOFF: continue
        source_el=item.find('source')
        source=(source_el.text.strip() if source_el is not None and source_el.text else source_hint)
        if not title or not link: continue
        out.append({
            'id':hashlib.sha1((title+link).encode()).hexdigest()[:14],
            'topic':topic['id'],'topicLabel':topic['label'],'title':title,'url':link,
            'source':source or 'Actualité web','published':dt.isoformat(),'kind':kind_for(title),
            'score':score_for(title,dt)
        })
    return out

def fetch_topic(topic):
    query=topic['query']
    providers=[
        ('Google News', f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=fr&gl=FR&ceid=FR:fr"),
        ('Bing News', f"https://www.bing.com/news/search?q={urllib.parse.quote_plus(query)}&format=rss&setlang=fr-fr")
    ]
    errors=[]
    for provider,url in providers:
        try:
            items=parse_rss(open_url(url),topic,provider)
            if items: return items, errors
            errors.append(f'{provider}: aucun résultat récent')
        except Exception as e:
            errors.append(f'{provider}: {type(e).__name__}: {e}')
    return [], errors

def main():
    items=[]; errors=[]
    for topic in CFG['topics']:
        got, errs=fetch_topic(topic)
        items.extend(got)
        if errs and not got:
            errors.append(f"{topic['label']}: " + ' | '.join(errs))
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
    print(f"Radar: {len(result['items'])} items, {len(errors)} topic errors")
    for err in errors[:6]: print('WARN',err)

if __name__=='__main__': main()
