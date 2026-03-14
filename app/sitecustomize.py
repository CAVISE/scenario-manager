import os, time, re, itertools, atexit, warnings, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.axes import Axes

warnings.filterwarnings("ignore",
                        category=RuntimeWarning,
                        message="Mean of empty slice")

_SEQ = itertools.count(1)
_slug = lambda s: re.sub(r"[^\w\-.]", "_", s)[:60] or "fig"

def _save(fig):
    seq   = next(_SEQ)
    title = fig.axes[0].get_title() if fig.axes else ""
    fname = f"{time.strftime('%Y%m%d_%H%M%S')}_{_slug(title)}_{seq:03d}.png"
    os.makedirs("plots", exist_ok=True)
    fig.savefig(os.path.join("plots", fname), dpi=150)
    print(f"[plot] saved plots/{fname}")

def _patched_show(*a, **kw):
    for n in plt.get_fignums():
        _save(plt.figure(n))
    plt.close("all")
plt.show = _patched_show

@atexit.register
def _flush_remaining():
    for n in plt.get_fignums():
        _save(plt.figure(n))

_orig_plot = Axes.plot
def _safe_plot(self, *args, **kw):
    a = list(args)
    for i in range(0, len(a)-1, 2):
        try:
            lx, ly = len(a[i]), len(a[i+1])
            if lx != ly:
                n = min(lx, ly)
                a[i], a[i+1] = np.asarray(a[i])[:n], np.asarray(a[i+1])[:n]
        except Exception:
            pass
    return _orig_plot(self, *a, **kw)
Axes.plot = _safe_plot