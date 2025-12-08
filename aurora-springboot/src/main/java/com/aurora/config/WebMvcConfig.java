package com.aurora.config;

import com.aurora.config.properties.LocalProperties;
import com.aurora.interceptor.PaginationInterceptor;
import com.aurora.interceptor.AccessLimitInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private PaginationInterceptor paginationInterceptor;

    @Autowired
    private AccessLimitInterceptor accessLimitInterceptor;

    @Value("${upload.mode:}")
    private String uploadMode;

    @Autowired(required = false)
    private LocalProperties localProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowCredentials(true)
                .allowedHeaders("*")
                .allowedOrigins("*")
                .allowedMethods("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(paginationInterceptor);
        registry.addInterceptor(accessLimitInterceptor);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if ("local".equals(uploadMode) && localProperties != null) {
            String uploadPath = localProperties.getUploadPath();
            String accessUrl = localProperties.getAccessUrl();
            
            // 提取URL路径部分，去掉域名和端口
            String urlPattern = accessUrl.substring(accessUrl.indexOf("/", accessUrl.indexOf("//") + 2));
            
            // 确保路径以/结尾
            if (!uploadPath.endsWith("/")) {
                uploadPath += "/";
            }
            if (!urlPattern.endsWith("/")) {
                urlPattern += "/";
            }
            
            registry.addResourceHandler(urlPattern + "**")
                    .addResourceLocations("file:" + uploadPath);
        }
    }

}
