# Use an official Python image
FROM python:3.10

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Set Flask environment variable (optional)
ENV FLASK_APP=app.py

# Expose port (optional for documentation)
EXPOSE 5000

# Start the app
CMD ["python", "app.py"]
