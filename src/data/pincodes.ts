export interface PincodeInfo {
  city: string;
  state: string;
  slaDays: string;
  expressAvailable: boolean;
  codAvailable: boolean;
}

export const PINCODE_DATABASE: Record<string, PincodeInfo> = {
  '400050': { city: 'Bandra West, Mumbai', state: 'Maharashtra', slaDays: '1-2 Days (Next Day Dispatch)', expressAvailable: true, codAvailable: true },
  '400001': { city: 'Fort, Mumbai', state: 'Maharashtra', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '110001': { city: 'Connaught Place, New Delhi', state: 'Delhi', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '110016': { city: 'Hauz Khas, New Delhi', state: 'Delhi', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '560001': { city: 'MG Road, Bengaluru', state: 'Karnataka', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '560066': { city: 'Whitefield, Bengaluru', state: 'Karnataka', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '500081': { city: 'Hitec City, Hyderabad', state: 'Telangana', slaDays: '2 Days', expressAvailable: true, codAvailable: true },
  '600001': { city: 'George Town, Chennai', state: 'Tamil Nadu', slaDays: '2-3 Days', expressAvailable: true, codAvailable: true },
  '700001': { city: 'BBD Bagh, Kolkata', state: 'West Bengal', slaDays: '2-3 Days', expressAvailable: true, codAvailable: true },
  '411001': { city: 'Pune Station, Pune', state: 'Maharashtra', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '122001': { city: 'Gurugram Sector 14', state: 'Haryana', slaDays: '1-2 Days', expressAvailable: true, codAvailable: true },
  '380001': { city: 'Ahmedabad Central', state: 'Gujarat', slaDays: '2 Days', expressAvailable: true, codAvailable: true },
  '302001': { city: 'Jaipur Pink City', state: 'Rajasthan', slaDays: '2-3 Days', expressAvailable: true, codAvailable: true },
  '403001': { city: 'Panaji', state: 'Goa', slaDays: '2-3 Days', expressAvailable: true, codAvailable: true },
  '248001': { city: 'Dehradun', state: 'Uttarakhand', slaDays: '2-3 Days', expressAvailable: true, codAvailable: true },
  '249403': { city: 'Haridwar Manufacturing Lab', state: 'Uttarakhand', slaDays: 'Same-Day Dispatch', expressAvailable: true, codAvailable: true },
};

export function lookupPincode(pincode: string): PincodeInfo {
  const clean = pincode.trim();
  if (PINCODE_DATABASE[clean]) {
    return PINCODE_DATABASE[clean];
  }
  
  // Dynamic fallback for any valid 6-digit Indian pincode
  if (/^[1-9][0-9]{5}$/.test(clean)) {
    const firstDigit = clean[0];
    let state = 'India';
    if (firstDigit === '1') state = 'Delhi / Haryana / Punjab / HP / J&K';
    else if (firstDigit === '2') state = 'UP / Uttarakhand';
    else if (firstDigit === '3') state = 'Rajasthan / Gujarat';
    else if (firstDigit === '4') state = 'Maharashtra / Goa / MP / Chhattisgarh';
    else if (firstDigit === '5') state = 'Andhra Pradesh / Telangana / Karnataka';
    else if (firstDigit === '6') state = 'Tamil Nadu / Kerala';
    else if (firstDigit === '7') state = 'West Bengal / Odisha / North East';
    else if (firstDigit === '8') state = 'Bihar / Jharkhand';

    return {
      city: `Pincode ${clean}`,
      state,
      slaDays: '2-3 Business Days (Express Air)',
      expressAvailable: true,
      codAvailable: true
    };
  }

  return {
    city: 'Location Not Found',
    state: '',
    slaDays: '3-5 Business Days',
    expressAvailable: false,
    codAvailable: true
  };
}
