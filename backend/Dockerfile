FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fix Windows CRLF → Unix LF line endings để script chạy được trên Linux
RUN sed -i 's/\r//' start.sh && chmod +x start.sh

CMD ["./start.sh"]
