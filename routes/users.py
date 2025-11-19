from fastapi import APIRouter, HTTPException
from database import table

router = APIRouter(prefix="/users", tags=["Users"])


# Get all users
@router.get("/")
def get_all_users():
    try:
        response = table("users").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a user by ID
@router.get("/{user_id}")
def get_user(user_id: str):
    try:
        response = table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new user
@router.post("/")
def create_user(user: dict):
    try:
        response = table("users").insert(user).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a user
@router.patch("/{user_id}")
def update_user(user_id: str, update_data: dict):
    try:
        response = table("users").update(update_data).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a user
@router.delete("/{user_id}")
def delete_user(user_id: str):
    try:
        response = table("users").delete().eq("id", user_id).execute()
        return {"status": "success", "message": f"User {user_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new user linked to a specific company
@router.post("/company/{company_id}")
def create_user_for_company(company_id: str, user: dict):
    """Create a new user and automatically link them to a company."""
    try:
        user["company_id"] = company_id
        response = table("users").insert(user).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")
