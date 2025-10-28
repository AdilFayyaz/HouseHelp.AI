import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Rating,
  Alert,
} from '@mui/material';
import {
  Phone,
  Email,
  Person,
} from '@mui/icons-material';
import { providersAPI, issuesAPI } from '../services/api';

const MaintenanceProviders = ({ issueId, repairPlan, onProviderCalled }) => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProviders();
  }, [repairPlan]);

  const loadProviders = async () => {
    try {
      // Determine specialty based on repair plan
      let specialty = null;
      if (repairPlan?.recommended_provider) {
        specialty = repairPlan.recommended_provider;
      }

      const providersData = await providersAPI.getProviders(specialty);
      setProviders(providersData);
    } catch (error) {
      console.error('Error loading providers:', error);
      setError('Failed to load maintenance providers');
    }
  };

  const handleCallMaintenance = async () => {
    if (!selectedProvider || !issueId) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await issuesAPI.callMaintenance(issueId, selectedProvider.id);
      setSuccess(`Maintenance request sent to ${selectedProvider.name}`);
      setIsDialogOpen(false);
      
      if (onProviderCalled) {
        onProviderCalled(result);
      }
    } catch (error) {
      setError('Failed to send maintenance request');
      console.error('Error calling maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openProviderDialog = (provider) => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  if (!repairPlan || repairPlan.is_diy) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Recommended Maintenance Providers
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This repair requires professional assistance. Here are qualified providers in your area:
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {providers.map((provider) => (
              <Grid item xs={12} md={6} key={provider.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => openProviderDialog(provider)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{provider.name}</Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={provider.specialty}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating
                          value={provider.rating}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({provider.rating}/5)
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{provider.email}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{provider.phone}</Typography>
                    </Box>

                    <Chip
                      label={provider.availability}
                      size="small"
                      color={provider.availability === 'available' ? 'success' : 'warning'}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {providers.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No providers found. Please contact us for assistance.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Provider Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Contact {selectedProvider?.name}
        </DialogTitle>
        
        <DialogContent>
          {selectedProvider && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Specialty:</strong> {selectedProvider.specialty}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Rating:</strong> {selectedProvider.rating}/5 stars
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedProvider.email}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Phone:</strong> {selectedProvider.phone}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Availability:</strong> {selectedProvider.availability}
              </Typography>

              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  What will be sent to the provider:
                </Typography>
                <Typography variant="body2">
                  • Your issue description and photo
                </Typography>
                <Typography variant="body2">
                  • AI-generated diagnosis and repair plan
                </Typography>
                <Typography variant="body2">
                  • Your contact information (when available)
                </Typography>
                <Typography variant="body2">
                  • Estimated scope of work
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCallMaintenance}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Contact Provider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceProviders;