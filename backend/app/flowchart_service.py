def generate_mermaid_flowchart(repair_plan: dict) -> str:
    """Generate Mermaid.js flowchart from repair plan"""
    steps = repair_plan.get("steps", [])
    is_diy = repair_plan.get("is_diy", True)
    
    mermaid_code = "flowchart TD\n"
    mermaid_code += "    A[Start: Issue Identified] --> B[Assess Damage]\n"
    
    # Add steps
    for i, step in enumerate(steps):
        current_node = chr(ord('C') + i)  # C, D, E, etc.
        next_node = chr(ord('C') + i + 1)
        
        step_text = step.get("instruction", f"Step {step.get('step', i+1)}")
        # Clean text for Mermaid
        step_text = step_text.replace('"', "'").replace('\n', ' ')[:50]
        
        mermaid_code += f"    B --> {current_node}[\"{step_text}\"]\n"
        
        if i < len(steps) - 1:
            mermaid_code += f"    {current_node} --> {next_node}\n"
        else:
            # Last step
            if is_diy:
                mermaid_code += f"    {current_node} --> END[DIY Complete]\n"
            else:
                mermaid_code += f"    {current_node} --> PROF[Call Professional]\n"
                mermaid_code += "    PROF --> END[Issue Resolved]\n"
    
    # Add decision point for complex repairs
    if not is_diy:
        mermaid_code += "    B --> DECISION{Complex Repair?}\n"
        mermaid_code += "    DECISION -->|Yes| PROF\n"
        mermaid_code += "    DECISION -->|No| C\n"
    
    return mermaid_code

def create_simple_flowchart(steps: list, is_diy: bool = True) -> str:
    """Create a simple text-based flowchart"""
    flowchart = "REPAIR FLOWCHART\n"
    flowchart += "=" * 50 + "\n\n"
    
    flowchart += "1. START: Issue Identified\n"
    flowchart += "   ↓\n"
    flowchart += "2. Assess the damage\n"
    flowchart += "   ↓\n"
    
    for i, step in enumerate(steps, 3):
        instruction = step.get("instruction", f"Step {step.get('step', i-2)}")
        tools = step.get("tools_needed", [])
        time = step.get("estimated_time", "Unknown")
        
        flowchart += f"{i}. {instruction}\n"
        if tools:
            flowchart += f"   Tools: {', '.join(tools)}\n"
        flowchart += f"   Time: {time}\n"
        flowchart += "   ↓\n"
    
    if is_diy:
        flowchart += f"{len(steps) + 3}. END: DIY Repair Complete!\n"
    else:
        flowchart += f"{len(steps) + 3}. DECISION: Call Professional\n"
        flowchart += "   ↓\n"
        flowchart += f"{len(steps) + 4}. END: Professional Repair Complete!\n"
    
    return flowchart