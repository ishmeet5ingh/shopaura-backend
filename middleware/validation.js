import validator from 'validator';

// Validate email
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email && !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  next();
};

// Validate phone number
export const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  
  if (phone && !validator.isMobilePhone(phone, 'en-IN')) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid Indian phone number'
    });
  }
  
  next();
};

// Validate pincode
export const validatePincode = (req, res, next) => {
  const { pincode } = req.body;
  
  if (pincode && !/^[0-9]{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 6-digit pincode'
    });
  }
  
  next();
};

// Validate address fields
export const validateAddress = (req, res, next) => {
  const { fullName, phone, pincode, addressLine1, city, state } = req.body;
  
  const errors = [];
  
  if (!fullName || fullName.trim().length < 3) {
    errors.push('Full name must be at least 3 characters');
  }
  
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    errors.push('Please provide a valid 10-digit phone number');
  }
  
  if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
    errors.push('Please provide a valid 6-digit pincode');
  }
  
  if (!addressLine1 || addressLine1.trim().length < 10) {
    errors.push('Address must be at least 10 characters');
  }
  
  if (!city || city.trim().length < 2) {
    errors.push('Please provide a valid city name');
  }
  
  if (!state || state.trim().length < 2) {
    errors.push('Please provide a valid state name');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// Sanitize input
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key].trim());
      }
    });
  }
  next();
};
