"""Remplace les caractères invisibles non ASCII par des échappements \\u{...} dans les sources TS."""
import sys, unicodedata
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    out = []
    for ch in s:
        if ord(ch) > 127 and unicodedata.category(ch) in ('Zs', 'Zl', 'Zp', 'Cf', 'Cc', 'Mn') :
            out.append('\\u{%X}' % ord(ch))
        else:
            out.append(ch)
    n = ''.join(out)
    if n != s:
        open(p, 'w', encoding='utf-8').write(n)
        print('fixed', p)
