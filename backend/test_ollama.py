#!/usr/bin/env python3

import ollama
import json

def test_ollama():
    try:
        print("Testing Ollama connection...")
        client = ollama.Client()
        
        # Test with the problematic prompt
        prompt = """
You are an expert home repair assistant. Create a repair plan for: curtain rod has fallen off

Respond with ONLY valid JSON in this format:
{
    "diagnosis": "Wall anchors likely failed",
    "steps": [{"step": 1, "instruction": "Remove old hardware", "tools_needed": ["screwdriver"], "estimated_time": "5 minutes"}],
    "is_diy": true,
    "estimated_time": "30 minutes",
    "estimated_cost": "$10-20",
    "safety_warnings": ["Use sturdy ladder", "Check wall type before drilling"],
    "recommended_provider": null
}

Respond with ONLY the JSON object, no other text.
"""
        
        response = client.generate(
            model="phi4-mini",
            prompt=prompt,
            stream=False,
            options={
                "temperature": 0.3,
                "num_predict": 500,
                "top_p": 0.9
            }
        )
        
        print("Response received:")
        print("Response text:", repr(response.response))
        print("Response length:", len(response.response))
        
        if response.response.strip():
            print("Attempting to parse JSON...")
            try:
                parsed = json.loads(response.response)
                print("✅ Valid JSON:", parsed)
            except json.JSONDecodeError as e:
                print("❌ Invalid JSON:", e)
                print("Raw response:", response.response)
        else:
            print("❌ Empty response!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ollama()