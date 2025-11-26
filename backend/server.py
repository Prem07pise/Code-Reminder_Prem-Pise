from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import qrcode
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
security = HTTPBearer()

# Models
class PatientRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    date_of_birth: str
    blood_group: str
    phone: str

class PatientLogin(BaseModel):
    email: EmailStr
    password: str

class MedicalRecord(BaseModel):
    condition: str
    diagnosis_date: str
    treatment: str
    doctor_name: str
    hospital: str
    notes: Optional[str] = ""

class PatientProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    date_of_birth: str
    blood_group: str
    phone: str
    allergies: List[str] = []
    medications: List[str] = []
    medical_records: List[dict] = []
    emergency_contact: Optional[str] = ""
    created_at: str

class UpdateProfile(BaseModel):
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    emergency_contact: Optional[str] = None

class AccessRequest(BaseModel):
    method: str  # "otp" or "qr"

class DoctorAccess(BaseModel):
    access_code: str
    doctor_name: str

class VerifyAccess(BaseModel):
    access_code: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(patient_id: str) -> str:
    payload = {
        "patient_id": patient_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_patient(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    patient = await db.patients.find_one({"id": payload["patient_id"]}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Routes
@api_router.post("/auth/register")
async def register(data: PatientRegister):
    existing = await db.patients.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    patient_id = str(uuid.uuid4())
    patient_data = {
        "id": patient_id,
        "email": data.email,
        "password": hash_password(data.password),
        "full_name": data.full_name,
        "date_of_birth": data.date_of_birth,
        "blood_group": data.blood_group,
        "phone": data.phone,
        "allergies": [],
        "medications": [],
        "medical_records": [],
        "emergency_contact": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.patients.insert_one(patient_data)
    token = create_token(patient_id)
    
    # Remove MongoDB _id from response
    patient_response = {k: v for k, v in patient_data.items() if k != "password"}
    
    return {
        "token": token,
        "patient": patient_response
    }

@api_router.post("/auth/login")
async def login(data: PatientLogin):
    patient = await db.patients.find_one({"email": data.email})
    if not patient or not verify_password(data.password, patient["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(patient["id"])
    
    # Remove MongoDB _id from response
    patient_response = {k: v for k, v in patient.items() if k != "password" and k != "_id"}
    
    return {
        "token": token,
        "patient": patient_response
    }

@api_router.get("/patient/profile")
async def get_profile(patient: dict = Depends(get_current_patient)):
    return {k: v for k, v in patient.items() if k != "password"}

@api_router.put("/patient/profile")
async def update_profile(data: UpdateProfile, patient: dict = Depends(get_current_patient)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if update_data:
        await db.patients.update_one(
            {"id": patient["id"]},
            {"$set": update_data}
        )
    
    updated_patient = await db.patients.find_one({"id": patient["id"]}, {"_id": 0})
    return {k: v for k, v in updated_patient.items() if k != "password"}

@api_router.post("/patient/medical-record")
async def add_medical_record(record: MedicalRecord, patient: dict = Depends(get_current_patient)):
    record_data = record.model_dump()
    record_data["id"] = str(uuid.uuid4())
    record_data["added_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.patients.update_one(
        {"id": patient["id"]},
        {"$push": {"medical_records": record_data}}
    )
    
    return {"message": "Record added successfully", "record": record_data}

@api_router.post("/patient/generate-access")
async def generate_access(request: AccessRequest, patient: dict = Depends(get_current_patient)):
    access_code = secrets.token_hex(4).upper()
    
    access_data = {
        "code": access_code,
        "patient_id": patient["id"],
        "patient_name": patient["full_name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "used": False
    }
    
    await db.access_codes.insert_one(access_data)
    
    if request.method == "qr":
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(access_code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "code": access_code,
            "qr_code": f"data:image/png;base64,{img_str}",
            "expires_at": access_data["expires_at"]
        }
    
    return {
        "code": access_code,
        "expires_at": access_data["expires_at"]
    }

@api_router.post("/doctor/verify-access")
async def verify_access(data: VerifyAccess):
    access = await db.access_codes.find_one({"code": data.access_code}, {"_id": 0})
    
    if not access:
        raise HTTPException(status_code=404, detail="Invalid access code")
    
    if access["used"]:
        raise HTTPException(status_code=400, detail="Access code already used")
    
    expires_at = datetime.fromisoformat(access["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Access code expired")
    
    patient = await db.patients.find_one({"id": access["patient_id"]}, {"_id": 0})
    
    await db.access_codes.update_one(
        {"code": data.access_code},
        {"$set": {"used": True}}
    )
    
    doctor_token = jwt.encode({
        "patient_id": patient["id"],
        "access_type": "doctor",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": doctor_token,
        "patient": {k: v for k, v in patient.items() if k != "password"}
    }

@api_router.get("/patient/access-logs")
async def get_access_logs(patient: dict = Depends(get_current_patient)):
    logs = await db.access_codes.find(
        {"patient_id": patient["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return logs

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()