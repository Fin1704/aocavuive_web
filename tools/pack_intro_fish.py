"""Pack existing AoCaVuiVe PNG clips for the web; never write to the source repo."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

WEB = Path(__file__).resolve().parents[1]
GAME = WEB.parent / 'ao-ca-vui-ve'
OUT = WEB / 'public/ocean-intro/fish'
manifest = json.loads((GAME / 'animation_manifest.json').read_text(encoding='utf-8'))
OUT.mkdir(parents=True, exist_ok=True)
report = {'source_project': 'ao-ca-vui-ve', 'clips': []}
verify_only = '--verify' in sys.argv

for skin in ['thulu', 'bongbong', 'hecory']:
    record = manifest['characters'][f'fish_unity_{skin}']
    clip = record['animations']['animation']
    source = GAME / f'assets/characters/fish/{skin}/frames/animation'
    paths = sorted(source.glob('animation_*.png'))
    assert len(paths) == clip['frames'] == 48
    assert clip['fps'] == 30 and clip['loop'] is True
    originals = [p.read_bytes() for p in paths]
    hashes = [hashlib.sha256(data).hexdigest() for data in originals]
    source_size = tuple(record['canvas_size'])
    width = 320
    height = round(source_size[1] * width / source_size[0])
    sheet = Image.new('RGBA', (width * 8, height * 6))
    frames = []
    for i, p in enumerate(paths):
        assert p.name == f'animation_{i:03d}.png'
        with Image.open(p) as image:
            assert image.size == source_size
            frame = image.convert('RGBA').resize((width, height), Image.Resampling.LANCZOS)
        frames.append(frame)
        # Identical scale and unchanged canvas/origin for every frame, no per-frame trimming.
        sheet.paste(frame, ((i % 8) * width, (i // 8) * height))
    target = OUT / f'{skin}.webp'
    if target.exists() and not verify_only:
        raise FileExistsError(f'Refusing to overwrite {target}; use a new output version')
    if not verify_only:
        sheet.save(target, 'WEBP', lossless=True, method=6)
    with Image.open(target) as packed:
        packed = packed.convert('RGBA')
        for i, frame in enumerate(frames):
            x, y = (i % 8) * width, (i // 8) * height
            tile = packed.crop((x, y, x + width, y + height))
            # WebP may normalize RGB of fully transparent pixels; visible pixels and alpha must match.
            assert tile.getchannel('A').tobytes() == frame.getchannel('A').tobytes()
            for bg in [(0, 0, 0, 255), (255, 255, 255, 255)]:
                assert ImageChops.difference(Image.alpha_composite(Image.new('RGBA', tile.size, bg), tile).convert('RGB'), Image.alpha_composite(Image.new('RGBA', frame.size, bg), frame).convert('RGB')).getbbox() is None
    assert hashes == [hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
    normalized_anchor = [record['anchor_px'][0] * width / source_size[0], record['anchor_px'][1] * height / source_size[1]]
    report['clips'].append({
        'skin': skin, 'animation': 'animation', 'frames': 48, 'fps': 30, 'duration_seconds': 1.6,
        'loop': True, 'columns': 8, 'rows': 6, 'frame_width': width, 'frame_height': height,
        'source_canvas': list(source_size), 'source_anchor': record['anchor_px'], 'web_anchor': normalized_anchor,
        'source_directory': source.relative_to(GAME).as_posix(),
        'source_frame_sha256': hashes, 'sheet': target.name,
        'sheet_sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'bytes': target.stat().st_size, 'qc': '48 tiles match normalized frames; alpha retained; source hashes unchanged',
    })
    print(f'{skin}: 48 frames / 30 FPS / {width}x{height} cells / {target.stat().st_size} bytes')

if verify_only:
    assert json.loads((OUT / 'manifest.json').read_text(encoding='utf-8')) == report
else:
    (OUT / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
keyframes = ['/* Generated frame positions: 48 original frames at 30 FPS, 8 columns x 6 rows. */', '@keyframes ocean-native-swim {']
for i in range(48):
    keyframes.append(f' {i / 48 * 100:.8f}% {{ background-position: {i % 8 / 7 * 100:.8f}% {i // 8 / 5 * 100:.8f}%; }}')
keyframes.append(' 100% { background-position: 0% 0%; }\n}')
css_path = WEB / 'src/components/OceanIntro/fish-frames.css'
css = '\n'.join(keyframes) + '\n'
if verify_only:
    assert css_path.read_text(encoding='utf-8') == css
    print('Verified: all 144 frames, alpha, source hashes, metadata and 48 CSS steps match.')
else:
    css_path.write_text(css, encoding='utf-8')
