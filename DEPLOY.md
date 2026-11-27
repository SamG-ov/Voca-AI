# Deploying Voca-AI

How I put Voca-AI online for free on an Oracle Cloud "Always Free" server.

The free server has no GPU, so on the server speech to text goes through Groq's Whisper API instead of running Whisper locally. It's the same Whisper model, it's very fast, and Groq's free plan is more than enough for one person.

Everything runs as one website:

```
phone / browser  --https-->  Caddy (free https certificate)  -->  FastAPI (API + the built React app)
```

## What you need

- An **Oracle Cloud** account (free, but it asks for a card to check you're a real person)
- A **Groq** account and API key: https://console.groq.com/keys
- A free **DuckDNS** subdomain (like `my-voca.duckdns.org`): https://www.duckdns.org
- Your Anthropic API key (the same one as in your local `.env`)

## 1. Create the server

In the Oracle Cloud console: **Compute → Instances → Create instance**

- Image: **Ubuntu 24.04**
- Shape: **Ampere (VM.Standard.A1.Flex)**, 2 OCPUs and 12 GB of memory. It should say "Always Free-eligible".
- Upload your SSH public key (or let Oracle make one and download it)
- Create it and copy the **public IP address**

If it says "Out of capacity", try another availability domain, or try again later. Free ARM servers are popular.

## 2. Open ports 80 and 443

The app needs ports 80 (to get the certificate) and 443 (https).

**In the Oracle console:** open the instance's subnet → Security List → **Add Ingress Rules**:

- Source `0.0.0.0/0`, TCP, destination port `80`
- Source `0.0.0.0/0`, TCP, destination port `443`

**On the server itself** (Oracle's Ubuntu image blocks them with its own firewall too). SSH in first:

```bash
ssh ubuntu@YOUR_SERVER_IP
```

then:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Point a domain at the server

On duckdns.org, create a subdomain and set its IP to the server's public IP. Phones only allow the microphone on https pages, and https needs a domain name.

## 4. Install what the server needs

```bash
sudo apt update
sudo apt install -y git python3-venv

# Node.js, to build the frontend
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Caddy, for https
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 5. Get the code and set it up

```bash
cd ~
git clone https://github.com/SamG-ov/Voca-AI.git
cd Voca-AI

# backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ..

# frontend
cd frontend
npm ci
npm run build
cd ..
```

Only `requirements.txt` is needed on the server. `requirements-local.txt` is for running Whisper on my own GPU.

Then create the `.env` file in the `Voca-AI` folder:

```bash
nano .env
```

```
ANTHROPIC_API_KEY=your-anthropic-key
STT_MODE=groq
GROQ_API_KEY=your-groq-key
APP_PASSWORD=pick-a-password
```

## 6. Run the backend as a service

```bash
sudo cp deploy/voca-ai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now voca-ai
```

Check that it's running:

```bash
sudo systemctl status voca-ai
curl http://127.0.0.1:8000/api/health
```

## 7. Turn on https with Caddy

Copy the Caddyfile and put your DuckDNS name in it:

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy gets the https certificate by itself the first time someone opens the site.

## 8. Try it

Open `https://your-name.duckdns.org` on your phone, enter the password, allow the microphone, and talk.

## Updating after a change

```bash
cd ~/Voca-AI
git pull
cd frontend && npm ci && npm run build && cd ..
backend/.venv/bin/pip install -r backend/requirements.txt
sudo systemctl restart voca-ai
```

## If something goes wrong

- Backend logs: `sudo journalctl -u voca-ai -n 50`
- Caddy logs: `sudo journalctl -u caddy -n 50`
- Site doesn't load at all: check both firewalls from step 2, and that DuckDNS points at the right IP
- "Wrong password" on every try: check `APP_PASSWORD` in `.env`, then `sudo systemctl restart voca-ai`

## What it costs

- Oracle server: free (Always Free)
- DuckDNS and the https certificate: free
- Groq speech to text: free plan
- Claude (the tutor): about half a cent per session, with a $5/month limit set in the Anthropic console
