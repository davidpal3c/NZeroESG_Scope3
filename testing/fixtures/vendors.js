// Test vendor data fixtures for consistent testing
export const testVendors = {
  // Valid vendor data
  validVendor: {
    name: 'EcoWrap Test Ltd',
    region: 'Canada',
    description: 'ISO 14001 certified supplier offering biodegradable packaging for testing.',
    esgRating: 8.9
  },

  // Another valid vendor for multiple vendor tests
  secondVendor: {
    name: 'GreenBox Test Asia',
    region: 'Singapore', 
    description: 'Low-carbon transport options and compostable packaging for testing.',
    esgRating: 8.2
  },

  // High ESG rating vendor for filtering tests
  highEsgVendor: {
    name: 'SustainaEurope Test',
    region: 'Germany',
    description: 'Renewable energy certified manufacturing and logistics for testing.',
    esgRating: 9.1
  },

  // Low ESG rating vendor for filtering tests
  lowEsgVendor: {
    name: 'Basic Supplier Test',
    region: 'USA',
    description: 'Standard supplier for testing purposes.',
    esgRating: 6.5
  },

  // Invalid vendor data for negative testing
  invalidVendors: {
    missingName: {
      region: 'Canada',
      description: 'Missing name vendor',
      esgRating: 8.0
    },
    missingRegion: {
      name: 'No Region Vendor',
      description: 'Missing region vendor',
      esgRating: 8.0
    },
    invalidEsgRating: {
      name: 'Invalid Rating Vendor',
      region: 'USA',
      description: 'Invalid ESG rating',
      esgRating: 15.0 // ESG ratings should be 0-10
    },
    negativeEsgRating: {
      name: 'Negative Rating Vendor',
      region: 'USA',
      description: 'Negative ESG rating',
      esgRating: -2.0
    }
  }
};

// Mock vendor database entries (with IDs)
export const mockVendorDatabase = [
  {
    id: '1',
    name: 'EcoWrap Ltd',
    region: 'Canada',
    description: 'ISO 14001 certified supplier offering biodegradable packaging.',
    esgRating: 8.9,
    createdAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: '2',
    name: 'GreenBox Asia',
    region: 'Singapore',
    description: 'Low-carbon transport options and compostable packaging.',
    esgRating: 8.2,
    createdAt: new Date('2024-02-20T00:00:00Z')
  },
  {
    id: '3',
    name: 'SustainaEurope',
    region: 'Germany',
    description: 'Renewable energy certified manufacturing and logistics.',
    esgRating: 9.1,
    createdAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: '4',
    name: 'CleanTech USA',
    region: 'USA',
    description: 'Carbon-neutral shipping and recycled materials specialist.',
    esgRating: 8.7,
    createdAt: new Date('2024-03-05T00:00:00Z')
  }
];

// Vendor response fixtures
export const vendorResponses = {
  // Successful vendor creation
  successfulCreation: {
    vendor: {
      id: '5',
      name: 'New Test Vendor',
      region: 'Australia',
      description: 'Newly created test vendor',
      esgRating: 8.5,
      createdAt: new Date().toISOString()
    },
    success: true,
    message: 'Vendor created successfully'
  },

  // Successful vendor update
  successfulUpdate: {
    vendor: {
      id: '1',
      name: 'Updated Vendor Name',
      region: 'Canada',
      description: 'Updated description',
      esgRating: 9.0,
      createdAt: new Date('2024-01-15T00:00:00Z').toISOString()
    },
    success: true,
    message: 'Vendor updated successfully'
  },

  // Successful vendor deletion
  successfulDeletion: {
    success: true,
    message: 'Vendor 1 deleted successfully'
  },

  // Error responses
  errors: {
    notFound: {
      vendor: null,
      success: false,
      message: 'Vendor not found'
    },
    validationError: {
      vendor: null,
      success: false,
      message: 'Validation failed'
    },
    unauthorized: {
      vendor: null,
      success: false,
      message: 'Authentication required'
    }
  }
};

// Vendor filter fixtures for testing queries
export const vendorFilters = {
  byRegion: {
    canada: { region: 'Canada' },
    singapore: { region: 'Singapore' },
    usa: { region: 'USA' },
    germany: { region: 'Germany' }
  },
  byEsgRating: {
    high: { minEsgRating: 9.0 },
    medium: { minEsgRating: 8.0 },
    low: { minEsgRating: 6.0 }
  },
  combined: {
    canadaHighEsg: { region: 'Canada', minEsgRating: 8.5 },
    usaMediumEsg: { region: 'USA', minEsgRating: 8.0 }
  }
};