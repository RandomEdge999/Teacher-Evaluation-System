interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: store[key].resetTime
    };
  }
  
  if (store[key].count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: store[key].resetTime
    };
  }
  
  store[key].count++;
  return {
    success: true,
    remaining: maxRequests - store[key].count,
    resetTime: store[key].resetTime
  };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded || realIp || 'unknown';
  
  // For authenticated users, use their user ID as part of the identifier
  // This provides better rate limiting per user
  return ip;
}

// Clean up expired entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000);
