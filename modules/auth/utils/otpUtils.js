// OTP (One-Time Password) utility functions

// Generate a 6-digit OTP
// TODO: Integrate Afro SMS for real OTP delivery. For now, hardcoded to 123456.
function generateOTP() {
    return '123456';
}

// Verify OTP
function verifyOTP(storedOTP, providedOTP) {
    return storedOTP === providedOTP;
}

// Generate phone mask (e.g., 091****567)
function generatePhoneMask(phone) {
    if (!phone || phone.length < 4) {
        return phone;
    }
    
    const visibleStart = phone.slice(0, 3);
    const visibleEnd = phone.slice(-3);
    const maskedMiddle = '*'.repeat(phone.length - 6);
    
    return visibleStart + maskedMiddle + visibleEnd;
}

// Check if OTP is expired
function isOTPExpired(expiresAt) {
    return new Date() > expiresAt;
}

// Format OTP expiry time in seconds
function formatOTPExpiry(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    return Math.max(0, Math.floor(diffMs / 1000));
}

// Generate OTP with enhanced security features
function generateSecureOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    // Ensure first digit is not 0 for better security
    otp += digits[Math.floor(Math.random() * 9) + 1];
    
    // Generate remaining digits
    for (let i = 1; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
}

// Validate OTP format
function validateOTPFormat(otp) {
    // Check if OTP is exactly 6 digits and contains only numbers
    return /^\d{6}$/.test(otp);
}

// Generate alphanumeric OTP (for high-security operations)
function generateAlphanumericOTP(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return otp;
}

module.exports = {
    generateOTP,
    verifyOTP,
    generatePhoneMask,
    isOTPExpired,
    formatOTPExpiry,
    generateSecureOTP,
    validateOTPFormat,
    generateAlphanumericOTP
};
