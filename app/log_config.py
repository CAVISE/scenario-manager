# -*- coding: utf-8 -*-

import logging
import os
from logging.handlers import RotatingFileHandler

_LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
_LOG_FILE = os.path.join(_LOG_DIR, "simulation.log")

_FMT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
_DATE_FMT = "%Y-%m-%d %H:%M:%S"

def _setup():
    root = logging.getLogger()
    if root.handlers:
        return  

    root.setLevel(logging.DEBUG)

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter(_FMT, _DATE_FMT))
    root.addHandler(ch)

    fh = RotatingFileHandler(_LOG_FILE, maxBytes=10*1024*1024, backupCount=3, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter(_FMT, _DATE_FMT))
    root.addHandler(fh)

_setup()

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def add_run_file_handler(log_file: str, level: int = logging.DEBUG) -> logging.Handler:
    """Mirror the root logger into a run-specific file."""
    os.makedirs(os.path.dirname(os.path.abspath(log_file)), exist_ok=True)
    handler = logging.FileHandler(log_file, mode="w", encoding="utf-8")
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(_FMT, _DATE_FMT))
    logging.getLogger().addHandler(handler)
    return handler


def remove_run_file_handler(handler: logging.Handler | None) -> None:
    if handler is None:
        return
    root = logging.getLogger()
    root.removeHandler(handler)
    handler.close()
