# YouListen — AWS Production Deployment Guide

## Overview

This guide describes how the production version of YouListen deploys to Amazon Web Services (AWS) using infrastructure-as-code (Terraform) and container orchestration (Amazon ECS Fargate).

---

## AWS Architecture Topology

```
Internet
    │
    ▼
[Route 53 DNS]
    │
    ▼
[Application Load Balancer] (Public Subnet)
    │
    ├───► /api/* ───► [ECS Fargate Service: Backend API] (Private Subnet)
    │                       │
    │                       ├───► [RDS PostgreSQL: harmonysync] (Private Subnet)
    │                       ├───► [S3 Bucket: youlisten-uploads]
    │                       └───► [SQS Queue: youlisten-transfers]
    │                                     │
    │                                     ▼
    │                             [ECS Fargate Worker] (Private Subnet)
    │                                     │
    │                                     ├───► [RDS PostgreSQL]
    │                                     └───► [YouTube Data API v3]
    │
    └───► /* ──────► [S3 Static Bucket + CloudFront CDN] (Frontend)
```

---

## Prerequisites

1. AWS CLI installed and configured: `aws configure`
2. Docker Desktop running with access to Amazon ECR
3. Terraform CLI v1.5+
4. Domain name registered in Route 53 with ACM SSL Certificate

---

## Step 1: ECR Image Creation & Push

Run the following commands using Windows CMD:

```cmd
REM 1. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com

REM 2. Create ECR repositories if not already provisioned
aws ecr create-repository --repository-name youlisten-backend --region eu-west-1
aws ecr create-repository --repository-name youlisten-frontend --region eu-west-1

REM 3. Build and tag the backend image
cd C:\Users\3910r\.gemini\antigravity\scratch\youlisten\backend
docker build -t youlisten-backend .
docker tag youlisten-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/youlisten-backend:latest

REM 4. Push backend image to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/youlisten-backend:latest

REM 5. Build and push frontend image
cd C:\Users\3910r\.gemini\antigravity\scratch\youlisten\frontend
docker build -t youlisten-frontend .
docker tag youlisten-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/youlisten-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/youlisten-frontend:latest
```

---

## Step 2: Infrastructure as Code (Terraform)

Located in `infra/aws/`:

```cmd
cd C:\Users\3910r\.gemini\antigravity\scratch\youlisten\infra\aws

REM 1. Initialize Terraform providers
terraform init

REM 2. Validate configuration
terraform validate

REM 3. Preview planned resources (No changes made yet)
terraform plan
```

> **Note**: As per safety instructions, `terraform apply` should only be executed upon explicit review and approval.

---

## Step 3: Production Secrets Configuration

Secrets are stored in AWS Secrets Manager under secret ID `youlisten/production/secrets`:

```json
{
  "DB_USERNAME": "youlisten_admin",
  "DB_PASSWORD": "<generated-high-entropy-password>",
  "JWT_SECRET": "<generated-256-bit-key>",
  "GOOGLE_CLIENT_ID": "<from-gcp-console>",
  "GOOGLE_CLIENT_SECRET": "<from-gcp-console>"
}
```

ECS Task Definitions reference these secrets directly via IAM Task Execution Role without exposing plaintext values.

---

## Step 4: Health Verification & Rollback

Once tasks are healthy in ECS:
1. Verify API status: `curl https://api.youlisten.example.com/actuator/health`
2. Inspect CloudWatch logs:
   ```cmd
   aws logs tail /ecs/youlisten-backend --follow
   ```
3. In case of unexpected container failures, ECS automatically maintains the previous task definition revision and aborts deployment.
