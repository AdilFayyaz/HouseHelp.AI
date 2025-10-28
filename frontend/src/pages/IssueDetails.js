import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  CheckCircle,
  Settings,
  Delete,
} from '@mui/icons-material';

import { issuesAPI } from '../services/api';
import FlowchartDisplay from '../components/FlowchartDisplay';
import MaintenanceProviders from '../components/MaintenanceProviders';
import ChatInterface from '../components/ChatInterface';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [issue, setIssue] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIssue();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadIssue = async () => {
    try {
      setIsLoading(true);
      const issueData = await issuesAPI.getIssue(id);
      setIssue(issueData);
      
      // Only parse repair plan if it exists but don't set analysis
      // Analysis should only be set from a fresh analyze call
      // This prevents overwriting flowchart data
    } catch (error) {
      setError('Failed to load issue details');
      console.error('Error loading issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeIssue = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      const result = await issuesAPI.analyzeIssue(id);
      console.log('Analysis result:', result);
      setAnalysis(result);
      
      // Update just the issue status without overwriting analysis data
      setIssue(prevIssue => ({
        ...prevIssue,
        status: 'analyzed',
        diagnosis: result.repair_plan?.diagnosis || prevIssue.diagnosis
      }));
    } catch (error) {
      setError('Failed to analyze issue. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      try {
        await issuesAPI.deleteIssue(id);
        navigate('/'); // Redirect to dashboard after deletion
      } catch (error) {
        setError('Failed to delete issue');
        console.error('Delete error:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'default';
      case 'analyzed': return 'primary';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'maintenance_called': return 'info';
      default: return 'default';
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'new': return 0;
      case 'analyzed': return 1;
      case 'in-progress': return 2;
      case 'completed': return 3;
      case 'maintenance_called': return 2;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!issue) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Issue not found</Alert>
      </Container>
    );
  }

  const steps = ['Issue Reported', 'AI Analysis', 'In Progress', 'Completed'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Issues
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Issue #{issue.id}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={issue.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(issue.status)}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(issue.created_at).toLocaleString()}
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Stepper activeStep={getStepIndex(issue.status)} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Issue Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Issue Details
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> {issue.description}
              </Typography>
              
              {issue.diagnosis && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Diagnosis:</strong> {issue.diagnosis}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(issue.updated_at).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uploaded Image
              </Typography>
              
              {issue.image_path && (
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <img
                    src={`http://localhost:8000/${issue.image_path}`}
                    alt="Issue"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                    }}
                  />
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Section */}
      <Box sx={{ mt: 3 }}>
        {!analysis && issue.status === 'new' && (
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                AI Analysis
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Get AI-powered diagnosis and repair recommendations for this issue.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={analyzeIssue}
                disabled={isAnalyzing}
                startIcon={isAnalyzing ? <CircularProgress size={20} /> : <Settings />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Show analyze button for already analyzed issues too */}
        {!analysis && (issue.status === 'analyzed' || issue.status === 'in-progress' || issue.status === 'completed') && (
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                AI Analysis
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {issue.status === 'analyzed' 
                  ? 'This issue has been analyzed. Click to view the analysis results or re-analyze.'
                  : 'View or regenerate the AI analysis for this issue.'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={analyzeIssue}
                disabled={isAnalyzing}
                startIcon={isAnalyzing ? <CircularProgress size={20} /> : <Refresh />}
              >
                {isAnalyzing ? 'Loading Analysis...' : 'View Analysis'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isAnalyzing && (
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI Analysis in Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our AI (Phi-4) is analyzing your issue and generating a detailed repair plan...
                This may take 30-60 seconds for complex repairs.
              </Typography>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <>
            {/* Safely render FlowchartDisplay with error boundary */}
            {analysis.repair_plan && (
              <Box sx={{ mt: 3 }}>
                <FlowchartDisplay
                  repairPlan={analysis.repair_plan}
                  mermaidChart={analysis.mermaid_flowchart}
                  textChart={analysis.text_flowchart}
                />
              </Box>
            )}
            
            <MaintenanceProviders
              issueId={issue.id}
              repairPlan={analysis.repair_plan}
              onProviderCalled={() => loadIssue()}
            />
          </>
        )}
      </Box>

      {/* Chat Interface */}
      {analysis && (
        <ChatInterface
          issueId={issue.id}
          issueContext={`Issue: ${issue.description}\nDiagnosis: ${issue.diagnosis}`}
        />
      )}

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        {analysis && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={analyzeIssue}
            disabled={isAnalyzing}
          >
            Re-analyze
          </Button>
        )}
        
        {issue.status !== 'completed' && (
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={async () => {
              try {
                await issuesAPI.updateIssue(issue.id, { status: 'completed' });
                await loadIssue();
              } catch (error) {
                setError('Failed to mark as completed');
              }
            }}
          >
            Mark as Completed
          </Button>
        )}
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDeleteIssue}
        >
          Delete Issue
        </Button>
      </Box>
    </Container>
  );
};

export default IssueDetails;