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

REM --- Stop and remove any existing containers first ---

set "DOCKER_DIR=%~dp0docker"
cd /d "%DOCKER_DIR%"
if not exist "%DOCKER_DIR%" (
    echo Error: Docker directory not found at %DOCKER_DIR%
    pause
    exit /b 1
)
echo Checking for existing auth-service-db and company-service-db containers...

docker ps -a --format "{{.Names}}" | findstr /i "auth-service-db" >nul
if not errorlevel 1 (
    echo Stopping auth-service-db...
    docker stop auth-service-db >nul
    docker rm auth-service-db >nul
)

docker ps -a --format "{{.Names}}" | findstr /i "company-service-db" >nul
if not errorlevel 1 (
    echo Stopping company-service-db...
    docker stop company-service-db >nul
    docker rm company-service-db >nul
)


@REM echo Kill processes using ports 8081 and 8082 before starting Java backend services ---
@REM cd /d "%DOCKER_DIR%"
@REM docker-compose -f ./docker-compose.db.yml stop; docker ps -q | ForEach-Object { docker stop $_ }; foreach ($port in 8081,8082) { Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {Stop-Process -Id $_.OwningProcess -Force } }; netstat -ano | findstr ":8081" | findstr "LISTENING"; netstat -ano | findstr ":8082" | findstr "LISTENING"

REM --- Start docker-compose for auth service ---
echo Starting docker-compose for auth service...
docker compose -f "%DOCKER_DIR%\docker-compose.auth.yml" up -d
if errorlevel 1 (
    echo Error: Failed to start auth service docker-compose
    pause
    exit /b 1
)

echo Starting docker-compose for company db service...
docker compose -f "%DOCKER_DIR%\docker-compose.db.yml" up -d
if errorlevel 1 (
    echo Error: Failed to start company db service docker-compose
    pause
    exit /b 1
)

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