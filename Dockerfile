FROM postgres:15-alpine
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=mojalozinka
ENV POSTGRES_DB=RestoraniDB
COPY restorani.sql /docker-entrypoint-initdb.d/
