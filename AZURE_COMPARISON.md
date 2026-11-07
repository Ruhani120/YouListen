# YouListen — Azure Comparison

> This document explains how the YouListen cloud architecture could be re-implemented on Microsoft Azure instead of AWS. AWS remains the primary implementation platform.

---

## Service Mapping Table

| AWS Service | Azure Equivalent | Purpose in YouListen |
|-------------|-----------------|----------------------|
| **S3** | Azure Blob Storage | Store uploaded Spotify CSV/JSON files, export reports, generated playlists |
| **RDS (PostgreSQL)** | Azure Database for PostgreSQL - Flexible Server | Managed PostgreSQL — users, playlists, songs, transfer jobs |
| **ECS / Fargate** | Azure Container Apps | Run Spring Boot API + background worker containers |
| **ECR** | Azure Container Registry (ACR) | Store Docker images for API and worker |
| **Lambda** | Azure Functions | Event-driven upload validation; cleanup tasks |
| **SQS** | Azure Service Bus (Queues) | Async transfer job queue; dead-letter queue |
| **SNS** | Azure Event Grid / Service Bus Topics | Transfer completion and failure notifications |
| **API Gateway** | Azure API Management (APIM) | Managed API entry, rate limiting, auth |
| **VPC** | Azure Virtual Network (VNet) | Isolated network; public + private subnets |
| **CloudWatch** | Azure Monitor + Log Analytics | Application logs, metrics, alarms |
| **EventBridge** | Azure Logic Apps / Function triggers | Scheduled cleanup, sync jobs |
| **IAM** | Azure Active Directory + Managed Identity | Role-based access; no hardcoded credentials |
| **Secrets Manager** | Azure Key Vault | Database credentials, JWT secret, API keys |
| **Route 53** | Azure DNS | Custom domain routing |
| **ACM (Certificates)** | Azure App Service Managed Certificates | TLS/SSL for HTTPS |
| **EC2** | Azure Virtual Machines | General compute (if not using containers) |
| **EBS** | Azure Managed Disks | Block storage for VM instances |
| **Elastic Beanstalk** | Azure App Service | PaaS application hosting (alternative to containers) |

---

## Architecture Comparison

### AWS Architecture (Primary)

```
Internet
    │
    ▼
[Route 53] → [ALB]
                │
        ┌───────┴────────┐
        ▼                ▼
  [ECS/Fargate]    [API Gateway]
  Spring Boot API       │
        │          [Lambda]
        ▼         (upload trigger)
  [RDS PostgreSQL]      │
  [SQS Queue]    ◄──────┘
        │
        ▼
  [ECS Worker]
  (SQS consumer)
        │
     [S3] [SNS] [CloudWatch]
```

### Azure Architecture (Comparative)

```
Internet
    │
    ▼
[Azure DNS] → [Application Gateway / Front Door]
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
         [Azure Container Apps]   [Azure API Management]
         Spring Boot API                 │
                    │            [Azure Functions]
                    ▼           (Blob trigger)
         [Azure DB PostgreSQL]           │
         [Service Bus Queue]    ◄────────┘
                    │
                    ▼
         [Container App Worker]
         (Service Bus consumer)
                    │
       [Blob Storage] [Event Grid] [Azure Monitor]
```

---

## Detailed Service Comparison

### Object Storage: S3 vs Azure Blob Storage

| Feature | AWS S3 | Azure Blob Storage |
|---------|--------|--------------------|
| Pre-signed URLs | ✅ Yes | ✅ Yes (SAS tokens) |
| Versioning | ✅ Yes | ✅ Yes |
| Lifecycle rules | ✅ Yes | ✅ Yes |
| Event triggers | S3 → Lambda | Blob trigger → Azure Function |
| SDK | AWS SDK v2 | Azure SDK for Java |
| Free tier | 5GB free | 5GB free (LRS) |

**YouListen usage:** Uploaded Spotify CSV/JSON files are stored here. Pre-signed URLs let the backend generate temporary secure links for file access without exposing storage credentials.

---

### Message Queue: SQS vs Azure Service Bus

| Feature | AWS SQS | Azure Service Bus |
|---------|---------|-------------------|
| Standard queue | ✅ | ✅ |
| FIFO queue | ✅ | ✅ (Sessions) |
| Dead-letter queue | ✅ Automatic | ✅ Automatic |
| Visibility timeout | ✅ | ✅ (Lock duration) |
| Message retention | Up to 14 days | Up to 14 days |
| Java SDK | AWS SDK SQS | Azure Service Bus Java SDK |

**YouListen usage:** When a user clicks "Start Transfer", a message is published to the queue. A background worker container consumes it and processes the YouTube API calls asynchronously.

---

### Serverless Compute: Lambda vs Azure Functions

| Feature | AWS Lambda | Azure Functions |
|---------|-----------|-----------------|
| Trigger types | S3, SQS, API GW, EventBridge | Blob, Service Bus, HTTP, Timer |
| Cold start | Moderate | Moderate |
| Java support | ✅ | ✅ |
| Max execution | 15 min | 10 min (Consumption) / Unlimited (Premium) |

**YouListen usage:**
- AWS Lambda: Triggered when a file lands in S3. Validates the CSV/JSON format and publishes a parse job to SQS.
- Azure Function equivalent: Blob trigger fires on upload, same validation logic.

---

### Container Orchestration: ECS Fargate vs Azure Container Apps

| Feature | AWS ECS Fargate | Azure Container Apps |
|---------|-----------------|----------------------|
| Serverless containers | ✅ | ✅ |
| Auto-scaling | ✅ (SQS backlog) | ✅ (KEDA — Service Bus) |
| No cluster management | ✅ | ✅ |
| Private networking | VPC + Security Groups | VNet + NSG |
| Cost model | vCPU + memory per second | vCPU + memory per second |

**YouListen usage:** The Spring Boot API and the background transfer worker run as separate container services. They scale independently — the worker scales based on queue depth.

---

### Monitoring: CloudWatch vs Azure Monitor

| Feature | AWS CloudWatch | Azure Monitor |
|---------|---------------|---------------|
| Application logs | Log Groups / Streams | Log Analytics Workspace |
| Metrics | CloudWatch Metrics | Azure Metrics |
| Alarms | CloudWatch Alarms | Azure Alerts |
| Dashboards | CloudWatch Dashboards | Azure Dashboards / Workbooks |
| Log queries | CloudWatch Logs Insights | Kusto Query Language (KQL) |

**YouListen usage:** Monitor transfer job success/failure rates, API response times, error counts. Alert when failure rate exceeds 10%.

---

### Managed Identity: IAM vs Azure AD Managed Identity

| Feature | AWS IAM | Azure Managed Identity |
|---------|---------|----------------------|
| No hardcoded credentials | IAM Task Roles | Managed Identity |
| Fine-grained policies | IAM Policies | Azure RBAC |
| Secret storage | Secrets Manager | Key Vault |

---

## YouListen on Azure — Implementation Notes

### What would change

1. **Spring Boot configuration**: Swap AWS SDK dependencies for Azure SDK. Use `azure-spring-cloud-starter` modules.
2. **File storage**: Replace `software.amazon.awssdk:s3` with `com.azure:azure-storage-blob`.
3. **Queue**: Replace `software.amazon.awssdk:sqs` with `com.azure.spring:spring-cloud-azure-starter-servicebus`.
4. **Secrets**: Replace Secrets Manager calls with Azure Key Vault references.
5. **Terraform**: Azure uses `azurerm` Terraform provider instead of `aws`.

### What stays the same

- PostgreSQL schema (identical)
- Spring Boot application logic
- Docker containers
- React frontend
- JWT authentication
- YouTube Data API integration
- Song matching algorithm

---

## Academic Summary

Both AWS and Azure provide equivalent services for every component of the YouListen architecture. The key architectural patterns — containerized microservices, message-driven async processing, managed database, object storage, serverless event handling — are supported identically on both platforms.

**AWS advantages for this project:**
- Wider free-tier coverage (Lambda, SQS, S3 free tier)
- More extensive documentation and tutorials
- SQS-based ECS autoscaling is well-documented
- Industry-leading market share

**Azure advantages:**
- Better GitHub Actions integration
- Azure Student credits via university
- Azure Container Apps simpler than ECS for beginners
- Key Vault tightly integrated with Entra ID
