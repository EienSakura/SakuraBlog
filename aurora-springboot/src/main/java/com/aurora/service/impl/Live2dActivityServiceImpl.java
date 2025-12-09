package com.aurora.service.impl;

import com.aurora.entity.Live2dActivity;
import com.aurora.mapper.Live2dActivityMapper;
import com.aurora.model.dto.Live2dActivityDTO;
import com.aurora.service.Live2dActivityService;
import com.aurora.util.BeanCopyUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.aurora.constant.CommonConstant.TRUE;

@Service
public class Live2dActivityServiceImpl extends ServiceImpl<Live2dActivityMapper, Live2dActivity> implements Live2dActivityService {

    @Override
    public List<Live2dActivityDTO> listLive2dActivities() {
        LocalDateTime now = LocalDateTime.now();
        List<Live2dActivity> activities = this.list(new LambdaQueryWrapper<Live2dActivity>()
                .eq(Live2dActivity::getIsEnable, TRUE)
                .le(Live2dActivity::getStartAt, now)
                .and(wrapper -> wrapper.ge(Live2dActivity::getEndAt, now).or().isNull(Live2dActivity::getEndAt))
                .orderByDesc(Live2dActivity::getPriority)
                .orderByDesc(Live2dActivity::getStartAt));
        return BeanCopyUtil.copyList(activities, Live2dActivityDTO.class);
    }
}
