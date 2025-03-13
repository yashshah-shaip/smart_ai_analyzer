import os
import tempfile
import requests
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from typing import Dict, List, Optional, Any, Tuple

class PDFProcessor:
    def __init__(self):
        # Initialize embedding model
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    async def download_pdf(self, url: str) -> str:
        """Download a PDF from a URL and save it to a temporary file"""
        response = requests.get(url)
        response.raise_for_status()
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_file.write(response.content)
        temp_file.close()
        
        return temp_file.name
    
    async def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file"""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    async def analyze_financial_document(self, file_url: str) -> Dict[str, Any]:
        """Analyze a financial document and extract key information"""
        try:
            # Download the PDF
            pdf_path = await self.download_pdf(file_url)
            
            # Extract text from the PDF
            text = await self.extract_text_from_pdf(pdf_path)
            
            # Clean up the temporary file
            os.unlink(pdf_path)
            
            # Split text into chunks for processing
            chunks = self.text_splitter.split_text(text)
            
            # Create a vector store from the text chunks
            vectorstore = Chroma.from_texts(chunks, self.embeddings)
            
            # For now, return a simple analysis
            # In a real implementation, you would use LLM to extract structured data
            return {
                "assets": None,
                "liabilities": None,
                "summary": "Financial document analyzed successfully",
                "details": {
                    "text_length": len(text),
                    "chunk_count": len(chunks)
                }
            }
            
        except Exception as e:
            return {
                "assets": None,
                "liabilities": None,
                "summary": f"Error analyzing document: {str(e)}",
                "details": {}
            }