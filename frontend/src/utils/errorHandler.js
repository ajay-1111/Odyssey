// /app/frontend/src/utils/errorHandler.js

/**
 * Extract a human-readable error message from API responses
 * Handles FastAPI validation errors which return arrays of error objects
 */
export const getErrorMessage = (error, fallbackMessage = 'Something went wrong') => {
  // If it's an axios error with response
  if (error?.response?.data) {
    const data = error.response.data;
    
    // FastAPI detail can be a string or array of validation errors
    if (data.detail) {
      // If detail is a string, return it directly
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      // If detail is an array (validation errors), extract messages
      if (Array.isArray(data.detail)) {
        const messages = data.detail
          .map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            return null;
          })
          .filter(Boolean);
        
        return messages.length > 0 ? messages.join('. ') : fallbackMessage;
      }
      
      // If detail is an object, try to extract message
      if (typeof data.detail === 'object') {
        return data.detail.msg || data.detail.message || fallbackMessage;
      }
    }
    
    // Check for other common error formats
    if (data.message) return data.message;
    if (data.error) return typeof data.error === 'string' ? data.error : fallbackMessage;
  }
  
  // If error is a string
  if (typeof error === 'string') return error;
  
  // If error has a message property
  if (error?.message) return error.message;
  
  return fallbackMessage;
};

export default getErrorMessage;
