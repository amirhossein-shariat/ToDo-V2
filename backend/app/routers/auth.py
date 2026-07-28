from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app import models, schemas
from app.auth import (
    generate_token,
    get_current_session,
    get_current_user,
    hash_pin,
    normalize_phone,
    validate_pin,
    verify_pin,
)
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.AuthResponse)
def login_or_signup(payload: schemas.LoginRequest, db: DBSession = Depends(get_db)):
    phone = normalize_phone(payload.phone)
    pin = validate_pin(payload.pin)

    user = db.query(models.User).filter(models.User.phone == phone).first()

    if user:
        if not verify_pin(pin, user.pin_hash):
            raise HTTPException(status_code=401, detail="رمز اشتباه است")
    else:
        user = models.User(phone=phone, pin_hash=hash_pin(pin))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = generate_token()
    db.add(models.Session(token=token, user_id=user.id))
    db.commit()

    return schemas.AuthResponse(token=token, phone=user.phone)


@router.post("/logout", status_code=204)
def logout(
    session: models.Session = Depends(get_current_session),
    db: DBSession = Depends(get_db),
):
    db.delete(session)
    db.commit()


@router.get("/me", response_model=schemas.MeResponse)
def me(current_user: models.User = Depends(get_current_user)):
    return schemas.MeResponse(phone=current_user.phone)
