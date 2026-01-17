package com.aurora.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Live2dHotArticleDTO {

    private Integer id;

    private String title;

    private String cover;

    private String summary;

    private Integer views;
}
