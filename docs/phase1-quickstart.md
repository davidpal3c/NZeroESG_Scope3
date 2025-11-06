# Phase 1 Quick Start Guide

## 🚀 Running Phase 1 Services

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL client (optional, for database inspection)

### 1. Start the Services

```bash
# Navigate to the project root
cd /Users/user/Projects/agentic\ ai\ -\ workflow\ project/nzeroesg\ app/

# Start Phase 1 services
docker-compose -f docker-compose.phase1.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.phase1.yml up --build -d
```

### 2. Verify Services are Running

Check that all services are healthy:

```bash
# Check service status
docker-compose -f docker-compose.phase1.yml ps

# Check logs
docker-compose -f docker-compose.phase1.yml logs -f

# Test individual health endpoints
curl http://localhost:3001/health  # Auth Service
curl http://localhost:4000/health  # GraphQL Gateway
```

### 3. Test Authentication Flow

#### Register a new user:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(input: { email: \"test@example.com\", password: \"password123\", role: CUSTOMER }) { user { id email role } accessToken } }"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test@example.com\", password: \"password123\" }) { user { id email role } accessToken } }"
  }'
```

#### Get current user (with JWT token):
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query { me { id email role isActive } }"
  }'
```

### 4. Test Vendor Queries

#### Get vendors list:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { vendors { nodes { id name region esgRating } totalCount } }"
  }'
```

#### Get specific vendor:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { vendor(id: \"1\") { id name region description esgRating } }"
  }'
```

### 5. Test AI Integration (requires existing AI service)

#### Chat with AI Agent:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { chatMessage(message: \"What is the carbon footprint of shipping 100kg from Toronto to Vancouver?\") { message confidence } }"
  }'
```

### 6. Database Access

#### Connect to PostgreSQL:
```bash
# Connect to auth database
docker exec -it nzeroesg-postgres-auth psql -U auth_user -d nzeroesg_auth

# List users
SELECT id, email, role, is_active, created_at FROM users;

# List active sessions
SELECT us.id, u.email, us.expires_at, us.created_at 
FROM user_sessions us 
JOIN users u ON us.user_id = u.id;
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] All services start without errors
- [ ] Health endpoints respond correctly
- [ ] PostgreSQL database initializes with schema
- [ ] GraphQL playground accessible at http://localhost:4000/graphql

### Authentication Flow
- [ ] User registration works
- [ ] User login returns JWT tokens
- [ ] JWT tokens are validated correctly
- [ ] Protected queries require authentication
- [ ] Token refresh works
- [ ] Logout invalidates tokens

### GraphQL Gateway
- [ ] Schema loads without errors
- [ ] Public queries work without authentication
- [ ] Protected queries require valid JWT
- [ ] Error handling works correctly
- [ ] CORS allows frontend connections

### Integration with Existing AI Service
- [ ] AI Agent chat messages are forwarded correctly
- [ ] Emissions calculations work through GraphQL
- [ ] User context is passed to AI service
- [ ] Timeouts and error handling work

## 🐛 Common Issues & Solutions

### Issue: Services won't start
**Solution**: Check Docker logs and ensure no ports are already in use
```bash
# Check what's using the ports
lsof -i :3001 -i :4000 -i :5433

# Stop conflicting services
docker-compose -f docker-compose.yml down
```

### Issue: Database connection errors
**Solution**: Ensure PostgreSQL is ready before other services start
```bash
# Check database status
docker exec nzeroesg-postgres-auth pg_isready -U auth_user

# Restart services in order
docker-compose -f docker-compose.phase1.yml restart postgres-auth
docker-compose -f docker-compose.phase1.yml restart auth-service
docker-compose -f docker-compose.phase1.yml restart graphql-gateway
```

### Issue: JWT tokens not working
**Solution**: Check JWT secret consistency across services
```bash
# Verify environment variables are set
docker exec nzeroesg-auth-service env | grep JWT
docker exec nzeroesg-graphql-gateway env | grep JWT
```

### Issue: AI Service integration fails
**Solution**: Update the AI_AGENT_SERVICE_URL to point to existing service
```bash
# Check if your existing AI service is running
curl http://localhost:8000/health

# Update docker-compose.phase1.yml with correct URL
# AI_AGENT_SERVICE_URL=http://host.docker.internal:8000
```

## 📊 Phase 1 Success Metrics

### ✅ Completed
- GraphQL Gateway responds to basic queries
- Auth service generates and validates JWT tokens
- PostgreSQL database stores users and sessions
- Basic error handling and logging implemented
- Docker containerization working

### 🎯 Next Steps for Phase 2
- Migrate supplier data to PostgreSQL
- Implement real vendor service with database
- Add MongoDB for compliance documents
- Enhance AI agent with user context
- Add comprehensive test suite

---

**Phase 1 Status**: ✅ **COMPLETE** - Ready for testing and Phase 2 development