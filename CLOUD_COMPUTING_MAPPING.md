# YouListen — Cloud Computing Mapping

> This document maps every part of the YouListen application to formal Cloud Computing concepts from the academic syllabus.

---

## 1. Cloud Service Models

### IaaS — Infrastructure as a Service

**What it means:** You rent raw computing infrastructure — servers, storage, networking — from a provider. You manage the OS, runtime, and application.

**Where YouListen uses it:**
- **EC2**: Virtual machine option for running the Spring Boot API or background worker directly on a managed VM
- **EBS**: Block storage attached to EC2 instances for database backups
- **VPC**: The entire private network for YouListen is IaaS — subnets, routing tables, security groups are all infrastructure you configure

**What you can demonstrate:** Launch an EC2 instance, SSH into it, manually run the Spring Boot JAR. Show the difference between managing your own server vs Fargate (serverless).

**Why YouListen needs it:** VPC networking is fundamental — the RDS database must only be reachable inside the private subnet, not publicly accessible.

---

### PaaS — Platform as a Service

**What it means:** The cloud provider manages the OS, runtime, and middleware. You just deploy your code.

**Where YouListen uses it:**
- **RDS (PostgreSQL)**: AWS manages backups, patching, failover. YouListen just connects to the endpoint.
- **Elastic Beanstalk**: An alternative PaaS deployment for the Spring Boot backend — upload the JAR, Beanstalk handles EC2, load balancer, auto-scaling.
- **ECS/Fargate**: Serverless container platform — AWS manages the underlying servers.
- **Lambda**: The ultimate PaaS — submit a function, the platform handles everything else.

**What you can demonstrate:** Deploy the Spring Boot backend to Elastic Beanstalk with a single CLI command. Compare vs managing EC2 manually.

**Why YouListen needs it:** RDS eliminates DBA work for a student project. It provides automated backups, encryption at rest, and Multi-AZ failover — features that would take weeks to build manually.

---

### SaaS — Software as a Service

**What it means:** A complete application delivered over the internet — no installation, no infrastructure management.

**Where YouListen uses it:**
- **YouListen itself is a SaaS product** — users access it through a browser with no local installation
- **YouTube Data API v3**: Google's SaaS developer offering — the entire YouTube platform consumed as an API
- **Spotify export**: Spotify is a SaaS music platform; YouListen consumes its exported data

**What you can demonstrate:** A registered user opens https://youlisten.example.com, imports a playlist, and starts a transfer — entirely through a browser. No local software needed.

---

## 2. NIST Cloud Characteristics

The National Institute of Standards and Technology defines five essential characteristics of cloud computing. YouListen demonstrates all five.

### On-Demand Self-Service
**Definition:** A consumer can provision computing capabilities automatically without human interaction with each service provider.

**YouListen:** A user registers at 2 AM, connects their Google account, and starts a 500-track playlist transfer — zero human involvement from the YouListen team.

---

### Broad Network Access
**Definition:** Capabilities are available over the network and accessed through standard mechanisms.

**YouListen:** The React frontend is accessible from any browser (desktop, mobile, tablet) over HTTPS. The REST API uses standard HTTP/JSON — the same protocol as any web service.

---

### Resource Pooling
**Definition:** Provider resources are pooled to serve multiple consumers using a multi-tenant model.

**YouListen:** RDS PostgreSQL is a shared managed service — AWS manages the underlying hardware for thousands of customers. ECS Fargate runs containers on shared server infrastructure. YouListen's data is logically isolated (every database query filters by `user_id`) while physically sharing hardware.

---

### Rapid Elasticity
**Definition:** Capabilities can be elastically provisioned and released to scale rapidly with demand.

**YouListen:** The background worker container on ECS scales out when the SQS queue depth increases (many transfers queued simultaneously) and scales back to 1 instance during low activity. This happens automatically via ECS Service Auto Scaling with an SQS-based metric.

---

### Measured Service
**Definition:** Cloud systems automatically control and optimize resource use by leveraging metering capability.

**YouListen:** AWS CloudWatch collects CPU, memory, request count, and queue depth metrics. ECS charges per vCPU-second used. YouListen only pays for actual transfer processing time.

---

## 3. Deployment Models

### Public Cloud
**YouListen production** runs entirely on AWS public cloud. All infrastructure is owned and operated by AWS, accessed over the internet.

### Hybrid Cloud
**YouListen development** uses a hybrid model: local Docker containers run PostgreSQL and the application, while production uses AWS managed services. The same Docker image runs locally and in ECS.

### Private/Community Cloud
Not used by YouListen. Would apply if running the application inside a university data centre.

---

## 4. AWS Service Deep Dive

### EC2 — Elastic Compute Cloud

**What it means:** Virtual machines in the cloud. Choose CPU, memory, OS. Pay per hour.

**YouListen usage:** Optional manual deployment option for the Spring Boot API. During academic demonstration, you can show launching an EC2 instance (`t3.micro` free tier) and running the backend JAR.

**Demonstration:** 
```
aws ec2 run-instances --image-id ami-0abcdef... --instance-type t3.micro
ssh ec2-user@<public-ip>
java -jar youlisten-api.jar
```

**Why needed:** Foundational IaaS service. Understanding EC2 is essential before understanding ECS/Fargate (which abstracts EC2 management).

---

### S3 — Simple Storage Service

**What it means:** Infinitely scalable object storage. Store files (objects) in containers (buckets). Access via HTTP URLs or SDK.

**YouListen usage:**
- Users upload a Spotify CSV export → stored in `s3://youlisten-uploads/{userId}/{uploadId}.csv`
- Generated transfer reports stored in `s3://youlisten-reports/{userId}/{jobId}.json`
- Pre-signed URLs let the backend give users temporary (15-minute) download links without exposing AWS credentials
- Server-side encryption (SSE-S3) on all objects

**Demonstration:** Upload a Spotify CSV, show the S3 object in the console, generate a pre-signed URL and download it.

**Why needed:** Files cannot be stored inside a Docker container (they disappear when the container restarts). S3 provides durable, persistent file storage with 99.999999999% durability.

---

### Lambda

**What it means:** Run code without managing servers. Functions execute in response to events. You pay only for execution time (milliseconds).

**YouListen usage:**
- S3 trigger: When a CSV/JSON lands in the uploads bucket, Lambda immediately validates the file format and publishes a parse job to SQS
- EventBridge trigger: Scheduled daily cleanup function removes orphaned import files older than 30 days
- Lightweight — these functions are ~50 lines of Java or Python, not full Spring Boot applications

**Demonstration:** Show the Lambda function in AWS Console, trigger it by uploading a test CSV, see the SQS message appear.

**Why needed:** Avoids keeping a server running just to react to file uploads. Cost is effectively zero for student usage volume.

---

### EBS — Elastic Block Store

**What it means:** Persistent block storage volumes for EC2 instances — like a virtual hard drive.

**YouListen usage:** When running the backend on EC2 (not Fargate), the application logs and temporary files land on an EBS volume. RDS also uses EBS under the hood for database storage.

**Academic mapping:** Demonstrates the difference between block storage (EBS — structured, low-latency) and object storage (S3 — unstructured, HTTP-accessible).

---

### SQS — Simple Queue Service

**What it means:** Fully managed message queue. Producers write messages; consumers read and process them independently.

**YouListen usage:**
- When a user starts a transfer, the API writes one message to the `youlisten-transfer-queue`
- The background worker container reads that message, processes each track (YouTube search → match → add to playlist)
- If the worker crashes mid-transfer, the message reappears after the visibility timeout and is retried
- After 3 failed attempts, the message moves to the dead-letter queue (DLQ) for investigation

**Demonstration:** Use AWS Console to view the queue, manually send a test message, watch the worker consume it.

**Why needed:** Decouples the API (which should respond in <200ms) from slow transfer processing (which takes 2–10 minutes). Without SQS, the API would time out during transfers.

---

### SNS — Simple Notification Service

**What it means:** Publish-subscribe messaging. One publisher sends to a topic; multiple subscribers receive the message.

**YouListen usage:**
- When a transfer completes, the worker publishes to `youlisten-transfers-topic`
- SNS delivers to: (1) an SQS queue that creates a database notification record, (2) an email subscription (future)
- Transfer failure notifications go to a separate `youlisten-failures-topic`

**Academic mapping:** SNS (pub/sub) + SQS (queue) together implement the fan-out pattern — a completed transfer triggers multiple downstream actions simultaneously.

---

### VPC — Virtual Private Cloud

**What it means:** Your own private network inside AWS. Control IP address ranges, subnets, routing, firewalls.

**YouListen VPC design:**
```
VPC: 10.0.0.0/16
├── Public Subnet 1 (10.0.1.0/24)  — ALB, NAT Gateway
├── Public Subnet 2 (10.0.2.0/24)  — ALB (second AZ)
├── Private Subnet 1 (10.0.11.0/24) — ECS Tasks (API + Worker)
└── Private Subnet 2 (10.0.12.0/24) — RDS PostgreSQL
```

**Security groups:**
- ALB: Accept 80/443 from internet
- ECS API: Accept 8080 from ALB only
- RDS: Accept 5432 from ECS security group only (database never public)

**Why needed:** The database must never be reachable from the public internet. VPC private subnets + security groups enforce this at the network level.

---

### RDS — Relational Database Service

**What it means:** Managed relational database. AWS handles backups, patching, Multi-AZ failover, monitoring.

**YouListen usage:** The `harmonysync` PostgreSQL database runs on RDS `db.t3.micro` (free tier eligible). Contains all application data: users, playlists, songs, transfer jobs. Flyway migrations run automatically on startup.

**Academic mapping:** Demonstrates the PaaS model — the database is treated as a service, not infrastructure.

---

### DynamoDB

**What it means:** AWS managed NoSQL key-value and document database. Single-digit millisecond latency at any scale.

**YouListen usage (academic demonstration):** Could store idempotency records for transfer jobs — a simple key-value table: `{jobId: "...", processedAt: "..."}` to prevent double-processing if a worker restarts. This demonstrates when to choose NoSQL (simple lookups, high speed) vs PostgreSQL (relational data, complex queries).

---

### EMR — Elastic MapReduce

**What it means:** Managed big data platform. Run Apache Spark, Hadoop, Hive jobs on a cluster of EC2 instances.

**YouListen academic usage:** Could demonstrate analytics processing — running a Spark job on the full transfer history dataset to compute aggregated statistics (most popular artists transferred, peak transfer hours, platform match rates). Demonstrates big data processing in the cloud.

---

### Elastic Beanstalk

**What it means:** PaaS for deploying applications. Upload your code/JAR; Beanstalk handles EC2, load balancer, auto-scaling, deployments.

**YouListen usage (alternative deployment):** Upload the Spring Boot JAR to Elastic Beanstalk — a simpler alternative to ECS for deployment. Demonstrates the PaaS abstraction layer.

---

### API Gateway

**What it means:** Fully managed service to create, publish, and secure REST, HTTP, and WebSocket APIs.

**YouListen usage:**
- Acts as the front door for the backend API
- Routes `/api/**` requests to the ECS Spring Boot container
- Handles CORS at the gateway level
- Enables request throttling (100 requests/second per user)
- Can cache responses for read-heavy endpoints

**Academic mapping:** Demonstrates the API Economy — the entire YouListen backend is consumed through a managed, documented, versioned API.

---

### CloudWatch

**What it means:** AWS monitoring and observability service. Logs, metrics, dashboards, alarms.

**YouListen usage:**
- Spring Boot logs shipped to CloudWatch Log Group `/youlisten/api`
- Worker logs in `/youlisten/worker`
- Metrics: `TransferSuccessRate`, `SQSQueueDepth`, `APIResponseTime`
- Alarm: Alert if `TransferFailureRate > 10%` over 5 minutes
- Dashboard: Live view of active transfers, queue depth, error rate

**Demonstration:** Show the CloudWatch dashboard during a live transfer — watch the queue depth drop as the worker processes jobs.

---

## 5. Architectural Patterns

### Microservices
**Definition:** Small, independently deployable services each responsible for one business capability.

**YouListen architecture:**
- API Service: Handles user requests (playlist CRUD, auth, transfer initiation)
- Worker Service: Processes transfers (YouTube search, playlist creation)
- Both run as separate ECS services that can be deployed and scaled independently

---

### Containerization
**Definition:** Package application and dependencies into a portable container image.

**YouListen:** Both API and worker are packaged as Docker images. The same image runs locally (Docker Compose) and in production (ECS Fargate). No "works on my machine" problems.

---

### Serverless
**Definition:** Run code without managing servers. Scale to zero when not in use.

**YouListen:** Lambda functions for file validation and scheduled cleanup. SQS + ECS worker is "serverless-adjacent" — Fargate manages the underlying servers.

---

### Event-Driven Computing
**Definition:** System components communicate through events rather than direct calls.

**YouListen event flow:**
```
File upload → S3 Event → Lambda (validate) → SQS message → Worker (process) → SNS event → Notification
```
No component calls another directly. Each reacts to events.

---

### Scalability and Elasticity

**Horizontal scaling (YouListen):** ECS scales the worker from 1 to N container instances based on SQS queue depth. Each instance independently processes transfer jobs.

**Vertical scaling:** RDS can be scaled to a larger instance type without changing application code.

**Demonstration:** Queue 50 transfer jobs simultaneously, watch ECS scale to 5 worker instances, then scale back to 1 when the queue empties.

---

### Fault Tolerance and High Availability

| Component | HA Mechanism |
|-----------|-------------|
| RDS | Multi-AZ automatic failover |
| ECS | Multiple tasks across two AZs |
| ALB | Routes around failed containers |
| SQS | Message visibility timeout — failed jobs retry |
| DLQ | Captures permanently failed jobs for investigation |

---

### Security — IAM

**Principle of least privilege in YouListen:**

| Component | Permissions Granted |
|-----------|-------------------|
| ECS API Task Role | S3 read (uploads bucket), Secrets Manager read |
| ECS Worker Task Role | S3 read/write, SQS receive/delete, SNS publish |
| Lambda Role | S3 read (trigger only), SQS send |
| RDS | No IAM — connection via username/password from Secrets Manager |

No IAM user access keys used anywhere in production. Credentials rotate automatically via Secrets Manager.

---

## 6. Summary Table

| Concept | YouListen Implementation | Demonstration |
|---------|-------------------------|---------------|
| IaaS | VPC, EC2 (optional), EBS | Launch EC2, run app manually |
| PaaS | RDS, ECS Fargate, Lambda, Beanstalk | Deploy Spring Boot to Beanstalk |
| SaaS | YouListen is SaaS; uses YouTube API | Register, import, transfer via browser |
| NIST: On-demand | Auto user registration + transfer start | Register at midnight, no human involved |
| NIST: Broad access | Web browser on any device | Demo on phone browser |
| NIST: Resource pooling | Shared RDS, shared Fargate hardware | Multi-tenant data isolation |
| NIST: Elasticity | ECS scales on SQS depth | Queue 50 jobs, watch scale-out |
| NIST: Measured | CloudWatch metrics, pay-per-use | Show billing dashboard |
| Public cloud | AWS production | CloudWatch, ECS Console |
| Hybrid cloud | Local Docker + AWS | Same image locally and in ECS |
| EC2 | Alternative backend host | SSH + jar deployment |
| S3 | File storage, pre-signed URLs | Upload CSV, show S3 object |
| Lambda | Upload validation, cleanup | Show trigger, see SQS message |
| EBS | EC2 / RDS block storage | Automatic via RDS |
| SQS | Transfer job queue | Manual message, watch worker |
| SNS | Transfer complete notification | Show topic → subscription |
| VPC | Private network, DB isolation | Console network diagram |
| RDS | Managed PostgreSQL | Automated backup, failover |
| DynamoDB | Idempotency store (academic demo) | Simple KV lookup |
| EMR | Analytics batch job (academic demo) | Spark on transfer history |
| Beanstalk | Alternative PaaS deployment | Upload JAR, app starts |
| API Gateway | Managed API entry point | Throttling, CORS, routes |
| CloudWatch | Monitoring + alarms | Live dashboard during transfer |
| APIs | REST API consumed by frontend | Swagger UI, Postman |
| Microservices | API service + Worker service | Independent scaling |
| Containerization | Docker + ECS | docker compose up |
| Serverless | Lambda, Fargate | Zero server management |
| Event-driven | S3→Lambda→SQS→Worker→SNS | End-to-end event trace |
| Scalability | ECS auto-scaling | Scale-out demonstration |
| Fault tolerance | DLQ, Multi-AZ, retry | Kill worker, job retries |
| High availability | Multi-AZ RDS + ECS | Failover test |
| Security | IAM Task Roles, Secrets Manager | No hardcoded credentials |
