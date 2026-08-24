const mongoose = require('mongoose');

/**
 * GovDataset Model
 * Mock national infrastructure data per district.
 * In production, this would be sourced from government open data APIs
 * (e.g., data.gov.in). For the MVP, we seed it with realistic sample data.
 * 
 * This data is combined with CitizenRequests by the AI recommendation
 * engine to identify gaps between current infrastructure and citizen demand.
 */
const govDatasetSchema = new mongoose.Schema({
  district: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true
  },
  currentInfraIndex: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
    comment: '1=very poor infrastructure, 10=excellent infrastructure'
  },
  population: {
    type: Number,
    required: true
  },
  budgetAllocation: {
    type: Number,
    required: true,
    comment: 'Budget in Indian Crores (₹)'
  }
});

// Compound index for state + district lookups
govDatasetSchema.index({ state: 1, district: 1 }, { unique: true });

module.exports = mongoose.model('GovDataset', govDatasetSchema);
