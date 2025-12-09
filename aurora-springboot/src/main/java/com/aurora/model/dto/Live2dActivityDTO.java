package com.aurora.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Live2dActivityDTO {

    private Integer id;

    private String title;

    private String url;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    private Integer priority;

}
