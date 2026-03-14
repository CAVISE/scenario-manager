import _tkinter
import tkinter
import matplotlib

print("Matplotlib", matplotlib.__version__, "backend =", matplotlib.get_backend())
print("_tkinter has __file__:", hasattr(_tkinter, "__file__"))
print("Tk version", tkinter.TkVersion)

print(tkinter.__file__)
print("tkinter has __file__:", hasattr(tkinter, "__file__"))
