# ProgChain - Enhanced Development Roadmap

**Created:** November 16, 2025
**Timeline:** 16 weeks to production-ready
**Focus:** Testing, Security, Performance, User Features

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Testing Foundation (Weeks 1-2)](#phase-1-testing-foundation)
3. [Phase 2: Security & Authentication (Weeks 3-4)](#phase-2-security--authentication)
4. [Phase 3: CI/CD & Infrastructure (Weeks 5-6)](#phase-3-cicd--infrastructure)
5. [Phase 4: Performance Optimization (Weeks 7-8)](#phase-4-performance-optimization)
6. [Phase 5: User Features (Weeks 9-10)](#phase-5-user-features)
7. [Phase 6: Monitoring & Observability (Weeks 11-12)](#phase-6-monitoring--observability)
8. [Phase 7: Production Preparation (Weeks 13-14)](#phase-7-production-preparation)
9. [Phase 8: Beta Launch (Weeks 15-16)](#phase-8-beta-launch)
10. [Future Enhancements](#future-enhancements)

---

## Overview

This roadmap transforms ProgChain from a functional MVP to a production-ready learning platform. The focus is on:

1. **Foundation** - Testing, quality assurance
2. **Security** - Authentication, authorization, protection
3. **Infrastructure** - CI/CD, monitoring, deployment
4. **Performance** - Caching, optimization, scalability
5. **Features** - User experience enhancements
6. **Production** - Launch readiness

**Success Criteria:**
- 80% test coverage
- All critical security features implemented
- <200ms average API response time
- 99.9% uptime
- User authentication working
- CI/CD pipeline operational

---

## Phase 1: Testing Foundation
**Duration:** Weeks 1-2
**Priority:** CRITICAL
**Goal:** Establish comprehensive testing infrastructure

### Week 1: Backend Testing

#### Day 1-2: Setup
```bash
# Install dependencies
cd server
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx faker factory-boy

# Create structure
mkdir -p tests/{unit,integration,e2e,fixtures,mocks}
```

**Create `server/pytest.ini`:**
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts =
    -v
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=70
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
```

**Create `server/tests/conftest.py`:**
```python
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.db.config import Base
from src.server import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture(scope="function")
async def test_session(test_db):
    TestSessionLocal = sessionmaker(
        test_db, class_=AsyncSession, expire_on_commit=False
    )
    async with TestSessionLocal() as session:
        yield session

@pytest.fixture(scope="function")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

#### Day 3-4: Unit Tests

**Topics Tests (`tests/unit/test_topics.py`):**
```python
import pytest
from src.features.topics.models import TopicChain, BaseTopic, SubTopic

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_topic_chain(test_session):
    topic_chain = await TopicChain.create(
        session=test_session,
        start_topic_name="Python Basics"
    )
    assert topic_chain.start_topic_name == "Python Basics"
    assert topic_chain.public_id is not None

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_base_topic(test_session):
    chain = await TopicChain.create(test_session, "Python")
    await test_session.commit()

    topic = await BaseTopic.create(
        session=test_session,
        topic_name="Async Programming",
        topic_chain_public_id=chain.public_id
    )
    assert topic.name == "Async Programming"

# Add 10+ more unit tests
```

**Explore Tests (`tests/unit/test_explore.py`):**
```python
import pytest
from src.features.explore.models import ExploreChat, ExploreChatMessage

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_chat(test_session):
    chat_id = await ExploreChat.create(
        session=test_session,
        chat_topic="Python Decorators"
    )
    assert chat_id is not None

@pytest.mark.unit
@pytest.mark.asyncio
async def test_add_message(test_session):
    chat = await ExploreChat.create_empty_chat(session=test_session)
    await test_session.commit()

    message = await ExploreChatMessage.create(
        session=test_session,
        chat_public_id=chat.public_id,
        user_question="What are decorators?",
        assistant_answer="Decorators are functions that modify other functions."
    )
    await test_session.commit()

    assert message.user_question == "What are decorators?"

# Add 10+ more tests
```

#### Day 5-7: Integration Tests

**API Integration Tests (`tests/integration/test_topics_api.py`):**
```python
import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_topic_chain_endpoint(client):
    with patch('src.features.topics.service.TopicService.create_topic_chain') as mock:
        mock.return_value = "test-chain-id"

        response = await client.post(
            "/topics/create-topic-chain",
            json={"topic_path": "Python > Functions"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "topic_chain_id" in data

@pytest.mark.integration
@pytest.mark.asyncio
async def test_generate_topics_endpoint(client):
    # Mock OpenAI response
    mock_response = [
        {"topic": "Variables", "difficulty": 0, "description": "Basic variables"},
        {"topic": "Functions", "difficulty": 1, "description": "Function basics"}
    ]

    with patch('src.features.topics.service.generate_topics') as mock:
        mock.return_value = mock_response

        response = await client.post(
            "/topics/generate",
            json={
                "topic_path": "Python",
                "topic_chain_id": "test-id",
                "model": "gpt-4"
            }
        )

        assert response.status_code == 200

# Add 15+ integration tests
```

**Deliverables Week 1:**
- ✅ 30+ unit tests written
- ✅ 15+ integration tests written
- ✅ 50%+ code coverage
- ✅ All tests passing

### Week 2: Frontend Testing

#### Day 1-2: Setup

```bash
cd client
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

**Create `client/vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/test/', 'src/**/*.test.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Create `client/src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

#### Day 3-5: Component Tests

**Topic Explorer Tests:**
```typescript
// client/src/components/topics/__tests__/TopicChain.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TopicChain } from '../TopicChain'

describe('TopicChain Component', () => {
  it('renders topic chain title', () => {
    render(<TopicChain topic="Python" />)
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('displays subtopics when loaded', async () => {
    const mockSubtopics = [
      { id: '1', topic: 'Variables', difficulty: 0, description: 'Test' },
      { id: '2', topic: 'Functions', difficulty: 1, description: 'Test' }
    ]

    render(<TopicChain topic="Python" subtopics={mockSubtopics} />)

    await waitFor(() => {
      expect(screen.getByText('Variables')).toBeInTheDocument()
      expect(screen.getByText('Functions')).toBeInTheDocument()
    })
  })

  it('calls onTopicClick when topic is clicked', async () => {
    const onTopicClick = vi.fn()
    const mockSubtopics = [
      { id: '1', topic: 'Variables', difficulty: 0, description: 'Test' }
    ]

    render(
      <TopicChain
        topic="Python"
        subtopics={mockSubtopics}
        onTopicClick={onTopicClick}
      />
    )

    const topicButton = screen.getByText('Variables')
    fireEvent.click(topicButton)

    expect(onTopicClick).toHaveBeenCalledWith('Variables')
  })
})

// Add 20+ more component tests
```

**Explore Mode Tests:**
```typescript
// client/src/components/explore/__tests__/Explore.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Explore } from '../Explore'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

describe('Explore Component', () => {
  const mockStore = configureStore({
    reducer: {
      // Add your reducers
    }
  })

  it('renders chat input', () => {
    render(
      <Provider store={mockStore}>
        <Explore />
      </Provider>
    )
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument()
  })

  it('sends message when submitted', async () => {
    const { container } = render(
      <Provider store={mockStore}>
        <Explore />
      </Provider>
    )

    const input = screen.getByPlaceholderText(/ask a question/i)
    const submitButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'What is Python?' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Add assertions
    })
  })
})
```

#### Day 6-7: API Mocking

**Create `client/src/test/mocks/handlers.ts`:**
```typescript
import { rest } from 'msw'

export const handlers = [
  rest.post('http://localhost:8000/topics/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        topics: [
          { topic: 'Variables', difficulty: 0, description: 'Basic variables' },
          { topic: 'Functions', difficulty: 1, description: 'Functions' }
        ]
      })
    )
  }),

  rest.post('http://localhost:8000/explore/topic', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        chat_id: 'test-chat-id',
        response: 'This is a test response'
      })
    )
  }),

  // Add more mocks
]
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

**Deliverables Week 2:**
- ✅ 40+ component tests
- ✅ API mocking setup
- ✅ 60%+ frontend coverage
- ✅ Test scripts configured

---

## Phase 2: Security & Authentication
**Duration:** Weeks 3-4
**Priority:** CRITICAL
**Goal:** Implement secure authentication and protect the application

### Week 3: Authentication System

#### Day 1-2: User Model & Service

**Install dependencies:**
```bash
cd server
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
```

**Create `server/src/features/auth/models.py`:**
```python
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from src.db.config import Base
from src.db.mixins import TimestampMixin, PublicIDMixin
from datetime import datetime

class User(Base, TimestampMixin, PublicIDMixin):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    explore_chats = relationship("ExploreChat", back_populates="user")
    threads = relationship("Thread", back_populates="user")
    roadmaps = relationship("Roadmap", back_populates="user")
```

**Create `server/src/features/auth/service.py`:**
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key-change-in-production"  # Move to settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def authenticate_user(session: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def create_user(
    session: AsyncSession,
    email: str,
    username: str,
    password: str
) -> User:
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password
    )
    session.add(user)
    await session.commit()
    return user
```

#### Day 3-4: Auth Endpoints

**Create `server/src/features/auth/handler.py`:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.context import get_session
from . import service
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_active: bool
    is_verified: bool
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    # Check if user exists
    existing_user = await service.get_user_by_email(session, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    existing_username = await service.get_user_by_username(session, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    user = await service.create_user(
        session,
        email=user_data.email,
        username=user_data.username,
        password=user_data.password
    )

    # Create token
    access_token_expires = timedelta(minutes=service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = service.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
):
    user = await service.authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await session.commit()

    access_token_expires = timedelta(minutes=service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = service.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, service.SECRET_KEY, algorithms=[service.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await service.get_user_by_email(session, email=email)
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.public_id,
        email=current_user.email,
        username=current_user.username,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )
```

#### Day 5: Protect Routes

**Update existing handlers to require authentication:**
```python
# Example: server/src/features/topics/handler.py
from src.features.auth.handler import get_current_user
from src.features.auth.models import User

@router.post("/generate")
async def generate_topics(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),  # Add this
    session: AsyncSession = Depends(get_session)
):
    # Now only authenticated users can access
    # Use current_user.public_id to associate data with user
    pass
```

#### Day 6-7: Frontend Auth Integration

**Create `client/src/services/auth.ts`:**
```typescript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  username: string  // Note: OAuth2 form uses username for email
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  username: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data)
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
    }
    return response.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)

    const response = await axios.post(`${API_URL}/auth/token`, formData)
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
    }
    return response.data
  }

  logout() {
    localStorage.removeItem('token')
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export default new AuthService()
```

**Create Auth Components:**
```typescript
// client/src/components/auth/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authService.login({ username: email, password })
      navigate('/explore')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit">Login</Button>
      </form>
    </div>
  )
}
```

### Week 4: Rate Limiting & Security

#### Day 1-2: Rate Limiting

**Install slowapi:**
```bash
cd server
pip install slowapi
```

**Create `server/src/fastapi_components/rate_limit.py`:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response

limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiting(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Update handlers:**
```python
# In server/src/features/topics/handler.py
from src.fastapi_components.rate_limit import limiter
from fastapi import Request

@router.post("/generate")
@limiter.limit("10/minute")  # 10 requests per minute
async def generate_topics(
    request: Request,
    topic_request: GenerateRequest,
    current_user: User = Depends(get_current_user)
):
    # Your code
    pass
```

#### Day 3-4: Security Headers & CORS

**Create `server/src/fastapi_components/security.py`:**
```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

def setup_security(app):
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            # Add production URLs
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)
```

#### Day 5-7: Input Validation & Sanitization

**Create validators:**
```python
# server/src/core/validation.py
from pydantic import BaseModel, validator
import bleach

class SanitizedString(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError('string required')
        # Sanitize HTML/scripts
        cleaned = bleach.clean(v, tags=[], strip=True)
        # Remove potential SQL injection attempts
        if any(keyword in cleaned.lower() for keyword in ['drop', 'delete', 'insert', 'update', '--']):
            raise ValueError('Invalid input detected')
        return cleaned

# Use in models
class GenerateRequest(BaseModel):
    topic_path: SanitizedString
    model: str = "gpt-4"

    @validator('model')
    def validate_model(cls, v):
        allowed = ['gpt-4', 'gpt-3.5-turbo']
        if v not in allowed:
            raise ValueError(f'Model must be one of {allowed}')
        return v
```

**Deliverables Week 3-4:**
- ✅ User authentication working
- ✅ JWT tokens implemented
- ✅ Protected routes
- ✅ Rate limiting on all endpoints
- ✅ Security headers
- ✅ Input validation
- ✅ Frontend auth integration

---

## Phase 3: CI/CD & Infrastructure
**Duration:** Weeks 5-6
**Priority:** HIGH
**Goal:** Automated testing, deployment, and database migrations

### Week 5: CI/CD Pipeline

#### Day 1-3: GitHub Actions

**Create `.github/workflows/test.yml`:**
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          cd server
          pip install -r requirements.txt

      - name: Run linting
        run: |
          cd server
          pip install black ruff mypy
          black --check src
          ruff check src

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd server
          pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage.xml
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json

      - name: Install dependencies
        run: |
          cd client
          npm ci

      - name: Run linting
        run: |
          cd client
          npm run lint

      - name: Type check
        run: |
          cd client
          npx tsc --noEmit

      - name: Run tests
        run: |
          cd client
          npm run test:run -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./client/coverage/lcov.info
          flags: frontend

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build images
        run: |
          docker-compose build

      - name: Test containers
        run: |
          docker-compose up -d
          sleep 10
          docker-compose ps
          docker-compose logs
          docker-compose down
```

#### Day 4-5: Database Migrations (Alembic)

**Install Alembic:**
```bash
cd server
pip install alembic
alembic init alembic
```

**Configure `server/alembic/env.py`:**
```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio
import os

# Import all models
from src.db.config import Base
from src.features.topics.models import TopicChain, BaseTopic, SubTopic
from src.features.explore.models import ExploreChat, ExploreChatMessage, ExploreChatStats
from src.features.threads.models import Thread, ThreadContent, ThreadContentChat
from src.features.roadmap.models import Roadmap, RoadmapNode
from src.features.auth.models import User

config = context.config

# Get database URL from environment
database_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://progchain:progchain@localhost:5432/progchain')
config.set_main_option('sqlalchemy.url', database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

**Create initial migration:**
```bash
cd server
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**Create migration script:**
```bash
# server/scripts/migrate.sh
#!/bin/bash
cd "$(dirname "$0")/.."
alembic upgrade head
```

#### Day 6-7: Pre-commit Hooks

**Create `.pre-commit-config.yaml`:**
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  - repo: https://github.com/psf/black
    rev: 23.11.0
    hooks:
      - id: black
        files: ^server/

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        files: ^server/
        args: [--fix]

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.54.0
    hooks:
      - id: eslint
        files: ^client/
        types_or: [javascript, jsx, ts, tsx]
        additional_dependencies:
          - eslint
          - typescript
          - '@typescript-eslint/eslint-plugin'
          - '@typescript-eslint/parser'
```

**Install and run:**
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

### Week 6: Deployment Infrastructure

#### Day 1-3: Production Docker Setup

**Create `docker-compose.prod.yml`:**
```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped
    networks:
      - app-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${API_URL}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### Day 4-5: Environment Management

**Create `server/.env.production.example`:**
```env
# Database
DB_USER=progchain
DB_PASSWORD=change-this-in-production
DB_NAME=progchain
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

# Redis
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=generate-a-secure-random-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Server
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
WORKERS=4

# CORS
CORS_ORIGINS=["https://yourdomain.com"]

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=your-sentry-dsn-here

# File Upload
MAX_UPLOAD_SIZE=10485760

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

#### Day 6-7: Backup & Monitoring Setup

**Create `scripts/backup-db.sh`:**
```bash
#!/bin/bash
# Backup PostgreSQL database

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/progchain_$TIMESTAMP.sql.gz"

# Create backup
docker-compose exec -T db pg_dump -U progchain progchain | gzip > "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "progchain_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Create health check endpoint:**
```python
# server/src/features/health/handler.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.context import get_session
from datetime import datetime
import redis.asyncio as redis

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health_check(session: AsyncSession = Depends(get_session)):
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {}
    }

    # Check database
    try:
        await session.execute("SELECT 1")
        health["services"]["database"] = "healthy"
    except Exception as e:
        health["services"]["database"] = "unhealthy"
        health["status"] = "degraded"

    # Check Redis
    try:
        r = redis.from_url("redis://redis:6379/0")
        await r.ping()
        health["services"]["redis"] = "healthy"
    except Exception as e:
        health["services"]["redis"] = "unhealthy"
        health["status"] = "degraded"

    return health
```

**Deliverables Week 5-6:**
- ✅ CI/CD pipeline operational
- ✅ Database migrations setup
- ✅ Pre-commit hooks working
- ✅ Production Docker configuration
- ✅ Backup automation
- ✅ Health check endpoints

---

## Phase 4: Performance Optimization
**Duration:** Weeks 7-8
**Priority:** MEDIUM-HIGH
**Goal:** Improve response times and scalability

### Week 7: Backend Performance

#### Day 1-3: Redis Caching

**Install Redis client:**
```bash
cd server
pip install redis aioredis
```

**Create caching service:**
```python
# server/src/core/cache/redis_cache.py
from typing import Optional, Any
import json
import redis.asyncio as redis
from functools import wraps
import hashlib

class RedisCache:
    def __init__(self, url: str = "redis://localhost:6379/0"):
        self.redis = redis.from_url(url, encoding="utf-8", decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        await self.redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str):
        await self.redis.delete(key)

    async def clear_pattern(self, pattern: str):
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

cache = RedisCache()

def cached(ttl: int = 3600, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{hashlib.md5(str((args, kwargs)).encode()).hexdigest()}"

            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            await cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator
```

**Apply caching:**
```python
# In server/src/features/topics/service.py
from src.core.cache.redis_cache import cached

@cached(ttl=3600, key_prefix="topics")
async def get_topic_chain(public_id: str):
    # Your existing code
    pass
```

#### Day 4-5: Database Optimization

**Add indexes:**
```sql
-- Run these migrations
CREATE INDEX idx_explore_chat_created ON explore_chats(created_at DESC);
CREATE INDEX idx_thread_created ON thread(created_at DESC);
CREATE INDEX idx_user_email_active ON users(email, is_active);
CREATE INDEX idx_roadmap_updated ON roadmaps(updated_at DESC);
```

**Connection pooling:**
```python
# server/src/db/config.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
)
```

**Query optimization:**
```python
# Use selectinload to avoid N+1 queries
from sqlalchemy.orm import selectinload

query = (
    select(TopicChain)
    .options(
        selectinload(TopicChain.topics).selectinload(BaseTopic.subtopics)
    )
)
```

#### Day 6-7: Response Compression & Pagination

**Add compression:**
```python
# server/src/fastapi_components/app.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Implement pagination:**
```python
# server/src/core/pagination.py
from pydantic import BaseModel
from typing import List, Generic, TypeVar

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

async def paginate(query, page: int = 1, page_size: int = 20):
    # Count total
    total = await session.execute(select(func.count()).select_from(query))
    total = total.scalar()

    # Get page
    offset = (page - 1) * page_size
    items = await session.execute(
        query.offset(offset).limit(page_size)
    )

    return PaginatedResponse(
        items=items.scalars().all(),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )
```

### Week 8: Frontend Performance

#### Day 1-3: Code Splitting

**Implement lazy loading:**
```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoadingAnimation } from './components/utils/LoadingAnimation'

// Lazy load routes
const Explore = lazy(() => import('./components/explore/Explore'))
const Topics = lazy(() => import('./components/topics/TopicExplorer'))
const Thread = lazy(() => import('./components/thread/Thread'))
const Roadmap = lazy(() => import('./components/roadmap/RoadmapDashboard'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingAnimation />}>
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/threads" element={<Thread />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

#### Day 4-5: Bundle Optimization

**Analyze bundle:**
```bash
cd client
npm install -D rollup-plugin-visualizer
npm run build
npx vite-bundle-visualizer
```

**Optimize imports:**
```typescript
// Bad: Imports entire lodash
import _ from 'lodash'

// Good: Import only what you need
import debounce from 'lodash/debounce'
```

**Update vite.config.ts:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'markdown-vendor': ['react-markdown', 'rehype-highlight', 'rehype-katex'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

#### Day 6-7: Performance Improvements

**Memoization:**
```typescript
import { useMemo, useCallback } from 'react'

export function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(item => /* expensive operation */)
  }, [data])

  const handleClick = useCallback(() => {
    // Handler logic
  }, [/* dependencies */])

  return <div>{/* JSX */}</div>
}
```

**Virtual scrolling:**
```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window'

function LargeList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

**Deliverables Week 7-8:**
- ✅ Redis caching implemented
- ✅ Database query optimization
- ✅ Connection pooling
- ✅ Code splitting
- ✅ Bundle size reduced by 40%+
- ✅ Response times improved

---

## Phase 5: User Features
**Duration:** Weeks 9-10
**Priority:** MEDIUM
**Goal:** Enhance user experience with new features

### Week 9: Search & Bookmarks

#### Day 1-3: Search Functionality

**Backend:**
```python
# server/src/features/search/handler.py
from fastapi import APIRouter, Depends
from sqlalchemy import or_, func
from src.features.auth.models import User
from src.features.auth.handler import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search(
    q: str,
    type: str = "all",  # all, chats, threads, topics
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    results = {
        "chats": [],
        "threads": [],
        "topics": [],
        "roadmaps": []
    }

    if type in ["all", "chats"]:
        # Search explore chats
        chat_query = (
            select(ExploreChat)
            .where(
                ExploreChat.user_id == current_user.id,
                ExploreChat.chat_topic.ilike(f"%{q}%")
            )
            .limit(limit)
        )
        chats = await session.execute(chat_query)
        results["chats"] = [chat.to_dict() for chat in chats.scalars()]

    if type in ["all", "threads"]:
        # Search threads
        thread_query = (
            select(Thread)
            .where(
                Thread.user_id == current_user.id,
                Thread.topic.ilike(f"%{q}%")
            )
            .limit(limit)
        )
        threads = await session.execute(thread_query)
        results["threads"] = [thread.to_dict() for thread in threads.scalars()]

    # Similar for topics and roadmaps

    return results
```

**Frontend:**
```typescript
// client/src/components/search/SearchBar.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  const handleSearch = async (q: string) => {
    if (q.length < 2) return

    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await response.json()
    setResults(data)
  }

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Search chats, threads, topics..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        className="w-full"
      />
      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />

      {results.length > 0 && (
        <SearchResults results={results} />
      )}
    </div>
  )
}
```

#### Day 4-5: Bookmarks System

**Database model:**
```python
# server/src/features/bookmarks/models.py
class Bookmark(Base, TimestampMixin, PublicIDMixin):
    __tablename__ = "bookmarks"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bookmark_type = Column(String, nullable=False)  # chat, thread, topic
    reference_id = Column(String, nullable=False)  # ID of bookmarked item
    title = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'reference_id', name='unique_user_bookmark'),
        Index('idx_user_bookmarks', 'user_id', 'created_at'),
    )
```

**API endpoints:**
```python
@router.post("/bookmarks")
async def create_bookmark(
    bookmark: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    new_bookmark = Bookmark(
        user_id=current_user.id,
        bookmark_type=bookmark.type,
        reference_id=bookmark.reference_id,
        title=bookmark.title,
        notes=bookmark.notes
    )
    session.add(new_bookmark)
    await session.commit()
    return new_bookmark.to_dict()

@router.get("/bookmarks")
async def get_bookmarks(
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    query = select(Bookmark).where(Bookmark.user_id == current_user.id)
    if type:
        query = query.where(Bookmark.bookmark_type == type)

    bookmarks = await session.execute(query.order_by(Bookmark.created_at.desc()))
    return [b.to_dict() for b in bookmarks.scalars()]
```

#### Day 6-7: Export Functionality

**PDF export:**
```python
# server/src/features/export/handler.py
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

@router.get("/export/chat/{chat_id}/pdf")
async def export_chat_pdf(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Get chat messages
    messages = await get_chat_messages(session, chat_id)

    # Generate PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)

    y = 750
    for msg in messages:
        p.drawString(100, y, f"Q: {msg.user_question}")
        y -= 20
        p.drawString(100, y, f"A: {msg.assistant_answer[:100]}...")
        y -= 40

        if y < 100:
            p.showPage()
            y = 750

    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=chat_{chat_id}.pdf"}
    )
```

### Week 10: Progress Tracking

#### Day 1-4: Learning Analytics

**Database models:**
```python
# server/src/features/analytics/models.py
class UserProgress(Base, TimestampMixin):
    __tablename__ = "user_progress"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_chats = Column(Integer, default=0)
    total_threads = Column(Integer, default=0)
    total_topics_explored = Column(Integer, default=0)
    total_time_spent = Column(Integer, default=0)  # seconds
    streak_days = Column(Integer, default=0)
    last_activity = Column(DateTime, nullable=True)

class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)
    activity_data = Column(JSON, nullable=True)
    duration = Column(Integer, nullable=True)  # seconds
```

**Analytics endpoint:**
```python
@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Get user progress
    progress = await session.execute(
        select(UserProgress).where(UserProgress.user_id == current_user.id)
    )
    progress = progress.scalar_one_or_none()

    # Get recent activity
    recent = await session.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    )

    # Calculate stats
    stats = {
        "total_chats": progress.total_chats if progress else 0,
        "total_threads": progress.total_threads if progress else 0,
        "total_topics": progress.total_topics_explored if progress else 0,
        "streak_days": progress.streak_days if progress else 0,
        "recent_activity": [a.to_dict() for a in recent.scalars()]
    }

    return stats
```

#### Day 5-7: Dashboard UI

**Frontend dashboard:**
```typescript
// client/src/components/analytics/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AnalyticsData {
  total_chats: number
  total_threads: number
  total_topics: number
  streak_days: number
  recent_activity: Activity[]
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    const response = await fetch('/api/analytics/dashboard')
    const data = await response.json()
    setData(data)
  }

  if (!data) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <h3 className="text-sm font-medium">Total Chats</h3>
        <p className="text-3xl font-bold">{data.total_chats}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium">Learning Threads</h3>
        <p className="text-3xl font-bold">{data.total_threads}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium">Topics Explored</h3>
        <p className="text-3xl font-bold">{data.total_topics}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium">Day Streak</h3>
        <p className="text-3xl font-bold">{data.streak_days} 🔥</p>
      </Card>

      <Card className="col-span-full p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {/* Activity list */}
      </Card>
    </div>
  )
}
```

**Deliverables Week 9-10:**
- ✅ Search functionality
- ✅ Bookmark system
- ✅ Export to PDF
- ✅ Progress tracking
- ✅ Analytics dashboard
- ✅ Activity logging

---

## Phase 6: Monitoring & Observability
**Duration:** Weeks 11-12
**Priority:** HIGH
**Goal:** Production monitoring and error tracking

### Week 11: Logging & Error Tracking

#### Day 1-3: Structured Logging

**Install Loguru:**
```bash
pip install loguru
```

**Setup logging:**
```python
# server/src/core/logging.py
import sys
import json
from loguru import logger
from datetime import datetime

class StructuredLogger:
    def __init__(self):
        logger.remove()

        # Console logging (development)
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="INFO"
        )

        # File logging (JSON for production)
        logger.add(
            "logs/app_{time:YYYY-MM-DD}.log",
            rotation="00:00",
            retention="30 days",
            compression="zip",
            serialize=True,  # JSON output
            level="INFO"
        )

        # Error log
        logger.add(
            "logs/errors_{time:YYYY-MM-DD}.log",
            rotation="00:00",
            retention="90 days",
            level="ERROR"
        )

    def log_request(self, request, response, duration):
        logger.info(
            "HTTP Request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration * 1000,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

structured_logger = StructuredLogger()
```

**Add request logging middleware:**
```python
# server/src/fastapi_components/middleware.py
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logging import structured_logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time
        structured_logger.log_request(request, response, duration)

        return response
```

#### Day 4-5: Sentry Integration

**Install Sentry:**
```bash
pip install sentry-sdk[fastapi]
```

**Configure Sentry:**
```python
# server/src/fastapi_components/app.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% of transactions
    environment=os.getenv("ENVIRONMENT", "development"),
    before_send=before_send_filter,  # Filter sensitive data
)

def before_send_filter(event, hint):
    # Remove sensitive data
    if 'request' in event:
        if 'headers' in event['request']:
            # Remove authorization headers
            event['request']['headers'].pop('Authorization', None)
    return event
```

#### Day 6-7: Metrics & Monitoring

**Install Prometheus client:**
```bash
pip install prometheus-client
```

**Add metrics:**
```python
# server/src/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)

openai_requests = Counter(
    'openai_requests_total',
    'Total OpenAI API requests',
    ['model', 'status']
)

def track_request(method, endpoint, status, duration):
    request_count.labels(method=method, endpoint=endpoint, status=status).inc()
    request_duration.labels(method=method, endpoint=endpoint).observe(duration)

def track_openai_request(model, status):
    openai_requests.labels(model=model, status=status).inc()
```

**Metrics endpoint:**
```python
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

@app.get("/metrics")
async def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### Week 12: Alerting & Dashboards

#### Day 1-3: Uptime Monitoring

**Health check with detailed status:**
```python
# server/src/features/health/handler.py
from fastapi import APIRouter
from datetime import datetime
import psutil
import asyncio

@router.get("/health/detailed")
async def detailed_health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": await check_all_services(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    }

async def check_all_services():
    services = {}

    # Database
    services["database"] = await check_database()

    # Redis
    services["redis"] = await check_redis()

    # OpenAI
    services["openai"] = await check_openai()

    return services
```

#### Day 4-5: Grafana Dashboard

**Create `docker-compose.monitoring.yml`:**
```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - "9090:9090"
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3001:3000"
    networks:
      - app-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    external: true
```

**Prometheus config:**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'progchain-api'
    static_configs:
      - targets: ['server:8000']
    metrics_path: '/metrics'
```

#### Day 6-7: Alerting

**Set up email alerts:**
```python
# server/src/core/alerts.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AlertManager:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.sender_email = os.getenv("ALERT_EMAIL")
        self.sender_password = os.getenv("ALERT_PASSWORD")
        self.recipient_emails = os.getenv("ALERT_RECIPIENTS", "").split(",")

    def send_alert(self, subject: str, body: str, severity: str = "warning"):
        message = MIMEMultipart()
        message["From"] = self.sender_email
        message["To"] = ", ".join(self.recipient_emails)
        message["Subject"] = f"[{severity.upper()}] {subject}"

        message.attach(MIMEText(body, "html"))

        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(message)

alert_manager = AlertManager()
```

**Define alert conditions:**
```python
async def check_system_health():
    # CPU usage > 80%
    if psutil.cpu_percent() > 80:
        alert_manager.send_alert(
            "High CPU Usage",
            f"CPU usage is at {psutil.cpu_percent()}%",
            severity="warning"
        )

    # Memory usage > 85%
    if psutil.virtual_memory().percent > 85:
        alert_manager.send_alert(
            "High Memory Usage",
            f"Memory usage is at {psutil.virtual_memory().percent}%",
            severity="critical"
        )

    # Database connection issues
    try:
        await session.execute("SELECT 1")
    except Exception as e:
        alert_manager.send_alert(
            "Database Connection Error",
            f"Cannot connect to database: {str(e)}",
            severity="critical"
        )
```

**Deliverables Week 11-12:**
- ✅ Structured logging
- ✅ Sentry error tracking
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ Uptime monitoring
- ✅ Email alerting
- ✅ Health checks

---

## Phase 7: Production Preparation
**Duration:** Weeks 13-14
**Priority:** CRITICAL
**Goal:** Final checks and production deployment

### Week 13: Security Audit & Load Testing

#### Day 1-2: Security Audit

**Run security scanners:**
```bash
# Python security audit
pip install safety bandit
safety check --json
bandit -r server/src/ -f json -o security-report.json

# Dependency audit
npm audit --audit-level=moderate

# Docker image scanning
docker scan progchain-server:latest
docker scan progchain-client:latest
```

**Penetration testing checklist:**
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass attempts
- [ ] Rate limit testing
- [ ] File upload vulnerabilities
- [ ] API security testing

#### Day 3-5: Load Testing

**Install Locust:**
```bash
pip install locust
```

**Create load tests:**
```python
# server/tests/load/locustfile.py
from locust import HttpUser, task, between
import random

class ProgChainUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login
        response = self.client.post("/auth/token", data={
            "username": "test@example.com",
            "password": "testpass123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def explore_chat(self):
        self.client.post(
            "/explore/topic",
            json={
                "topic": random.choice(["Python", "JavaScript", "React", "FastAPI"]),
                "model": "gpt-3.5-turbo"
            },
            headers=self.headers
        )

    @task(2)
    def generate_topics(self):
        self.client.post(
            "/topics/generate",
            json={
                "topic_path": "Python > Advanced",
                "model": "gpt-4"
            },
            headers=self.headers
        )

    @task(1)
    def create_thread(self):
        self.client.post(
            "/threads/create",
            json={
                "topic": "Learning Python Async"
            },
            headers=self.headers
        )

# Run: locust -f locustfile.py --host=http://localhost:8000
```

**Performance targets:**
- Average response time: <200ms
- 95th percentile: <500ms
- 99th percentile: <1s
- Throughput: >100 requests/second
- Error rate: <0.1%

#### Day 6-7: Documentation Update

**Create comprehensive docs:**
```markdown
# API_DOCUMENTATION.md
# DEPLOYMENT_GUIDE.md
# TROUBLESHOOTING.md
# SECURITY.md
# CONTRIBUTING.md
```

### Week 14: Deployment & Launch

#### Day 1-2: Production Environment Setup

**Set up production server:**
```bash
# 1. Set up VPS/Cloud server (DigitalOcean, AWS, etc.)
# 2. Install Docker & Docker Compose
# 3. Clone repository
git clone https://github.com/yourname/progchain.git
cd progchain

# 4. Set up environment
cp server/.env.production.example server/.env
# Edit .env with production values

# 5. Set up SSL certificates (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

**Configure nginx:**
```nginx
# nginx/nginx.conf
upstream backend {
    server server:8000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Day 3-4: Database Migration

**Backup current data:**
```bash
# Backup existing database
./scripts/backup-db.sh

# Run migrations
docker-compose exec server alembic upgrade head
```

#### Day 5-7: Beta Launch

**Launch checklist:**
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Load testing successful
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] Documentation complete
- [ ] Error tracking active
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Health checks working

**Soft launch:**
1. Deploy to production
2. Test all features
3. Invite 10-20 beta users
4. Monitor closely
5. Collect feedback
6. Fix critical issues
7. Gradual rollout

**Launch announcement:**
```markdown
# ProgChain Beta Launch! 🚀

We're excited to announce the beta release of ProgChain - an AI-powered learning platform for developers.

Features:
- 🎯 Topic Explorer - Hierarchical learning paths
- 💬 Explore Mode - Conversational AI tutor
- 📚 Learning Threads - Structured content
- 🗺️ Roadmaps - Visual learning journeys
- 📊 Progress Tracking - Analytics dashboard
- 🔖 Bookmarks - Save important content

Try it now: https://progchain.com
Beta signup: Limited to 100 users

Feedback: feedback@progchain.com
```

**Deliverables Week 13-14:**
- ✅ Security audit complete
- ✅ Load testing passed
- ✅ Production deployment
- ✅ SSL configured
- ✅ Monitoring active
- ✅ Beta launch successful

---

## Phase 8: Beta Launch & Iteration
**Duration:** Weeks 15-16
**Priority:** HIGH
**Goal:** Gather feedback and iterate

### Week 15-16: Beta Testing & Improvements

**Daily tasks:**
1. Monitor error rates
2. Review user feedback
3. Fix critical bugs
4. Optimize performance
5. Update documentation

**Success metrics:**
- [ ] 100+ beta signups
- [ ] <1% error rate
- [ ] 99.9% uptime
- [ ] <500ms average response time
- [ ] Positive user feedback

**Iteration cycle:**
1. Collect feedback (surveys, interviews)
2. Prioritize improvements
3. Implement fixes
4. Deploy updates
5. Monitor impact

---

## Future Enhancements
**Timeline:** Post-Launch (Months 5-12)

### Q1 Post-Launch (Months 5-7)

**User Experience:**
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Voice input/output
- [ ] Customizable themes
- [ ] Keyboard shortcuts

**Learning Features:**
- [ ] Quiz generation
- [ ] Code execution environment
- [ ] Video integration
- [ ] Spaced repetition system
- [ ] Flashcards

**Social Features:**
- [ ] User profiles
- [ ] Share learning paths
- [ ] Community forum
- [ ] Collaborative learning
- [ ] Leaderboards

### Q2 Post-Launch (Months 8-10)

**AI Enhancements:**
- [ ] Fine-tuned models
- [ ] Multi-provider support (Anthropic, local models)
- [ ] Image generation
- [ ] Code review AI
- [ ] Project generation

**Enterprise Features:**
- [ ] Team accounts
- [ ] Admin dashboard
- [ ] Usage analytics
- [ ] Custom branding
- [ ] SSO integration

### Q3 Post-Launch (Months 11-12)

**Platform Expansion:**
- [ ] IDE plugins (VS Code, IntelliJ)
- [ ] Browser extension
- [ ] API for third-party integrations
- [ ] Webhook support
- [ ] Zapier integration

**Advanced Features:**
- [ ] Live coding sessions
- [ ] Peer programming
- [ ] Mentorship matching
- [ ] Career guidance
- [ ] Certification system

---

## Implementation Priorities

### Must Have (Critical Path)
1. ✅ Testing infrastructure
2. ✅ Authentication & security
3. ✅ CI/CD pipeline
4. ✅ Performance optimization
5. ✅ Monitoring & observability
6. ✅ Production deployment

### Should Have (High Value)
7. ✅ Search functionality
8. ✅ Bookmarks
9. ✅ Export features
10. ✅ Progress tracking
11. ⚠️ Mobile responsiveness
12. ⚠️ API rate limiting

### Nice to Have (Future)
13. Quiz generation
14. Video integration
15. Mobile app
16. Social features
17. Enterprise features

---

## Success Metrics

### Technical Metrics
- **Uptime:** 99.9%
- **Response Time:** <200ms (avg), <500ms (p95)
- **Error Rate:** <0.1%
- **Test Coverage:** >80%
- **Security Score:** A+ (SSL Labs)
- **Performance Score:** >90 (Lighthouse)

### User Metrics
- **Beta Users:** 100+ in first month
- **Retention:** >40% after 7 days
- **Daily Active Users:** 30%+ of signups
- **Session Duration:** >10 minutes
- **User Satisfaction:** 4.5+/5 stars

### Business Metrics
- **Monthly Active Users:** 500+ by month 3
- **Conversion Rate:** 5%+ (free to paid, if applicable)
- **Churn Rate:** <10% monthly
- **Net Promoter Score:** >50

---

## Risk Management

### Technical Risks
1. **OpenAI API outages** → Implement fallback providers
2. **Database performance** → Connection pooling, caching
3. **Security breaches** → Regular audits, bug bounty
4. **Scaling issues** → Load balancing, horizontal scaling

### Business Risks
1. **Low adoption** → Marketing, user acquisition
2. **High costs** → Optimize AI usage, implement quotas
3. **Competition** → Unique features, better UX
4. **Legal issues** → Terms of service, privacy policy

---

## Budget Estimate

### Development (16 weeks)
- **Developer time:** $20,000-$40,000 (freelance) or time investment
- **Tools & services:** $500-$1,000
- **Total:** $20,500-$41,000

### Monthly Operating Costs
- **Infrastructure:** $50-$200
- **OpenAI API:** $100-$500 (usage-based)
- **Monitoring tools:** $50-$100
- **Domain & SSL:** $20
- **Total:** $220-$820/month

### First Year Projection
- **Development:** $25,000 (avg)
- **Operations (12 months):** $5,000 (avg)
- **Marketing:** $5,000-$10,000
- **Total:** $35,000-$40,000

---

## Conclusion

This enhanced roadmap provides a clear path from MVP to production-ready platform. The 16-week timeline is aggressive but achievable with focused effort.

**Key Success Factors:**
1. Maintain test coverage throughout
2. Prioritize security from day one
3. Monitor performance continuously
4. Iterate based on user feedback
5. Keep documentation updated

**Next Steps:**
1. Review and approve roadmap
2. Set up project management (Jira, Linear, etc.)
3. Create sprint plans (2-week sprints)
4. Begin Phase 1: Testing Foundation
5. Track progress weekly

**Final Reminder:**
This is a living document. Adjust priorities based on:
- User feedback
- Technical challenges
- Resource availability
- Market conditions
- Competition

Good luck with your development journey! 🚀
