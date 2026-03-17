# Build stage
FROM docker.m.daocloud.io/library/maven:3.9.9-amazoncorretto-17 AS build
WORKDIR /app
COPY settings.xml /usr/share/maven/conf/settings.xml
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM docker.m.daocloud.io/library/amazoncorretto:17-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 9203
ENTRYPOINT ["java", "-jar", "app.jar"]
