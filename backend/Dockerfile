FROM tiangolo/uvicorn-gunicorn:python3.10-slim

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
WORKDIR /backend
COPY . /backend
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
