import os
import stripe
from fastapi import APIRouter, HTTPException

# Create router (DO NOT create FastAPI() here)
router = APIRouter()

# Load Stripe secret safely (CI/CD won't crash if missing)
STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY", "sk_test_dummy")
client = stripe.StripeClient(STRIPE_SECRET)

# Your backend domain
YOUR_DOMAIN = "https://cv-reviewer-api.fly.dev"


@router.post("/create-checkout-session")
async def create_checkout_session():
    """
    Creates a Stripe Checkout Session and returns the client secret.
    """
    try:
        session = client.v1.checkout.sessions.create(params={
            "ui_mode": "embedded_page",
            "line_items": [
                {
                    "price": "{{PRICE_ID}}",  # Replace with your real price ID
                    "quantity": 1,
                }
            ],
            "mode": "payment",
            "return_url": f"{YOUR_DOMAIN}/return.html?session_id={{CHECKOUT_SESSION_ID}}",
        })

        return {"clientSecret": session.client_secret}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/session-status")
async def session_status(session_id: str):
    """
    Retrieves the status of a Stripe Checkout Session.
    """
    try:
        session = client.v1.checkout.sessions.retrieve(session_id)
        return {
            "status": session.status,
            "customer_email": session.customer_details.email,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
