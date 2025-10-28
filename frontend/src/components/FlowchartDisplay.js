import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Warning,
  Schedule,
  AttachMoney,
  Build,
} from '@mui/icons-material';

const FlowchartDisplay = ({ repairPlan, mermaidChart, textChart }) => {
  const mermaidRef = useRef(null);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });

    // Render Mermaid chart
    if (mermaidChart && mermaidRef.current) {
      mermaidRef.current.innerHTML = '';
      mermaid.render('mermaid-flowchart', mermaidChart, (svgCode) => {
        mermaidRef.current.innerHTML = svgCode;
      });
    }
  }, [mermaidChart]);

  if (!repairPlan) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      {/* Repair Plan Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            AI Analysis & Repair Plan
          </Typography>
          
          {/* Diagnosis */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Diagnosis
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {repairPlan.diagnosis}
            </Typography>
          </Box>

          {/* Key Information */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Chip
              icon={<Build />}
              label={repairPlan.is_diy ? 'DIY Repair' : 'Professional Required'}
              color={repairPlan.is_diy ? 'success' : 'warning'}
              variant="outlined"
            />
            
            {repairPlan.estimated_time && (
              <Chip
                icon={<Schedule />}
                label={`Time: ${repairPlan.estimated_time}`}
                variant="outlined"
              />
            )}
            
            {repairPlan.estimated_cost && (
              <Chip
                icon={<AttachMoney />}
                label={`Cost: ${repairPlan.estimated_cost}`}
                variant="outlined"
              />
            )}
          </Box>

          {/* Safety Warnings */}
          {repairPlan.safety_warnings && repairPlan.safety_warnings.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Safety Warnings
              </Typography>
              {repairPlan.safety_warnings.map((warning, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  color="error"
                  sx={{ mb: 1, ml: 2 }}
                >
                  • {warning}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Visual Flowchart */}
      {mermaidChart && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Visual Repair Flowchart
            </Typography>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div ref={mermaidRef} style={{ width: '100%' }} />
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step-by-Step Instructions
          </Typography>
          
          {repairPlan.steps && repairPlan.steps.length > 0 ? (
            repairPlan.steps.map((step, index) => (
              <Box key={index}>
                <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Step {step.step || index + 1}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {step.instruction}
                  </Typography>
                  
                  {step.tools_needed && step.tools_needed.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Tools needed:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {step.tools_needed.map((tool, toolIndex) => (
                          <Chip
                            key={toolIndex}
                            label={tool}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {step.estimated_time && (
                    <Typography variant="body2" color="text.secondary">
                      Estimated time: {step.estimated_time}
                    </Typography>
                  )}
                </Box>
                
                {index < repairPlan.steps.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No detailed steps available.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Text Flowchart (Backup) */}
      {textChart && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Text-Based Flowchart
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.875rem',
                }}
              >
                {textChart}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FlowchartDisplay;