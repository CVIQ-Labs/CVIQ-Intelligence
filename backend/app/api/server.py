from fastapi import FastAPI, UploadFile, File
from app.ingestion.parser import extract_text_from_pdf
app = FastAPI()

@app.post("/parse-pdf/")
async def parse_pdf(file: UploadFile = File(...)):
    # Read the uploaded file bytes
    file_bytes = await file.read()

    # Use parser if PDF
    if file.filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    else:
        # For non-PDF files, decode as text
        text = file_bytes.decode("utf-8", errors="ignore")

    return {
        "filename": file.filename,
        "content": text
    }
@app.get("/")
def home():
    return {"message": "Welcome to the PDF Parser API. Use the /parse-pdf/ endpoint to upload a PDF file."} 


