FROM nginx:stable-alpine3.17
RUN mkdir -p /usr/local/aurora-vue/blog/
RUN mkdir -p /usr/local/aurora-vue/admin/
COPY aurora-blog/dist/ /usr/local/aurora-vue/blog/
COPY aurora-admin/dist/ /usr/local/aurora-vue/admin/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80
EXPOSE 443
