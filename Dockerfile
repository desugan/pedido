FROM python:3.12-alpine

WORKDIR /app

# Install Python dependencies
COPY backend_flask/requirements.txt ./backend_flask/requirements.txt
RUN pip install --no-cache-dir -r backend_flask/requirements.txt

# Copy source code
COPY backend_flask ./backend_flask
COPY frontend ./frontend

EXPOSE 5000

CMD ["python3", "backend_flask/run.py"]
