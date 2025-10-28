import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Box,
  Alert,
  Paper,
} from '@mui/material';
import {
  Add,
  Visibility,
  TrendingUp,
  Assessment,
  Home,
  Build,
  Delete,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import ImageUpload from '../components/ImageUpload';
import { issuesAPI, dashboardAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [issuesData, statsData] = await Promise.all([
        issuesAPI.getIssues(),
        dashboardAPI.getStats(),
      ]);
      
      setIssues(issuesData);
      setStats(statsData);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadData(); // Refresh data
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      try {
        await issuesAPI.deleteIssue(issueId);
        loadData(); // Refresh the issues list
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

  // Chart data
  const pieData = stats ? [
    { name: 'DIY Repairs', value: stats.diy_issues, color: '#4CAF50' },
    { name: 'Professional', value: stats.professional_issues, color: '#FF9800' },
  ] : [];

  const barData = stats ? [
    { name: 'Total', value: stats.total_issues },
    { name: 'Completed', value: stats.completed_issues },
    { name: 'DIY', value: stats.diy_issues },
    { name: 'Professional', value: stats.professional_issues },
  ] : [];

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            <Home sx={{ mr: 2, verticalAlign: 'middle' }} />
            HouseHelp.AI
          </Typography>
          <Typography variant="h6" color="text.secondary">
            AI-Powered Home Repair Assistant
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => setShowUpload(!showUpload)}
        >
          Report New Issue
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Upload Component */}
      {showUpload && (
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Issues
                </Typography>
                <Typography variant="h4">
                  {stats.total_issues}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed_issues}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h4" color="primary">
                  ${stats.total_cost.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.completion_rate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Repair Type Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Issues Overview
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Issues */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Issues
          </Typography>
          
          {issues.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No issues reported yet. Click "Report New Issue" to get started!
              </Typography>
            </Paper>
          ) : (
            <List>
              {issues.slice(0, 10).map((issue) => (
                <ListItem key={issue.id} divider>
                  <ListItemText
                    primary={`Issue #${issue.id}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {issue.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={issue.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={getStatusColor(issue.status)}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/issue/${issue.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteIssue(issue.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;