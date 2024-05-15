import sqlite3

from fastapi import APIRouter, Request

from ..core.config import config

router = APIRouter()


@router.get("/get/all")
async def get_all_reports(request: Request):
    connection = sqlite3.connect(config.SQLDB_NAME)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()

    query = "SELECT * FROM reports"
    resp = cursor.execute(query)
    result = resp.fetchall()

    return result


@router.get("/get/{_id}")
async def get_reports(_id: str, request: Request):
    connection = sqlite3.connect(config.SQLDB_NAME)
    cursor = connection.cursor()

    query = f"SELECT * FROM reports WHERE scenario_id = '{_id}'"
    resp = cursor.execute(query)
    result = resp.fetchall()

    return result
