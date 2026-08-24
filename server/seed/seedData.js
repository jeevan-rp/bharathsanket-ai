require('dotenv').config();
const mongoose = require('mongoose');
const GovDataset = require('../models/GovDataset');

/**
 * Seed Script: Populate GovDataset collection with realistic mock data
 * representing infrastructure indices across Indian districts.
 * 
 * Run: node server/seed/seedData.js
 * 
 * In production, this data would come from government APIs like
 * data.gov.in or the RBI's district-level infrastructure database.
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bharatsanket';

const mockData = [
  // Uttar Pradesh
  { district: 'Varanasi', state: 'Uttar Pradesh', currentInfraIndex: 5, population: 3676841, budgetAllocation: 420 },
  { district: 'Lucknow', state: 'Uttar Pradesh', currentInfraIndex: 7, population: 4589838, budgetAllocation: 680 },
  { district: 'Agra', state: 'Uttar Pradesh', currentInfraIndex: 6, population: 1756106, budgetAllocation: 390 },
  { district: 'Prayagraj', state: 'Uttar Pradesh', currentInfraIndex: 4, population: 1112547, budgetAllocation: 310 },
  { district: 'Meerut', state: 'Uttar Pradesh', currentInfraIndex: 5, population: 1305489, budgetAllocation: 280 },

  // Bihar
  { district: 'Patna', state: 'Bihar', currentInfraIndex: 5, population: 5838465, budgetAllocation: 520 },
  { district: 'Gaya', state: 'Bihar', currentInfraIndex: 3, population: 474093, budgetAllocation: 140 },
  { district: 'Muzaffarpur', state: 'Bihar', currentInfraIndex: 3, population: 435917, budgetAllocation: 120 },
  { district: 'Bhagalpur', state: 'Bihar', currentInfraIndex: 3, population: 410210, budgetAllocation: 110 },

  // Maharashtra
  { district: 'Mumbai', state: 'Maharashtra', currentInfraIndex: 8, population: 12442373, budgetAllocation: 1200 },
  { district: 'Pune', state: 'Maharashtra', currentInfraIndex: 7, population: 3124458, budgetAllocation: 580 },
  { district: 'Nagpur', state: 'Maharashtra', currentInfraIndex: 6, population: 2405665, budgetAllocation: 420 },
  { district: 'Nashik', state: 'Maharashtra', currentInfraIndex: 5, population: 1486053, budgetAllocation: 310 },

  // Tamil Nadu
  { district: 'Chennai', state: 'Tamil Nadu', currentInfraIndex: 8, population: 7088000, budgetAllocation: 950 },
  { district: 'Coimbatore', state: 'Tamil Nadu', currentInfraIndex: 7, population: 1671521, budgetAllocation: 380 },
  { district: 'Madurai', state: 'Tamil Nadu', currentInfraIndex: 6, population: 1475714, budgetAllocation: 320 },
  { district: 'Salem', state: 'Tamil Nadu', currentInfraIndex: 5, population: 831845, budgetAllocation: 210 },

  // Karnataka
  { district: 'Bengaluru Urban', state: 'Karnataka', currentInfraIndex: 8, population: 9621551, budgetAllocation: 1100 },
  { district: 'Mysuru', state: 'Karnataka', currentInfraIndex: 6, population: 1100383, budgetAllocation: 290 },
  { district: 'Hubli-Dharwad', state: 'Karnataka', currentInfraIndex: 5, population: 943857, budgetAllocation: 240 },

  // Rajasthan
  { district: 'Jaipur', state: 'Rajasthan', currentInfraIndex: 6, population: 3073350, budgetAllocation: 480 },
  { district: 'Jodhpur', state: 'Rajasthan', currentInfraIndex: 5, population: 1133632, budgetAllocation: 310 },
  { district: 'Udaipur', state: 'Rajasthan', currentInfraIndex: 4, population: 608540, budgetAllocation: 180 },
  { district: 'Kota', state: 'Rajasthan', currentInfraIndex: 5, population: 1001694, budgetAllocation: 260 },

  // Madhya Pradesh
  { district: 'Bhopal', state: 'Madhya Pradesh', currentInfraIndex: 6, population: 1795648, budgetAllocation: 370 },
  { district: 'Indore', state: 'Madhya Pradesh', currentInfraIndex: 6, population: 2194567, budgetAllocation: 410 },
  { district: 'Jabalpur', state: 'Madhya Pradesh', currentInfraIndex: 4, population: 1267656, budgetAllocation: 220 },

  // West Bengal
  { district: 'Kolkata', state: 'West Bengal', currentInfraIndex: 7, population: 14850076, budgetAllocation: 890 },
  { district: 'Howrah', state: 'West Bengal', currentInfraIndex: 5, population: 4841638, budgetAllocation: 340 },
  { district: 'Durgapur', state: 'West Bengal', currentInfraIndex: 5, population: 581409, budgetAllocation: 190 },

  // Gujarat
  { district: 'Ahmedabad', state: 'Gujarat', currentInfraIndex: 7, population: 5577940, budgetAllocation: 620 },
  { district: 'Surat', state: 'Gujarat', currentInfraIndex: 7, population: 4467797, budgetAllocation: 510 },
  { district: 'Vadodara', state: 'Gujarat', currentInfraIndex: 6, population: 2065771, budgetAllocation: 350 },
  { district: 'Rajkot', state: 'Gujarat', currentInfraIndex: 6, population: 1389292, budgetAllocation: 300 },

  // Telangana
  { district: 'Hyderabad', state: 'Telangana', currentInfraIndex: 8, population: 6809970, budgetAllocation: 880 },
  { district: 'Warangal', state: 'Telangana', currentInfraIndex: 5, population: 823425, budgetAllocation: 230 },

  // Kerala
  { district: 'Thiruvananthapuram', state: 'Kerala', currentInfraIndex: 7, population: 957730, budgetAllocation: 280 },
  { district: 'Kochi', state: 'Kerala', currentInfraIndex: 7, population: 677381, budgetAllocation: 320 },
  { district: 'Kozhikode', state: 'Kerala', currentInfraIndex: 6, population: 432097, budgetAllocation: 240 },

  // Delhi
  { district: 'New Delhi', state: 'Delhi', currentInfraIndex: 8, population: 142004, budgetAllocation: 950 },
  { district: 'North Delhi', state: 'Delhi', currentInfraIndex: 7, population: 883818, budgetAllocation: 780 },
  { district: 'South Delhi', state: 'Delhi', currentInfraIndex: 8, population: 2731929, budgetAllocation: 850 },

  // Punjab
  { district: 'Ludhiana', state: 'Punjab', currentInfraIndex: 6, population: 1618879, budgetAllocation: 320 },
  { district: 'Amritsar', state: 'Punjab', currentInfraIndex: 6, population: 1137536, budgetAllocation: 300 },

  // Odisha
  { district: 'Bhubaneswar', state: 'Odisha', currentInfraIndex: 6, population: 837737, budgetAllocation: 290 },
  { district: 'Cuttack', state: 'Odisha', currentInfraIndex: 5, population: 606007, budgetAllocation: 210 },

  // Assam
  { district: 'Guwahati', state: 'Assam', currentInfraIndex: 5, population: 957352, budgetAllocation: 260 },

  // Andhra Pradesh
  { district: 'Visakhapatnam', state: 'Andhra Pradesh', currentInfraIndex: 6, population: 2035922, budgetAllocation: 380 },
  { district: 'Vijayawada', state: 'Andhra Pradesh', currentInfraIndex: 5, population: 1034000, budgetAllocation: 290 },
];

async function seedDatabase() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Clear existing data
    await GovDataset.deleteMany({});
    console.log('🗑️  Cleared existing GovDataset records');

    // Insert mock data
    const result = await GovDataset.insertMany(mockData);
    console.log(`✅ Inserted ${result.length} district records\n`);

    console.log('Sample data:');
    result.slice(0, 5).forEach(d => {
      console.log(`  ${d.district}, ${d.state} — Infra: ${d.currentInfraIndex}/10, Pop: ${(d.population/100000).toFixed(1)}L, Budget: ₹${d.budgetAllocation}Cr`);
    });
    console.log(`  ... and ${result.length - 5} more districts`);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

seedDatabase();
