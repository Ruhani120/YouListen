# Deploying YouListen on AWS (EC2 + RDS)

About 1 to 1.5 hours the first time. Running 24/7 costs roughly $40 a month, paid from your AWS credits. Delete everything when you are done (last section).

The stack: one EC2 server running three containers (Caddy for HTTPS, the React app, the Spring Boot API) and a managed PostgreSQL database on RDS.

## 0. Before you start (5 minutes)

1. Billing and Cost Management, Budgets, Create budget (use the simple template), monthly cost budget of 20 USD, your email. This alerts you if spending climbs, and creating a budget is one of the onboarding tasks that earns extra credit.
2. Pick one region in the top-right selector, for example Asia Pacific (Mumbai) `ap-south-1`, and use it for everything below.
3. Do not click "Upgrade to paid plan". On the Free plan, AWS will not charge you.

## 1. Launch the server (EC2)

EC2, Launch instance:
- Name: `youlisten-app`
- Image: Ubuntu Server 24.04 LTS
- Instance type: `t3.small` (look for the "Free tier eligible" label). 1 GB is too small for the Java app plus builds.
- Key pair: Create new, name `youlisten-key`, RSA, `.pem`. Keep the downloaded file private and never put it in git.
- Network settings, Edit, create a security group `youlisten-web` with three rules:
  - SSH, port 22, source: My IP
  - HTTP, port 80, source: Anywhere
  - HTTPS, port 443, source: Anywhere
- Storage: 20 GiB, gp3.

## 2. Give it a fixed address

EC2, Elastic IPs, Allocate Elastic IP address, then Associate it with `youlisten-app`.
A public IPv4 address costs about $0.005 per hour (about $3.60 a month). Release it when you finish.

## 3. Free domain name (DuckDNS)

Spotify and Google only accept `https://` redirect addresses outside localhost, so you need a name.
1. Go to duckdns.org, sign in, add a subdomain such as `youlisten`.
2. Set its "current ip" to your Elastic IP and click update.
3. Your `DOMAIN` is `youlisten.duckdns.org`. Check from your PC: `nslookup youlisten.duckdns.org` should show the Elastic IP.

## 4. Database (RDS)

RDS, Create database, Standard create:
- Engine: PostgreSQL 16
- Template: Free tier, or Dev/Test if that is what is offered
- DB instance identifier: `youlisten-db`
- Master username: `youlisten`, and a password you save (letters and numbers only keeps it simple)
- Instance class: Burstable, `db.t4g.micro`
- Storage: gp3, 20 GiB, untick "storage autoscaling"
- Connectivity: choose "Connect to an EC2 compute resource" and pick `youlisten-app`. AWS then opens the database to that server only.
- Public access: No
- Additional configuration: Initial database name `harmonysync`, backup retention 1 day, untick Performance Insights and Enhanced Monitoring
- Multi-AZ: do not create a standby (it doubles the cost)

It takes 10 to 20 minutes. When it is ready, copy the Endpoint from the database page.

## 5. Connect to the server (Windows PowerShell)

```
cd C:\path\to\folder\with\the\pem
icacls .\youlisten-key.pem /inheritance:r
icacls .\youlisten-key.pem /grant:r "$($env:USERNAME):(R)"
ssh -i .\youlisten-key.pem ubuntu@YOUR-ELASTIC-IP
```

## 6. Get the code onto the server

Easiest: push the project to a private GitHub repo (the `.gitignore` keeps secrets out), then on the server:
```
sudo apt-get update && sudo apt-get install -y git
git clone https://YOUR-TOKEN@github.com/YOUR-USER/YOUR-REPO.git youlisten
cd youlisten
```
(YOUR-TOKEN is a GitHub fine-grained token with read-only access to that one repository.)

Alternative without GitHub: zip the project on your PC without `node_modules`, `target` and `.git`, then `scp -i .\youlisten-key.pem youlisten.zip ubuntu@YOUR-ELASTIC-IP:~/` and `unzip youlisten.zip -d youlisten` on the server.

## 7. Install Docker (once)

```
bash deploy/ec2-setup.sh
exit
```
Then connect again with the same `ssh` command and `cd youlisten`.

## 8. Fill in the settings

```
cp .env.prod.example .env
nano .env
```
Set `DOMAIN`, `DB_HOST` (the RDS endpoint), `DB_PASSWORD`, the Spotify and Google values, and generate the two secrets with `openssl rand -base64 48` (JWT_SECRET) and any 16+ character string (SPOTIFY_TOKEN_ENCRYPTION_KEY). Avoid `$` and quotes in values.

## 9. Start it

```
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```
The first build takes 10 to 15 minutes. Wait until `backend` shows healthy, then open `https://YOUR-DOMAIN` and register an account.

## 10. Update Spotify and Google

- Spotify dashboard, your app, Settings, Redirect URIs: add `https://YOUR-DOMAIN/api/spotify/callback`
- Google Cloud, your OAuth client, Authorised redirect URIs: add `https://YOUR-DOMAIN/api/google/callback`

Then open Connections in the app and connect both again. Keep your localhost addresses in the lists too, so local development still works.

## Updating the app later

```
cd ~/youlisten && git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## If something goes wrong

- Page does not open or the certificate fails: DNS is not pointing to the Elastic IP yet, or ports 80 and 443 are not open in the security group. Check `docker compose -f docker-compose.prod.yml logs caddy`.
- Backend cannot reach the database (timeout): the RDS security group must allow the EC2 server (step 4 does this), and `DB_HOST` must be the exact endpoint.
- "Password authentication failed": `DB_PASSWORD` does not match the RDS master password.
- Build killed or out of memory: check `free -h` shows the 2 GB swap, then run the build again.
- Google refuses the redirect address: some free domains may not be accepted. Tell me and we will switch domain.

## When you are finished (important for your credits)

1. EC2, terminate `youlisten-app`.
2. RDS, delete `youlisten-db` (skip the final snapshot). Do not just stop it: a stopped RDS database restarts itself after 7 days.
3. EC2, Elastic IPs, release the address.
4. EC2, Volumes and Snapshots: delete anything left over.
5. Check Billing, Bills the next day.
