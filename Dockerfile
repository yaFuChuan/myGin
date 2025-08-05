#再進行vim Dockerfile 
FROM alpine:latest
WORKDIR /app

# 直接拷贝你本地 build 好的二进制和静态资源
COPY Hipoint   /app/Hipoint
COPY ui/       /app/ui
COPY internal/ /app/internal
COPY certs/    /app/certs

EXPOSE 7204
ENTRYPOINT ["./Hipoint", "-addr", "0.0.0.0:7204"]
