const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8082',
    companyServiceUrl: process.env.REACT_APP_COMPANY_API_URL || 'http://localhost:8081',
  }
};

export default config; 