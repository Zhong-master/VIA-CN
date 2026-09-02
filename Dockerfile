FROM python:3.11-slim
WORKDIR /app
COPY . /app
EXPOSE 8602
CMD ["python3", "-m", "http.server", "8602", "--bind", "0.0.0.0"]
