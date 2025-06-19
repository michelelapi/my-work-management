@echo off
REM --- Wait for Docker to be running ---
echo Checking if Docker is running...
:waitForDocker
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Waiting 5 seconds...
    timeout /t 5 >nul
    goto waitForDocker
)
echo Docker is running!

REM --- Start docker-compose for auth service ---
cd /d "%~dp0docker"
echo Starting docker-compose for auth service...
docker compose -f docker-compose.auth.yml up -d

echo Starting docker-compose for company db service...
docker compose -f docker-compose.db.yml up -d

REM --- Wait for auth-service-db container to be healthy ---
echo Waiting for 'auth-service-db' container to be healthy...
:waitForAuthDb
docker inspect --format="{{.State.Health.Status}}" auth-service-db 2>nul | findstr /i "healthy" >nul
if errorlevel 1 (
    echo auth-service-db is not healthy yet. Waiting 5 seconds...
    timeout /t 5 >nul
    goto waitForAuthDb
)
echo auth-service-db is healthy!

REM --- Wait for company-service-db container to be healthy ---
echo Waiting for 'company-service-db' container to be healthy...
:waitForCompanyDb
docker inspect --format="{{.State.Health.Status}}" company-service-db 2>nul | findstr /i "healthy" >nul
if errorlevel 1 (
    echo company-service-db is not healthy yet. Waiting 5 seconds...
    timeout /t 5 >nul
    goto waitForCompanyDb
)
echo company-service-db is healthy!

REM --- Start Java backend services in background (no new windows) ---
cd /d "%~dp0backend\company-service"
echo Starting company-service backend...
start /b cmd /c "call ..\mvnw.cmd spring-boot:run"
cd /d "%~dp0backend\auth-service"
echo Starting auth-service backend...
start /b cmd /c "call ..\mvnw.cmd spring-boot:run"

REM --- Start React frontend in background (no new window) ---
cd /d "%~dp0frontend"
echo Starting React frontend...
start /b cmd /c "npm start"

REM --- Continue with your next steps here ---
echo All done! Both DB containers are up and healthy, backend services and frontend are starting (in background, no new windows).
pause 