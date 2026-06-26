from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe
import os

app = FastAPI()

# Stripe client (test key placeholder)
client = stripe.StripeClient()

# Your deployed backend domain
YOUR_DOMAIN = "https://cv-reviewer-api.fly.dev"


# CORS (optional but recommended)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Create Checkout Session
# -----------------------------
@app.post("/create-checkout-session")
async def create_checkout_session():
    try:
        session = client.v1.checkout.sessions.create(params={
            "ui_mode": "embedded_page",
            "line_items": [
                {
                    "price": "{{PRICE_ID}}",  # replace with real price ID
                    "quantity": 1,
                }
            ],
            "mode": "payment",
            "return_url": f"{YOUR_DOMAIN}/return.html?session_id={{CHECKOUT_SESSION_ID}}",
        })

        return {"clientSecret": session.client_secret}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Get Session Status
# -----------------------------
@app.get("/session-status")
async def session_status(session_id: str):
    try:
        session = client.v1.checkout.sessions.retrieve(session_id)
        return {
            "status": session.status,
            "customer_email": session.customer_details.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
