import os
import json
import base64
from typing import List, Optional
from PIL import Image
import io
import requests
import ollama

class Phi4Service:
    def __init__(self):
        self.model_name = "phi4-mini:latest"  # Updated to match Ollama format
        self.client = ollama.Client()
        self.is_model_available = False
        
    def check_model_availability(self):
        """Check if Phi-4 Mini model is available in Ollama"""
        try:
            models_response = self.client.list()
            print(f"Debug: Ollama response type: {type(models_response)}")  # Debug print
            
            if hasattr(models_response, 'models') or 'models' in models_response:
                # Handle both object and dict responses
                models = models_response.models if hasattr(models_response, 'models') else models_response['models']
                
                available_models = []
                for model in models:
                    # Handle both object and dict model representations
                    if hasattr(model, 'model'):
                        model_name = model.model
                    elif isinstance(model, dict) and 'name' in model:
                        model_name = model['name']
                    elif isinstance(model, dict) and 'model' in model:
                        model_name = model['model']
                    else:
                        model_name = str(model)
                    available_models.append(model_name)
                
                print(f"Debug: Available models: {available_models}")  # Debug print
                
                # Check for phi4-mini
                self.is_model_available = any(
                    'phi4-mini' in model.lower() for model in available_models
                )
                
                if self.is_model_available:
                    # Find the exact model name
                    for model in available_models:
                        if 'phi4-mini' in model.lower():
                            self.model_name = model
                            print(f"Debug: Using model: {self.model_name}")  # Debug print
                            break
                    
                return self.is_model_available
            else:
                print("Debug: No 'models' in response")
                return False
        except Exception as e:
            print(f"Error checking Ollama models: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def preprocess_image(self, image_path: str) -> str:
        """Convert image to base64 for Ollama"""
        try:
            image = Image.open(image_path)
            # Resize if too large
            if image.size[0] > 1024 or image.size[1] > 1024:
                image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return img_base64
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def generate_repair_plan(self, image_path: str, description: str) -> dict:
        """Generate repair plan using Phi-4 Mini via Ollama"""
        print(f"Generating repair plan for: {description}")
        
        if not self.check_model_availability():
            raise Exception("Phi-4 Mini model is not available. Please ensure Ollama is running and phi4-mini is installed.")
        
        try:
            # Create a detailed prompt for Phi-4
            prompt = f"""
You are an expert home repair assistant. Create a detailed repair plan for this issue.

Issue: "{description}"

You must respond with ONLY valid JSON in exactly this format:

{{
    "diagnosis": "Explain what's wrong and why",
    "steps": [
        {{
            "step": 1,
            "instruction": "First action to take",
            "tools_needed": ["tool1", "tool2"],
            "estimated_time": "X minutes"
        }},
        {{
            "step": 2,
            "instruction": "Second action to take", 
            "tools_needed": ["tool3"],
            "estimated_time": "X minutes"
        }}
    ],
    "is_diy": true,
    "estimated_time": "Total time",
    "estimated_cost": "$X-Y",
    "safety_warnings": ["Only include safety warnings that are RELEVANT to this specific repair type - e.g., electrical safety for electrical work, water safety for plumbing, structural safety for wall work. Do NOT include generic electrical warnings for non-electrical repairs"],
    "recommended_provider": "Use ONLY one of these values: 'general', 'plumbing', 'electrical', 'appliances', or null for DIY repairs"
}}

CRITICAL: Safety warnings must be contextually appropriate. For example:
- Curtain/window repairs: Use sturdy ladder, check wall anchors, wear safety glasses
- Electrical repairs: Turn off power at breaker, use non-contact voltage tester, wear insulated gloves
- Plumbing repairs: Turn off water supply, have towels ready, check for leaks
- General repairs: Wear appropriate protective equipment, ensure stable work surface

CRITICAL: For recommended_provider, use ONLY these exact values:
- "general" for basic home repairs, furniture, walls, windows, doors
- "plumbing" for water-related issues, pipes, leaks, toilets
- "electrical" for wiring, outlets, switches, electrical fixtures
- "appliances" for kitchen/laundry appliances, HVAC
- null for simple DIY repairs

Important: Respond with ONLY the JSON object, no other text or formatting.
"""

            print("Sending request to Phi-4...")
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False,
                options={
                    "temperature": 0.3,  # Lower temperature for more focused responses
                    "num_predict": 1000,  # More tokens for detailed repair plans
                    "top_p": 0.9
                    # Removed stop tokens that were cutting off markdown code blocks
                }
            )
            
            response_text = response['response'].strip()
            print(f"Phi-4 response received: {response_text[:200]}...")
            
            # Extract JSON from response
            try:
                # Clean the response
                response_text = response_text.strip()
                
                # Remove markdown code blocks if present
                if "```json" in response_text:
                    start = response_text.find("```json") + 7
                    end = response_text.find("```", start)
                    if end != -1:
                        response_text = response_text[start:end].strip()
                elif "```" in response_text:
                    start = response_text.find("```") + 3
                    end = response_text.find("```", start)
                    if end != -1:
                        response_text = response_text[start:end].strip()
                
                # Find the JSON part
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx == -1 or end_idx == 0:
                    print(f"No JSON brackets found. Raw response: {response_text}")
                    raise ValueError("No JSON found in response")
                
                json_str = response_text[start_idx:end_idx]
                print(f"Extracted JSON: {json_str[:200]}...")
                
                repair_plan = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['diagnosis', 'steps', 'is_diy']
                missing_fields = [field for field in required_fields if field not in repair_plan]
                
                if missing_fields:
                    print(f"Missing fields: {missing_fields}. Plan: {repair_plan}")
                    raise ValueError(f"Missing required fields: {missing_fields}")
                
                print("✅ Successfully generated repair plan with Phi-4")
                return repair_plan
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"❌ Failed to parse Phi-4 JSON response: {e}")
                print(f"Full raw response: {response_text}")
                raise Exception(f"Phi-4 returned invalid JSON: {e}")
                
        except Exception as e:
            print(f"❌ Phi-4 generation failed: {e}")
            raise Exception(f"Failed to generate repair plan with Phi-4: {e}")
    
    def _fallback_repair_plan(self, description: str) -> dict:
        """Fallback repair plan when model is not available"""
        # Determine if it's likely electrical, plumbing, or general
        description_lower = description.lower()
        is_electrical = any(word in description_lower for word in ['electrical', 'wire', 'outlet', 'switch', 'light', 'power'])
        is_plumbing = any(word in description_lower for word in ['water', 'pipe', 'leak', 'faucet', 'drain', 'toilet'])
        
        if is_electrical:
            return {
                "diagnosis": f"Electrical issue identified from description: {description}",
                "steps": [
                    {
                        "step": 1,
                        "instruction": "Turn off power at the circuit breaker",
                        "tools_needed": ["circuit breaker access"],
                        "estimated_time": "2 minutes"
                    },
                    {
                        "step": 2,
                        "instruction": "Contact a licensed electrician for safety",
                        "tools_needed": ["phone"],
                        "estimated_time": "5 minutes"
                    }
                ],
                "is_diy": False,
                "estimated_time": "Professional consultation required",
                "estimated_cost": "$100-400",
                "safety_warnings": ["Never work on live electrical circuits", "Always turn off power at breaker", "Use proper electrical tools"],
                "recommended_provider": "electrical"
            }
        elif is_plumbing:
            return {
                "diagnosis": f"Plumbing issue identified from description: {description}",
                "steps": [
                    {
                        "step": 1,
                        "instruction": "Turn off water supply to the affected area",
                        "tools_needed": ["water shut-off valve access"],
                        "estimated_time": "2 minutes"
                    },
                    {
                        "step": 2,
                        "instruction": "Assess the extent of the problem",
                        "tools_needed": ["flashlight", "basic tools"],
                        "estimated_time": "10 minutes"
                    },
                    {
                        "step": 3,
                        "instruction": "For complex issues, contact a plumber",
                        "tools_needed": ["phone"],
                        "estimated_time": "5 minutes"
                    }
                ],
                "is_diy": False,
                "estimated_time": "30-60 minutes assessment",
                "estimated_cost": "$50-300",
                "safety_warnings": ["Turn off water to prevent flooding", "Be careful with old pipes"],
                "recommended_provider": "plumbing"
            }
        else:
            return {
                "diagnosis": f"General issue identified from description: {description}",
                "steps": [
                    {
                        "step": 1,
                        "instruction": "Assess the damage and gather necessary tools",
                        "tools_needed": ["basic toolkit", "safety equipment"],
                        "estimated_time": "10 minutes"
                    },
                    {
                        "step": 2,
                        "instruction": "Clean the area and remove any debris",
                        "tools_needed": ["cleaning supplies", "gloves"],
                        "estimated_time": "15 minutes"
                    },
                    {
                        "step": 3,
                        "instruction": "Follow manufacturer guidelines or consult professional if complex",
                        "tools_needed": ["manual", "appropriate tools"],
                        "estimated_time": "30 minutes"
                    }
                ],
                "is_diy": True,
                "estimated_time": "45 minutes to 1 hour",
                "estimated_cost": "$20-100",
                "safety_warnings": ["Wear protective equipment", "Ensure area is safe to work"],
                "recommended_provider": "general"
            }
    
    def chat_response(self, message: str, context: str = "") -> str:
        """Generate chat response using Phi-4 Mini"""
        
        if not self.check_model_availability():
            raise Exception("Phi-4 Mini model is not available. Please ensure Ollama is running.")
        
        try:
            prompt = f"""
You are HouseHelp.AI, an expert home repair assistant. Answer the user's question based on the repair context provided.

Repair Context: {context if context else "No specific repair context provided."}

User Question: {message}

Provide a helpful, specific answer about the repair process. Include:
- Specific guidance related to their question
- Safety considerations if relevant  
- Tool recommendations if applicable
- Step-by-step advice when appropriate

Keep your response informative but concise (2-4 sentences).
"""
            
            print(f"Phi-4 chat request: {message}")
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False,
                options={
                    "temperature": 0.7,
                    "num_predict": 200,  # Concise responses
                    "top_p": 0.9,
                }
            )
            
            response_text = response['response'].strip()
            print(f"Phi-4 chat response: {response_text}")
            return response_text
            
        except Exception as e:
            print(f"❌ Phi-4 chat failed: {e}")
            raise Exception(f"Failed to generate chat response with Phi-4: {e}")

# Global instance
phi4_service = Phi4Service()