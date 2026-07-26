# utils.py
import pandas as pd
from openpyxl.utils.cell import coordinate_from_string
import xlwings as xw
import os

def convert_range(excel_range):
    """Convert Excel range like 'A3:D20' into args for pd.read_excel"""
    upper_left, _ = excel_range.split(":")
    _, top_row = coordinate_from_string(upper_left)
    return {"skiprows": int(top_row) - 1}

def read_excelrange(filepath, sheetname=None, readrange=None):
    """
    Reads Excel/CSV into list of dicts.
    - If CSV → ignore sheet/range, read full file.
    - If Excel → sheet/range optional.
    """
    ext = os.path.splitext(filepath)[-1].lower()

    try:
        if ext == ".csv":
            df = pd.read_csv(filepath)
        else:  # Excel
            args = {}
            if readrange:
                args = convert_range(readrange)

            df = pd.read_excel(filepath, sheet_name=sheetname or 0, **args)

        # Normalize datetime columns
        date_columns = df.select_dtypes(include="datetime").columns
        df[date_columns] = df[date_columns].apply(pd.to_datetime, errors="coerce")
        df[date_columns] = df[date_columns].map(
            lambda x: x.strftime("%m-%d-%Y %H:%M:%S") if pd.notna(x) else None
        )
        return df.to_dict("records")

    except Exception:
        # Fallback to xlwings for tricky Excel files
        if ext == ".csv":
            raise  # CSV should never need xlwings

        app = xw.App(visible=False)
        try:
            wb = app.books.open(filepath)
            sheet = wb.sheets[sheetname] if sheetname else wb.sheets[0]
            sheet.api.Rows.Hidden = False
            sheet.api.Columns.Hidden = False
            data = sheet.used_range.value
            df = pd.DataFrame(data[1:], columns=data[0])

            # Normalize datetime columns
            date_columns = df.select_dtypes(include="datetime64").columns
            for col in date_columns:
                df[col] = df[col].map(
                    lambda x: x.strftime("%m-%d-%Y %H:%M:%S") if x else None
                )

            wb.close()
            app.quit()
            return df.to_dict("records")
        except Exception:
            wb.close()
            app.quit()
            raise
