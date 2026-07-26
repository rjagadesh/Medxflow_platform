import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

// --- 1. DEFINE YOUR DUMMY DATA HERE ---
// This is a comprehensive set of mock data that your component can use.
const mockBillingResults = [
  { id: 1, created_date: "2025-07-28", type: "API Calls", usage: "1500 calls", cost: 450.75 },
  { id: 2, created_date: "2025-07-29", type: "Transcribe", usage: "550 transcripts", cost: 550.20 },
  { id: 3, created_date: "2025-07-30", type: "Transcribe", usage: "450 transcripts", cost: 700.00 },
  { id: 4, created_date: "2025-07-31", type: "Claims Processing", usage: "300 claims", cost: 600.50 },
  { id: 5, created_date: "2025-08-01", type: "API Calls", usage: "500 calls", cost: 150.00 },
  { id: 6, created_date: "2025-08-02", type: "Insurance Verification", usage: "100 verifications", cost: 550.90 },
  { id: 7, created_date: "2025-08-03", type: "Transcribe", usage: "200 transcripts", cost: 300.00 },
  { id: 8, created_date: "2025-08-04", type: "Claims Processing", usage: "250 claims", cost: 600.10 },
  { id: 9, created_date: "2025-08-05", type: "API Calls", usage: "1200 calls", cost: 500.00 },
  { id: 10, created_date: "2025-08-06", type: "Transcribe", usage: "320 transcripts", cost: 520.00 },
  { id: 11, created_date: "2025-08-07", type: "API Calls", usage: "1350 calls", cost: 580.25 },
  { id: 12, created_date: "2025-08-08", type: "Claims Processing", usage: "310 claims", cost: 610.00 },
  { id: 12, created_date: "2025-08-08", type: "Claims Processing", usage: "310 claims", cost: 600.00 },
];

export const useGetBillingData = (params) => { 
  // --- 2. A FLAG TO CONTROL THE MOCKING BEHAVIOR ---
  // Change this to 'false' to switch back to the real API call.
  const useMockData =  false;

  return useQuery({
    queryKey: ["billingData", params], // It's good practice to have a descriptive key
    
    // --- 3. THE MODIFIED queryFn ---
    queryFn: () => {
      if (useMockData) {
        // If we are in mock mode, return a promise that resolves with the dummy data.
        console.log("HOOK: Returning MOCKED billing data for params:", params);
        
        return new Promise(resolve => {
          // Simulate a network delay of 500 milliseconds
          setTimeout(() => {
            // The structure { results: [...] } matches what your component expects from a real API
            resolve({ results: mockBillingResults });
          }, 500);
        });

      } else {
        console.log("HOOK: Making REAL API request for billing data with params:", params);
        const response = apiRequest(apiRoutes.billing.all, { params });
        console.log("HOOK: Received REAL API data:", response.transactions_grouped);
        return response;
      }
    },
    // Optional: Keep the data fresh for a short time.
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};