package com.aurora.controller;

import com.aurora.model.dto.Live2dActivityDTO;
import com.aurora.model.vo.ResultVO;
import com.aurora.service.Live2dActivityService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Api(tags = "Live2D 模块")
@RestController
public class Live2dController {

    @Autowired
    private Live2dActivityService live2dActivityService;

    @ApiOperation("获取 Live2D 活动配置")
    @GetMapping("/activities/live2d")
    public ResultVO<List<Live2dActivityDTO>> listLive2dActivities() {
        return ResultVO.ok(live2dActivityService.listLive2dActivities());
    }
}
