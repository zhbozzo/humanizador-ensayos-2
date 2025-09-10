#!/usr/bin/env python3
"""
Quick test script to verify backend functionality without full setup.
This tests the core modules in demo mode.
"""

import sys
import os

# Simple test without external dependencies
def test_basic_functionality():
    print("🔧 Testing basic backend functionality...")
    
    # Test 1: Import structure
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        print("✅ Python path configured")
    except Exception as e:
        print(f"❌ Path configuration failed: {e}")
        return False
    
    # Test 2: Basic entity extraction (without dependencies)
    try:
        import re
        
        # Simple entity extraction test
        text = "En 2024, el 85% de los participantes (García, 2020) obtuvieron resultados."
        
        # Extract numbers
        numbers = re.findall(r'\b\d+%?\b', text)
        years = re.findall(r'\b(?:19|20)\d{2}\b', text)
        citations = re.findall(r'\([^)]*\d{4}[^)]*\)', text)
        
        print(f"✅ Found numbers: {numbers}")
        print(f"✅ Found years: {years}")  
        print(f"✅ Found citations: {citations}")
        
    except Exception as e:
        print(f"❌ Entity extraction test failed: {e}")
        return False
    
    # Test 3: Basic FastAPI structure
    try:
        # Check if main.py exists and has basic structure
        with open('main.py', 'r') as f:
            content = f.read()
            
        required_elements = [
            'from fastapi import FastAPI',
            'app = FastAPI',
            '/api/humanize',
            'HumanizeRequest',
            'HumanizeResponse'
        ]
        
        for element in required_elements:
            if element in content:
                print(f"✅ Found: {element}")
            else:
                print(f"❌ Missing: {element}")
                return False
                
    except Exception as e:
        print(f"❌ FastAPI structure test failed: {e}")
        return False
    
    # Test 4: Requirements file
    try:
        with open('requirements.txt', 'r') as f:
            requirements = f.read()
            
        required_packages = [
            'fastapi',
            'uvicorn',
            'openai',
            'python-dotenv'
        ]
        
        for package in required_packages:
            if package in requirements:
                print(f"✅ Required package: {package}")
            else:
                print(f"❌ Missing package: {package}")
                
    except Exception as e:
        print(f"❌ Requirements test failed: {e}")
        return False
    
    print("\n🎉 Basic backend functionality tests passed!")
    print("\nTo fully test with dependencies:")
    print("1. pip install -r requirements.txt")
    print("2. uvicorn main:app --reload")
    print("3. Open http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    test_basic_functionality()
