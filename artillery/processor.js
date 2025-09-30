module.exports = {
  beforeRequest: beforeRequest,
  afterResponse: afterResponse,
  randomString: randomString,
  randomNumber: randomNumber
};

function beforeRequest(requestParams, context, ee, next) {
  // Add custom headers if needed
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Test-ID'] = context.vars.$uuid;

  // Log request details for debugging
  if (context.vars.$loopCount && context.vars.$loopCount % 100 === 0) {
    console.log(`Request ${context.vars.$loopCount} to ${requestParams.url}`);
  }

  return next();
}

function afterResponse(requestParams, response, context, ee, next) {
  // Capture response time
  if (response.timings) {
    context.vars.responseTime = response.timings.phases.firstByte;
  }

  // Check for rate limiting
  if (response.statusCode === 429) {
    console.warn(`Rate limit hit for ${requestParams.url}`);
    ee.emit('counter', 'rate_limited', 1);
  }

  // Check for errors
  if (response.statusCode >= 500) {
    console.error(`Server error ${response.statusCode} for ${requestParams.url}`);
    ee.emit('counter', 'server_errors', 1);
  }

  return next();
}

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}