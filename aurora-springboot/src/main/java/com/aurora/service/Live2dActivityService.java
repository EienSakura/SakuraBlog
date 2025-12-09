package com.aurora.service;

import com.aurora.entity.Live2dActivity;
import com.aurora.model.dto.Live2dActivityDTO;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface Live2dActivityService extends IService<Live2dActivity> {

    List<Live2dActivityDTO> listLive2dActivities();

}
