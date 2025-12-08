package com.aurora.strategy.impl;

import com.aurora.config.properties.LocalProperties;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Service("localUploadStrategyImpl")
public class LocalUploadStrategyImpl extends AbstractUploadStrategyImpl {

    @Autowired
    private LocalProperties localProperties;

    @Override
    public Boolean exists(String filePath) {
        File file = new File(localProperties.getUploadPath() + filePath);
        return file.exists();
    }

    @SneakyThrows
    @Override
    public void upload(String path, String fileName, InputStream inputStream) throws IOException {
        String fullPath = localProperties.getUploadPath() + path;
        File dir = new File(fullPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        File file = new File(fullPath + fileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }
    }

    @Override
    public String getFileAccessUrl(String filePath) {
        return localProperties.getAccessUrl() + filePath;
    }

}