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
        """Generate repair plan using fallback system"""
        print(f"Generating repair plan for: {description}")
        
        # For now, use fallback to ensure stability
        # TODO: Re-enable Ollama when hanging issue is resolved
        return self._fallback_repair_plan(description)
    
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
        """Generate chat response with fallback handling"""
        
        # First try quick fallback responses for common questions
        message_lower = message.lower()
        if "skip" in message_lower and "step" in message_lower:
            return "For safety reasons, I recommend following all repair steps in order. However, if you're experienced, you might be able to combine some steps. Always prioritize safety and don't skip critical safety checks."
        elif "tools" in message_lower:
            return "Make sure you have all the required tools before starting. If you're missing tools, you can often substitute with similar items or borrow/buy them. Check the tool list in your repair plan."
        elif "safe" in message_lower:
            return "Safety is paramount in any repair. Always turn off power/water, wear protective equipment, and don't attempt repairs beyond your skill level. If in doubt, consult a professional."
        elif "cost" in message_lower:
            return "Repair costs vary by location and complexity. DIY repairs typically save 50-70% compared to professional services, but factor in tool costs and your time."
        elif "wrong" in message_lower:
            return "If something goes wrong during the repair, stop immediately, ensure safety (turn off power/water), and assess the situation. Don't force anything. Consider consulting a professional if the issue is beyond your expertise."
        
        # Try Ollama only for complex questions, with timeout
        if not self.check_model_availability():
            return "I'm currently unable to access the AI model, but I can still help! Please ask specific questions about tools, safety, costs, or common repair steps."
        
        try:
            prompt = f"""
            You are a helpful home repair assistant. Answer briefly and clearly.
            
            Context: {context}
            User question: {message}
            
            Provide a helpful, concise answer (2-3 sentences max). Prioritize safety.
            """
            
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False,
                options={
                    "temperature": 0.7,
                    "num_predict": 100,  # Very short response
                    "timeout": 8,  # Short timeout
                }
            )
            
            return response['response'].strip()
            
        except Exception as e:
            print(f"Error generating chat response: {e}")
            # Return a helpful fallback based on context
            if context and "repair" in context.lower():
                return "Based on your repair plan, I recommend following the steps carefully and prioritizing safety. Feel free to ask specific questions about tools, materials, or safety concerns."
            else:
                return "I'm here to help with your repair questions! Ask me about specific steps, tools needed, safety concerns, or costs."

# Global instance
phi4_service = Phi4Service()