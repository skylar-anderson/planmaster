/**
 * Mock responses for AI operations during development and testing
 */

import { ContextItem } from '@/types/context';
import { PRD } from '@/app/types/prd';

// Mock PRD content template
const MOCK_PRD_TEMPLATE = `# Product Requirements Document: {{PROJECT_NAME}}

## Executive Summary

{{PROJECT_NAME}} is a comprehensive platform designed to {{PROJECT_DESCRIPTION}}. This document outlines the requirements, goals, and technical specifications for developing a robust solution that meets user needs while maintaining scalability and performance.

## Problem Statement

Current solutions in the market lack {{PROBLEM_AREAS}}. Users are struggling with {{USER_PAIN_POINTS}}, leading to inefficiencies and frustration. There is a clear need for a platform that addresses these issues through {{SOLUTION_APPROACH}}.

## Goals & Objectives

### Primary Goals
- Deliver a user-friendly interface that simplifies {{PRIMARY_FUNCTIONALITY}}
- Provide robust backend infrastructure supporting {{SCALE_REQUIREMENTS}}
- Ensure high availability and performance under load
- Implement comprehensive security measures

### Secondary Goals
- Enable integration with popular third-party services
- Support multiple deployment environments
- Provide detailed analytics and reporting
- Maintain excellent developer experience

## Requirements

### Functional Requirements
- **User Management**: Registration, authentication, and profile management
- **Core Features**: {{CORE_FEATURES}}
- **Data Management**: Secure storage and retrieval of user data
- **API Integration**: RESTful APIs for external integrations
- **Reporting**: Dashboard with key metrics and analytics

### Non-Functional Requirements
- **Performance**: Response times under 200ms for 95% of requests
- **Scalability**: Support for 10,000+ concurrent users
- **Security**: Industry-standard encryption and authentication
- **Availability**: 99.9% uptime with automated failover

## User Stories

### As a new user
- I want to easily register and set up my account
- I want to understand how to use the platform quickly
- I want to see immediate value from the features

### As a power user
- I want advanced features and customization options
- I want to integrate with my existing tools
- I want detailed analytics about my usage

### As an administrator
- I want to manage users and permissions
- I want to monitor system performance
- I want to configure system settings

## Technical Specifications

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **TypeScript**: Full type safety

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: Cloud storage integration

### Infrastructure
- **Deployment**: Vercel/AWS
- **Monitoring**: Application performance monitoring
- **CI/CD**: GitHub Actions
- **Security**: HTTPS, CSRF protection, input validation

## Acceptance Criteria

### Phase 1 (MVP)
- [ ] User registration and authentication
- [ ] Basic {{CORE_FUNCTIONALITY}}
- [ ] Responsive web interface
- [ ] Basic security measures

### Phase 2 (Enhanced)
- [ ] Advanced features and customization
- [ ] API integrations
- [ ] Analytics dashboard
- [ ] Performance optimizations

### Phase 3 (Scale)
- [ ] Multi-tenant support
- [ ] Advanced security features
- [ ] Comprehensive monitoring
- [ ] Documentation and support

## Timeline & Milestones

### Month 1-2: Foundation
- Set up development environment
- Implement user authentication
- Create basic UI components
- Set up database schema

### Month 3-4: Core Features
- Implement {{CORE_FEATURES}}
- Add data management capabilities
- Create responsive interfaces
- Begin testing procedures

### Month 5-6: Polish & Launch
- Performance optimization
- Security audit and fixes
- User acceptance testing
- Production deployment

## Risks & Mitigation

### Technical Risks
- **Scalability concerns**: Implement horizontal scaling from the start
- **Security vulnerabilities**: Regular security audits and updates
- **Performance issues**: Continuous monitoring and optimization

### Business Risks
- **User adoption**: Implement user feedback loops early
- **Competition**: Focus on unique value propositions
- **Technical debt**: Maintain code quality standards

## Success Metrics

### User Metrics
- User registration rate
- Daily/Monthly active users
- User retention rates
- Feature adoption rates

### Technical Metrics
- System uptime and availability
- Response time percentiles
- Error rates and resolution times
- Security incident frequency

### Business Metrics
- User satisfaction scores
- Support ticket volume
- Feature usage analytics
- Performance vs. SLA targets

---

*This PRD will be updated as requirements evolve and new insights are gathered during development.*`;

// Mock task templates
const MOCK_TASK_TEMPLATES = [
  {
    "id": "setup-001",
    "title": "Set up development environment and project structure",
    "description": "Initialize the project with Next.js, configure TypeScript, set up linting, and establish the basic folder structure.",
    "complexity": 3,
    "status": "pending",
    "priority": "high",
    "dependencies": [],
    "estimatedHours": 8,
    "category": "infrastructure"
  },
  {
    "id": "auth-001",
    "title": "Implement user authentication system",
    "description": "Set up NextAuth.js with GitHub OAuth, implement login/logout functionality, and create protected routes.",
    "complexity": 6,
    "status": "pending",
    "priority": "high",
    "dependencies": ["setup-001"],
    "estimatedHours": 16,
    "category": "backend"
  },
  {
    "id": "ui-001",
    "title": "Create base UI components and design system",
    "description": "Develop reusable UI components using Tailwind CSS, establish design tokens, and create a component library.",
    "complexity": 5,
    "status": "pending",
    "priority": "medium",
    "dependencies": ["setup-001"],
    "estimatedHours": 12,
    "category": "frontend"
  },
  {
    "id": "db-001",
    "title": "Design and implement database schema",
    "description": "Create database schema design, set up Prisma ORM, implement migrations, and seed initial data.",
    "complexity": 7,
    "status": "pending",
    "priority": "high",
    "dependencies": ["setup-001"],
    "estimatedHours": 20,
    "category": "backend"
  },
  {
    "id": "api-001",
    "title": "Build core API endpoints",
    "description": "Implement RESTful API endpoints for CRUD operations, add input validation, and set up error handling.",
    "complexity": 8,
    "status": "pending",
    "priority": "high",
    "dependencies": ["auth-001", "db-001"],
    "estimatedHours": 24,
    "category": "backend"
  },
  {
    "id": "frontend-001",
    "title": "Develop main application pages",
    "description": "Create dashboard, profile, and settings pages with responsive design and proper navigation.",
    "complexity": 6,
    "status": "pending",
    "priority": "medium",
    "dependencies": ["ui-001", "api-001"],
    "estimatedHours": 18,
    "category": "frontend"
  },
  {
    "id": "integration-001",
    "title": "Implement third-party integrations",
    "description": "Add integrations with external services, implement webhook handling, and create sync mechanisms.",
    "complexity": 7,
    "status": "pending",
    "priority": "medium",
    "dependencies": ["api-001"],
    "estimatedHours": 16,
    "category": "backend"
  },
  {
    "id": "testing-001",
    "title": "Set up testing framework and write tests",
    "description": "Configure Jest and React Testing Library, write unit tests for components and API endpoints.",
    "complexity": 5,
    "status": "pending",
    "priority": "medium",
    "dependencies": ["frontend-001", "api-001"],
    "estimatedHours": 20,
    "category": "testing"
  },
  {
    "id": "security-001",
    "title": "Implement security measures and audit",
    "description": "Add CSRF protection, input sanitization, rate limiting, and conduct security review.",
    "complexity": 6,
    "status": "pending",
    "priority": "high",
    "dependencies": ["api-001"],
    "estimatedHours": 14,
    "category": "backend"
  },
  {
    "id": "deployment-001",
    "title": "Set up CI/CD pipeline and deployment",
    "description": "Configure GitHub Actions, set up staging and production environments, implement automated deployment.",
    "complexity": 7,
    "status": "pending",
    "priority": "medium",
    "dependencies": ["testing-001"],
    "estimatedHours": 16,
    "category": "infrastructure"
  },
  {
    "id": "monitoring-001",
    "title": "Implement monitoring and analytics",
    "description": "Set up application monitoring, error tracking, performance metrics, and user analytics.",
    "complexity": 5,
    "status": "pending",
    "priority": "low",
    "dependencies": ["deployment-001"],
    "estimatedHours": 12,
    "category": "infrastructure"
  },
  {
    "id": "docs-001",
    "title": "Create documentation and user guides",
    "description": "Write API documentation, user guides, deployment instructions, and developer onboarding materials.",
    "complexity": 4,
    "status": "pending",
    "priority": "low",
    "dependencies": ["deployment-001"],
    "estimatedHours": 16,
    "category": "design"
  }
];

/**
 * Extracts project details from context items to personalize mock responses
 */
function extractProjectContext(contextItems: ContextItem[]) {
  const projectName = contextItems.find(item => 
    item.title.toLowerCase().includes('project') || 
    item.title.toLowerCase().includes('name')
  )?.title || 'Project Management Platform';

  const description = contextItems.find(item => 
    item.category === 'requirement' || 
    item.title.toLowerCase().includes('description')
  )?.contentMd || 'streamline project management and team collaboration';

  const features = contextItems
    .filter(item => item.category === 'feature')
    .map(item => item.title)
    .join(', ') || 'task management, team collaboration, real-time updates';

  return {
    projectName,
    description,
    features,
    problemAreas: 'intuitive interfaces and comprehensive feature sets',
    userPainPoints: 'complex workflows and disconnected tools',
    solutionApproach: 'modern technology and user-centered design',
    coreFeatures: features,
    scaleRequirements: '10,000+ concurrent users',
    coreFunctionality: 'project and task management'
  };
}

/**
 * Generates a mock PRD based on context items
 */
export function generateMockPRD(contextItems: ContextItem[]): string {
  const context = extractProjectContext(contextItems);
  
  let prdContent = MOCK_PRD_TEMPLATE;
  
  // Replace template variables
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{{${key.toUpperCase()}}}`;
    prdContent = prdContent.replaceAll(placeholder, value);
  });

  return prdContent;
}

/**
 * Generates mock tasks based on project context
 */
export function generateMockTasks(projectContext?: string): typeof MOCK_TASK_TEMPLATES {
  // In a real implementation, we might customize tasks based on the project context
  // For now, return the standard template
  return MOCK_TASK_TEMPLATES.map(task => ({
    ...task,
    id: `${task.category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }));
}

/**
 * Simulates streaming response for mock PRD generation
 */
export async function* mockPRDStream(contextItems: ContextItem[]): AsyncGenerator<string, void, unknown> {
  const prdContent = generateMockPRD(contextItems);
  const chunks = prdContent.split(' ');
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = i === chunks.length - 1 ? chunks[i] : chunks[i] + ' ';
    yield chunk;
    
    // Simulate variable delay between chunks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
  }
}

/**
 * Simulates streaming response for mock task generation
 */
export async function* mockTaskStream(prdContent: string): AsyncGenerator<string, void, unknown> {
  const tasks = generateMockTasks(prdContent);
  const tasksJson = JSON.stringify(tasks, null, 2);
  const chunks = tasksJson.split('');
  
  for (let i = 0; i < chunks.length; i++) {
    yield chunks[i];
    
    // Simulate faster streaming for JSON
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
  }
}

/**
 * Check if we should use mock responses (development/testing)
 */
export function shouldUseMocks(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.USE_AI_MOCKS === 'true';
}

/**
 * Mock configuration for different scenarios
 */
export const MOCK_SCENARIOS = {
  SUCCESS: 'success',
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  INVALID_RESPONSE: 'invalid_response',
} as const;

/**
 * Simulate different error scenarios for testing
 */
export function simulateError(scenario: keyof typeof MOCK_SCENARIOS): never {
  switch (scenario) {
    case 'NETWORK_ERROR':
      throw new Error('Network error: Unable to connect to AI service');
    case 'RATE_LIMIT':
      throw new Error('Rate limit exceeded: Too many requests');
    case 'TIMEOUT':
      throw new Error('Request timeout: AI service took too long to respond');
    case 'INVALID_RESPONSE':
      throw new Error('Invalid response: Unable to parse AI response');
    default:
      throw new Error('Unknown error occurred');
  }
}

/**
 * Get mock scenario from environment variable for testing
 */
export function getMockScenario(): string {
  return process.env.MOCK_SCENARIO || MOCK_SCENARIOS.SUCCESS;
}