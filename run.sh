#!/bin/bash

if [ -f "paths.conf" ]; then
    source paths.conf
else
    echo "Warning: paths.conf not found!"
fi

command="$1"
shift

services="$@"

COMPOSE_SM="$CAVISE_ROOT/scenario-manager/docker-compose.yml"

case "$command" in
  build)
    echo "Building container images..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf build $services
    ;;
  up)
    echo "Creating and starting containers..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf up -d $services
    ;;
  down)
    echo "Stopping and removing containers..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf down $services
    ;;
  start)
    echo "Starting existing containers..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf start $services
    ;;
  stop)
    echo "Stopping running containers..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf stop $services
    ;;
  restart)
    echo "Restarting containers..."
    docker compose -f $CAVISE_ROOT/dc-configs/docker-compose.yml --env-file paths.conf restart $services
    ;;
  sm-up)
    echo "Starting scenario-manager..."
    docker compose -f $COMPOSE_SM --profile prod up --build -d
    xdg-open http://localhost 2>/dev/null || open http://localhost 2>/dev/null || start http://localhost
    ;;
  sm-down)
    echo "Stopping scenario-manager..."
    docker compose -f $COMPOSE_SM --profile prod down
    ;;
  sm-build)
    echo "Building scenario-manager..."
    docker compose -f $COMPOSE_SM --profile prod build
    ;;
  *)
    echo "Usage: $0 {build|up|start|stop|down|restart|sm-up|sm-down|sm-build} [services...]"
    exit 1
    ;;
esac