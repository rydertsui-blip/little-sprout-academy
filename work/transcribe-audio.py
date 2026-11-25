import json, pathlib, subprocess, sys, concurrent.futures, os, time

root = pathlib.Path('/Users/rydertsui/Desktop/幼儿学习天地')
manifest = json.load(open(root/'work/family-audit/audio-manifest.json'))['rows']
audio_dir = root/'apps/family/public/assets/audio'
outdir = pathlib.Path('/tmp/family-asr')
wavdir = outdir/'wav'; txtdir = outdir/'txt'
wavdir.mkdir(parents=True, exist_ok=True); txtdir.mkdir(parents=True, exist_ok=True)
model = root/'work/whisper-models/ggml-small.bin'

def prepare(row):
    key=row['key']; src=audio_dir/f'{key}.m4a'; wav=wavdir/f'{key}.wav'
    if not src.exists(): return (key, 'MISSING_SRC', row)
    if not wav.exists() or wav.stat().st_size < 100:
        r=subprocess.run(['ffmpeg','-y','-v','error','-i',str(src),'-ar','16000','-ac','1',str(wav)],capture_output=True,text=True)
        if r.returncode: return (key, 'FFMPEG_FAIL:'+r.stderr[-200:], row)
    return (key, 'READY', row)

def transcribe(row):
    key=row['key']; wav=wavdir/f'{key}.wav'; out=txtdir/f'{key}'
    if not wav.exists(): return (key, 'MISSING_WAV', '')
    if out.with_suffix('.txt').exists() and out.with_suffix('.txt').stat().st_size>0:
        return (key, 'SKIP', '')
    r=subprocess.run(['/opt/homebrew/bin/whisper-cli','-m',str(model),'-f',str(wav),'-l',row['lang'],'-otxt','-of',str(out),'-np','-nt','-t','2'],capture_output=True,text=True,timeout=120)
    if r.returncode:
        return (key, 'ASR_FAIL:'+r.stderr[-200:], '')
    return (key, 'OK', '')

start=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    prep=list(ex.map(prepare, manifest))
bad=[x for x in prep if x[1]!='READY']
print('prepared',len(prep),'bad',len(bad),flush=True)
for x in bad[:10]: print(x,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
    results=list(ex.map(transcribe, manifest))
bad2=[x for x in results if x[1] not in ('OK','SKIP')]
print('transcribed',len(results),'bad',len(bad2),'elapsed',round(time.time()-start,1),flush=True)
for x in bad2[:20]: print(x,flush=True)
