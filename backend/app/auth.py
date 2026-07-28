import hashlib
import os
import re
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session as DBSession

from app import models
from app.database import get_db

PIN_PATTERN = re.compile(r"^\d{4}$")


_DIGIT_TRANSLATION = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"
)


def normalize_phone(phone: str) -> str:
    ascii_phone = (phone or "").translate(_DIGIT_TRANSLATION)
    digits = re.sub(r"\D", "", ascii_phone)
    if len(digits) < 8:
        raise HTTPException(status_code=400, detail="شماره تلفن نامعتبر است")
    return digits


def validate_pin(pin: str) -> str:
    ascii_pin = (pin or "").translate(_DIGIT_TRANSLATION)
    if not PIN_PATTERN.match(ascii_pin):
        raise HTTPException(status_code=400, detail="رمز باید دقیقاً ۴ رقم باشد")
    return ascii_pin


def hash_pin(pin: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", pin.encode(), salt, 100_000)
    return salt.hex() + ":" + digest.hex()


def verify_pin(pin: str, stored: str) -> bool:
    try:
        salt_hex, _digest_hex = stored.split(":")
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    return hash_pin(pin, salt) == stored


def generate_token() -> str:
    return secrets.token_hex(32)


def get_current_session(
    authorization: str = Header(default=None), db: DBSession = Depends(get_db)
) -> models.Session:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="وارد نشده‌اید")
    token = authorization.removeprefix("Bearer ").strip()
    session = db.query(models.Session).filter(models.Session.token == token).first()
    if not session:
        raise HTTPException(status_code=401, detail="نشست نامعتبر است، دوباره وارد شوید")
    return session


def get_current_user(
    session: models.Session = Depends(get_current_session), db: DBSession = Depends(get_db)
) -> models.User:
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="کاربر پیدا نشد")
    return user
