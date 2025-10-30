# Security Policy

## CORS Configuration

Casibase uses Cross-Origin Resource Sharing (CORS) to control which web applications can access its API endpoints. Proper CORS configuration is essential for security.

### Default Behavior

By default, Casibase allows requests from all origins (`*`) for backward compatibility, but with credentials **disabled** to prevent security vulnerabilities.

### Recommended Production Configuration

For production environments, you should configure specific allowed origins in your `conf/app.conf`:

```ini
corsAllowOrigins = ["https://your-domain.com", "https://admin.your-domain.com"]
```

Or using environment variables:

```bash
export corsAllowOrigins='["https://your-domain.com", "https://admin.your-domain.com"]'
# Or with double quotes (escape inner quotes):
export corsAllowOrigins="[\"https://your-domain.com\", \"https://admin.your-domain.com\"]"
```

When specific origins are configured, credentials (cookies, authorization headers) are automatically enabled for those origins.

### Configuration Formats

The `corsAllowOrigins` setting supports multiple formats:

1. **JSON Array** (recommended):
   ```ini
   corsAllowOrigins = ["https://domain1.com", "https://domain2.com"]
   ```

2. **Comma-separated values** (without quotes):
   ```ini
   corsAllowOrigins = https://domain1.com,https://domain2.com
   ```
   Note: When using comma-separated format, avoid extra spaces between values for best compatibility.

3. **Empty or not set** (falls back to wildcard with credentials disabled):
   ```ini
   corsAllowOrigins = []
   ```

### Security Best Practices

1. **Never use wildcard (`*`) with credentials enabled** - This allows any website to make authenticated requests to your API, potentially leaking sensitive data.

2. **Always specify explicit origins in production** - Configure the exact domains that should have access to your API.

3. **Use HTTPS origins** - Always use `https://` for production origins to ensure encrypted communication.

4. **Keep the origin list minimal** - Only include domains that actually need access to the API.

### Example Configurations

#### Single Domain
```ini
corsAllowOrigins = ["https://casibase.com"]
```

#### Multiple Domains (including subdomains)
```ini
corsAllowOrigins = ["https://casibase.com", "https://admin.casibase.com", "https://api.casibase.com"]
```

#### Development Environment
For local development, you might include:
```ini
corsAllowOrigins = ["http://localhost:3000", "http://localhost:8000"]
```

## Reporting Security Issues

If you discover a security vulnerability, please email security@casibase.org instead of using the issue tracker.
