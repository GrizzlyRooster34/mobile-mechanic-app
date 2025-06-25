# AI Agent Integration Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the AI agent integration.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Error Messages](#error-messages)
4. [Performance Issues](#performance-issues)
5. [Configuration Problems](#configuration-problems)
6. [Network and Connectivity](#network-and-connectivity)
7. [Development Issues](#development-issues)
8. [Production Issues](#production-issues)
9. [Debugging Tools](#debugging-tools)
10. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check

First, verify the AI services are working:

```typescript
// In your browser console or test file
const health = await api.ai.healthCheck.query();
console.log(health);
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "agents": {
    "customerSupport": "available",
    "mechanicAssistant": "available"
  }
}
```

### Environment Variables Check

Verify all required environment variables are set:

```bash
# Check if variables are set
echo "API Key: ${ABACUS_AI_API_KEY:0:10}..." # Shows first 10 chars
echo "Customer Agent: $CUSTOMER_SUPPORT_AGENT_ID"
echo "Mechanic Agent: $MECHANIC_ASSISTANT_AGENT_ID"
echo "Base URL: $ABACUS_AI_BASE_URL"
```

### Network Connectivity Test

Test connection to Abacus.AI:

```bash
curl -I https://api.abacus.ai/health
```

## Common Issues

### 1. AI Service Unavailable

**Symptoms:**
- Error: "AI service unavailable"
- Health check returns "unhealthy"
- Requests timeout

**Causes & Solutions:**

#### Invalid API Key
```bash
# Check API key format
echo $ABACUS_AI_API_KEY | wc -c  # Should be reasonable length
```

**Solution:** Verify API key in Abacus.AI dashboard and update `.env.local`

#### Wrong Agent IDs
```typescript
// Test with known working agent ID
const response = await api.ai.customerSupport.chat.mutate({
  message: "test",
  // Use the confirmed working ID: c816aa206
});
```

**Solution:** Verify agent IDs in Abacus.AI dashboard

#### Network Issues
```bash
# Test connectivity
ping api.abacus.ai
nslookup api.abacus.ai
```

**Solution:** Check firewall, proxy settings, or network configuration

### 2. Rate Limiting Issues

**Symptoms:**
- Error: "Rate limit exceeded"
- HTTP 429 responses
- Intermittent failures

**Solutions:**

#### Increase Rate Limits
```env
# In .env.local
AI_AGENT_RATE_LIMIT=200  # Increase from default 100
AI_AGENT_TIMEOUT=45000   # Increase timeout
```

#### Implement Exponential Backoff
```typescript
// Already implemented in AbacusAIClient
// Check if retry logic is working
const client = getAbacusAIClient();
// Monitor console for retry attempts
```

#### Contact Abacus.AI
Request higher rate limits for your account

### 3. Slow Response Times

**Symptoms:**
- Requests take > 10 seconds
- Timeout errors
- Poor user experience

**Solutions:**

#### Increase Timeout
```env
AI_AGENT_TIMEOUT=60000  # 60 seconds
```

#### Check Network Latency
```bash
# Test latency to Abacus.AI
ping -c 5 api.abacus.ai
```

#### Implement Caching
```typescript
// Add response caching for common queries
const cache = new Map();
const cacheKey = `${agentId}-${message}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 4. Component Not Rendering

**Symptoms:**
- Chat widgets don't appear
- JavaScript errors in console
- Blank components

**Solutions:**

#### Check Imports
```typescript
// Verify correct import paths
import { CustomerSupportWidget } from '~/components/chat/CustomerSupportWidget';
import { MechanicAssistantWidget } from '~/components/chat/MechanicAssistantWidget';
```

#### Check tRPC Setup
```typescript
// Verify router is properly configured
import { appRouter } from '~/server/api/root';
// Should include aiRouter
```

#### Check Dependencies
```bash
npm list @trpc/client @trpc/server @trpc/react-query
```

### 5. Authentication Issues

**Symptoms:**
- "Authentication failed" errors
- 401/403 HTTP responses
- Access denied messages

**Solutions:**

#### Verify API Key
```bash
# Test API key with curl
curl -H "Authorization: Bearer $ABACUS_AI_API_KEY" \
     https://api.abacus.ai/health
```

#### Check Agent Access
Verify you have access to the specific agent IDs in your Abacus.AI account

#### Update Environment
```bash
# Restart development server after env changes
npm run dev
```

## Error Messages

### "Failed to send message to AI agent"

**Cause:** Network or API error

**Debug Steps:**
1. Check network connectivity
2. Verify API key and agent IDs
3. Check Abacus.AI service status
4. Review request payload

**Solution:**
```typescript
// Enable detailed error logging
console.error('Full error details:', error);
console.error('Request details:', requestData);
```

### "Session not found"

**Cause:** Invalid or expired session ID

**Debug Steps:**
1. Check session ID format
2. Verify session creation logic
3. Check session cleanup settings

**Solution:**
```typescript
// Create new session if not found
if (!sessionId || sessionNotFound) {
  sessionId = await client.createSession(agentType, userId);
}
```

### "Input validation failed"

**Cause:** Invalid request data

**Debug Steps:**
1. Check Zod schema validation
2. Verify input data types
3. Check required fields

**Solution:**
```typescript
// Log validation errors
try {
  const validatedInput = schema.parse(input);
} catch (error) {
  console.error('Validation error:', error.errors);
}
```

### "Timeout exceeded"

**Cause:** Request took too long

**Solutions:**
1. Increase timeout value
2. Check network latency
3. Optimize request payload
4. Implement retry logic

## Performance Issues

### High Memory Usage

**Symptoms:**
- Application crashes
- Out of memory errors
- Slow performance

**Solutions:**

#### Session Cleanup
```typescript
// Implement automatic session cleanup
setInterval(() => {
  sessionManager.cleanupOldSessions(24); // 24 hours
}, 60 * 60 * 1000); // Every hour
```

#### Limit Message History
```typescript
// Limit messages per session
const MAX_MESSAGES = 50;
if (session.messages.length > MAX_MESSAGES) {
  session.messages = session.messages.slice(-MAX_MESSAGES);
}
```

### High CPU Usage

**Symptoms:**
- Server becomes unresponsive
- High CPU utilization
- Slow response times

**Solutions:**

#### Rate Limiting
```typescript
// Implement client-side rate limiting
const rateLimiter = new Map();
const RATE_LIMIT = 10; // requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

#### Request Queuing
```typescript
// Implement request queue to prevent overload
const requestQueue = [];
const MAX_CONCURRENT = 5;
let activeRequests = 0;

async function queueRequest(request: () => Promise<any>) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ request, resolve, reject });
    processQueue();
  });
}
```

## Configuration Problems

### Environment Variables Not Loading

**Symptoms:**
- Variables are undefined
- Default values being used
- Configuration errors

**Solutions:**

#### Check File Location
```bash
# Verify .env.local exists and is in root directory
ls -la .env.local
```

#### Check File Format
```bash
# Verify no extra spaces or special characters
cat .env.local | grep -E "^\s*[A-Z]"
```

#### Restart Server
```bash
# Environment changes require restart
npm run dev
```

### Wrong Configuration Values

**Symptoms:**
- Unexpected behavior
- Wrong agent responses
- Feature not working

**Solutions:**

#### Validate Configuration
```typescript
// Add configuration validation
function validateConfig() {
  const required = [
    'ABACUS_AI_API_KEY',
    'CUSTOMER_SUPPORT_AGENT_ID',
    'MECHANIC_ASSISTANT_AGENT_ID'
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
```

#### Log Configuration
```typescript
// Log configuration (without sensitive data)
console.log('AI Config:', {
  customerAgentId: process.env.CUSTOMER_SUPPORT_AGENT_ID,
  mechanicAgentId: process.env.MECHANIC_ASSISTANT_AGENT_ID,
  baseUrl: process.env.ABACUS_AI_BASE_URL,
  timeout: process.env.AI_AGENT_TIMEOUT,
});
```

## Network and Connectivity

### Firewall Issues

**Symptoms:**
- Connection timeouts
- Network errors
- Requests blocked

**Solutions:**

#### Check Firewall Rules
```bash
# Allow outbound HTTPS traffic
sudo ufw allow out 443
```

#### Test Connectivity
```bash
# Test specific endpoints
curl -v https://api.abacus.ai/health
telnet api.abacus.ai 443
```

### Proxy Configuration

**Symptoms:**
- Connection errors behind corporate proxy
- SSL certificate issues

**Solutions:**

#### Configure Proxy
```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### Axios Proxy Configuration
```typescript
// Configure proxy in AbacusAIClient
const client = axios.create({
  proxy: {
    host: 'proxy.company.com',
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  }
});
```

## Development Issues

### TypeScript Errors

**Symptoms:**
- Type checking failures
- Build errors
- IDE warnings

**Solutions:**

#### Update Type Definitions
```bash
# Regenerate types
npm run build
npx tsc --noEmit
```

#### Check Import Paths
```typescript
// Use correct import paths
import type { CustomerSupportContext } from '~/lib/ai/customer-support';
import type { MechanicContext } from '~/lib/ai/mechanic-assistant';
```

### Hot Reload Issues

**Symptoms:**
- Changes not reflected
- Need to restart server
- Stale code running

**Solutions:**

#### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

#### Check File Watchers
```bash
# Increase file watcher limit on Linux
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Production Issues

### Memory Leaks

**Symptoms:**
- Gradually increasing memory usage
- Application crashes
- Performance degradation

**Solutions:**

#### Monitor Memory Usage
```bash
# Monitor Node.js memory
node --inspect your-app.js
# Use Chrome DevTools to analyze memory
```

#### Implement Session Cleanup
```typescript
// Automatic cleanup
setInterval(() => {
  sessionManager.cleanupOldSessions(24);
  // Clear other caches
}, 60 * 60 * 1000);
```

### High Error Rates

**Symptoms:**
- Many failed requests
- User complaints
- Error monitoring alerts

**Solutions:**

#### Implement Circuit Breaker
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

## Debugging Tools

### Enable Debug Logging

```env
# In .env.local
DEBUG=ai:*
NODE_ENV=development
```

### Custom Logging

```typescript
// Add detailed logging
class Logger {
  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Debug] ${message}`, data);
    }
  }
  
  static error(message: string, error?: any) {
    console.error(`[AI Error] ${message}`, error);
  }
}

// Use in your code
Logger.debug('Sending message to AI', { message, agentId });
```

### Network Debugging

```bash
# Monitor network requests
sudo tcpdump -i any host api.abacus.ai

# Check DNS resolution
nslookup api.abacus.ai
dig api.abacus.ai
```

### Performance Monitoring

```typescript
// Add performance monitoring
class PerformanceMonitor {
  static async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      console.log(`[Performance] ${name}: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[Performance] ${name} failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

// Usage
const response = await PerformanceMonitor.measure(
  'AI Chat Request',
  () => client.sendMessage(request)
);
```

## Getting Help

### Before Contacting Support

1. **Check this troubleshooting guide**
2. **Review error logs** - Include full error messages and stack traces
3. **Test with minimal example** - Isolate the issue
4. **Check service status** - Verify Abacus.AI service is operational
5. **Document steps to reproduce** - Provide clear reproduction steps

### Information to Include

When reporting issues, include:

- **Environment details** (Node.js version, OS, etc.)
- **Configuration** (without sensitive data)
- **Error messages** (full stack traces)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Relevant code snippets**

### Support Channels

1. **GitHub Issues** - For bugs and feature requests
2. **Development Team** - For integration-specific issues
3. **Abacus.AI Support** - For API and service issues
4. **Community Forums** - For general questions

### Emergency Issues

For production emergencies:

1. **Implement fallback responses** immediately
2. **Disable AI features** if necessary
3. **Monitor error rates** and user impact
4. **Contact support** with high priority
5. **Document incident** for post-mortem

### Self-Help Resources

- **API Documentation** - Detailed API reference
- **Setup Guide** - Step-by-step setup instructions
- **GitHub Repository** - Source code and examples
- **Abacus.AI Documentation** - Platform-specific docs

Remember: Most issues can be resolved by checking configuration, network connectivity, and API credentials. Start with the basics before diving into complex debugging.