#!/bin/bash
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "Waiting for postgres on $host:$port..."

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres недоступен - ожидание..."
  sleep 1
done

echo "Postgres готов"

# Запускаем следующую команду
echo "Запускаем: $cmd"
exec $cmd
